# Campus Notification System — Design Document

## Overview

A backend notification microservice for a campus management platform. The system handles notifications related to placements, exam results, and campus events — delivering them to students through REST APIs with support for priority-based inbox, real-time delivery, and efficient data querying at scale.

---

## Stage 1 — API Design

### Base URL

```
/api/v1
```

### Notification APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/notifications` | Create a new notification |
| GET | `/notifications/:studentId` | Fetch notifications for a student |
| GET | `/notifications/priority` | Get top 10 priority unread notifications |
| PATCH | `/notifications/:id/read` | Mark notification as read |
| DELETE | `/notifications/:id` | Soft-delete a notification |

### Placement APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/placements` | List all active placement drives |
| GET | `/placements/:id` | Get details of a specific drive |
| POST | `/placements` | Create placement drive notification |

### Event APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/events` | List upcoming campus events |
| POST | `/events` | Create a new event notification |

### Result APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/results/:studentId` | Get result notifications for a student |
| POST | `/results` | Publish result notification |

### Request/Response Contracts

**POST /notifications**
```json
// Request
{
  "studentId": "STU1042",
  "type": "placement",
  "title": "TCS On-Campus Drive",
  "message": "TCS is visiting on 15th May. Eligible branches: CSE, IT",
  "priority": "high"
}

// Headers
Content-Type: application/json
Authorization: Bearer <token>

// Response — 201 Created
{
  "success": true,
  "data": {
    "id": "notif_abc123",
    "studentId": "STU1042",
    "type": "placement",
    "title": "TCS On-Campus Drive",
    "isRead": false,
    "createdAt": "2026-05-11T10:30:00Z"
  }
}
```

**GET /notifications/:studentId**
```json
// Response — 200 OK
{
  "success": true,
  "count": 25,
  "page": 1,
  "data": [
    {
      "id": "notif_abc123",
      "type": "placement",
      "title": "TCS On-Campus Drive",
      "message": "...",
      "isRead": false,
      "priority": "high",
      "createdAt": "2026-05-11T10:30:00Z"
    }
  ]
}
```

### Status Codes Used

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request / validation error |
| 401 | Missing or invalid auth token |
| 404 | Resource not found |
| 429 | Rate limited |
| 500 | Server error |
| 502 | Upstream API failure |

### Real-Time Notification Proposal

For real-time delivery, I'd go with **WebSockets** (using Socket.IO on Node.js):

- When a new notification is created, the server emits it to the student's socket room
- Client subscribes on login and receives push updates instantly
- Fallback to polling every 30s for clients that lose WS connection
- This avoids the overhead of constant HTTP polling while giving near-instant delivery
- For a campus system with ~5-10K concurrent students, a single WebSocket server instance is sufficient. Beyond that, use Redis pub/sub to fan out across multiple instances.

The alternative is Server-Sent Events (SSE), which is simpler but only supports one-way communication. For a notification system where we mostly push data from server to client, SSE is actually a reasonable choice — lighter than full WebSocket and works over standard HTTP.

---

## Stage 2 — Database Design

### Database Choice: PostgreSQL (Relational)

I'm going with a relational database here for a few practical reasons:

1. **Structured data** — notifications have a fixed schema (type, title, message, studentId, timestamps). There's no need for flexible/nested documents.
2. **Querying patterns** — we frequently filter by `studentId`, `type`, `isRead`, and sort by `createdAt`. SQL handles this cleanly with indexed queries.
3. **Joins** — linking notifications to students, placements, or results is straightforward with foreign keys. In NoSQL you'd end up denormalizing or doing multiple queries.
4. **ACID guarantees** — when we mark notifications as read or do batch inserts, we want transactional safety without worrying about eventual consistency.

A NoSQL option like MongoDB would work too (and might be simpler for a quick prototype), but at campus scale with structured notification categories and the need for complex filtering, PostgreSQL is the better long-term fit.

### Schema Design

```sql
CREATE TABLE students (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    branch VARCHAR(50),
    year INT
);

CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(20) REFERENCES students(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('placement', 'result', 'event')),
    title VARCHAR(255) NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE placements (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(100) NOT NULL,
    role VARCHAR(100),
    eligible_branches TEXT[],
    drive_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE results (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(20) REFERENCES students(id),
    subject VARCHAR(100),
    grade VARCHAR(5),
    semester INT,
    published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes

```sql
CREATE INDEX idx_notif_student_read ON notifications(student_id, is_read);
CREATE INDEX idx_notif_created ON notifications(created_at DESC);
CREATE INDEX idx_notif_type ON notifications(type);
```

### Scaling Considerations

- **Read-heavy workload** — students check notifications way more often than new ones are created. Read replicas would handle this well.
- **Partitioning** — if the notifications table grows very large, partition by `created_at` (monthly). Old notifications can be archived.
- **Connection pooling** — use PgBouncer to handle connection limits. A campus app might have burst traffic during result announcements.
- **Caching hot queries** — the "unread count" query runs constantly. Cache it in Redis with a short TTL (30-60s) and invalidate on write.

---

## Stage 3 — Query Optimization

### Given Query

```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt DESC;
```

### Why This Gets Slow

1. **Full table scan** — without an index on `(studentID, isRead)`, the database has to check every row. With 10M+ notifications across all students, this is expensive.
2. **SELECT \*** — pulls all columns including potentially large `message` TEXT fields, even if the client only needs title and timestamp for a list view.
3. **Sorting without index** — `ORDER BY createdAt DESC` on unindexed data forces an in-memory sort (filesort), which is O(n log n) on the filtered result set.
4. **No pagination** — returns ALL matching rows. A student who's been around for 4 years might have thousands of notifications.

### Computation Cost

Without indexes, this query is effectively `O(N)` for the scan where N = total rows in the table, plus `O(k log k)` for the sort where k = matching rows. For a table with millions of rows, this means seconds of latency per request.

### Optimized Approach

```sql
-- composite index that covers the exact query pattern
CREATE INDEX idx_student_unread_recent
ON notifications(student_id, is_read, created_at DESC);
```

With this covering index, the database does a range scan directly — no table scan, no filesort. The query planner walks the B-tree to `student_id = 1042, is_read = false` and reads rows already sorted by `created_at DESC`.

```sql
-- optimized query
SELECT id, type, title, priority, created_at
FROM notifications
WHERE student_id = 'STU1042'
  AND is_read = false
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;
```

Changes made:
- **Select only needed columns** instead of `*`
- **Added LIMIT/OFFSET** for pagination
- **Uses the composite index** for both filtering and ordering

### Tradeoffs

- Adding indexes speeds up reads but slows down writes slightly (each INSERT now updates the index B-tree)
- For a notification system where reads >> writes, this tradeoff is easily worth it
- The composite index takes extra disk space, but for `(varchar, boolean, timestamp)` it's minimal

### Placement Notification Query

```sql
-- students who received placement-type notifications
SELECT DISTINCT s.id, s.name, s.email, s.branch
FROM students s
INNER JOIN notifications n ON s.id = n.student_id
WHERE n.type = 'placement'
  AND n.is_deleted = false
ORDER BY s.name;
```

This benefits from the `idx_notif_type` index on `notifications.type`.

---

## Stage 4 — Performance Improvements

### Problem: Fetching Notifications on Every Page Load

If the client fires `GET /notifications/:studentId` on every page load or route change, we're:

- Hitting the database repeatedly for data that probably hasn't changed
- Wasting server resources on redundant queries
- Adding unnecessary latency to page renders
- Under load (e.g., result day), this can cascade into DB connection pool exhaustion

### Practical Solutions

**1. Caching with Redis**

Cache the notification list per student with a short TTL (30-60 seconds). Invalidate on new notification write.

```
Key: notif:STU1042:unread
Value: JSON array of notifications
TTL: 60s
```

This alone eliminates 90%+ of redundant DB hits. On result announcement day when 5000 students refresh simultaneously, Redis serves from memory instead of hammering PostgreSQL.

**2. Cursor-Based Pagination**

Instead of loading all notifications, fetch 20 at a time using cursor pagination:

```
GET /notifications/STU1042?after=notif_abc123&limit=20
```

Cursor pagination is more efficient than OFFSET for large datasets because it doesn't need to count/skip rows. It also handles real-time inserts correctly (no missed or duplicate items when new notifications arrive).

**3. WebSocket for Real-Time Updates**

Instead of polling, push new notifications via WebSocket:

```
Client connects → subscribes to room "STU1042"
Server creates notification → emits to room
Client updates UI without any HTTP call
```

This replaces polling entirely for active sessions.

**4. Conditional Fetching (ETag/Last-Modified)**

Return an `ETag` header with the notification response. Client sends `If-None-Match` on subsequent requests. If nothing changed, return `304 Not Modified` with empty body — saves bandwidth and processing.

**5. Unread Count Endpoint**

Instead of fetching full notifications to show a badge count, add a lightweight endpoint:

```
GET /notifications/STU1042/count → { "unread": 3 }
```

This is cheap to compute (or serve from cache) and covers the most common use case.

### Tradeoff Summary

| Approach | Benefit | Cost |
|----------|---------|------|
| Redis cache | Huge read reduction | Extra infra, cache invalidation logic |
| Pagination | Less data per request | More API calls for full history |
| WebSocket | True real-time, no polling | Connection management, fallback needed |
| ETag | Saves bandwidth | Slight server-side computation |
| Count endpoint | Very lightweight | Doesn't replace full fetch |

In practice, I'd start with **Redis cache + pagination** as they give the biggest bang for the effort. Add WebSocket later if real-time delivery becomes a product requirement.

---

## Stage 5 — Notify All Optimization

### Given Implementation

```python
notify_all(student_ids, message):
    for student_id in student_ids:
        send_email(student_id, message)
        save_to_db(student_id, message)
        push_to_app(student_id, message)
```

### What's Wrong With This

**1. It's synchronous and sequential**

If we have 5000 students and each iteration takes ~200ms (email API + DB write + push notification), that's 5000 × 200ms = ~17 minutes to send one broadcast. The HTTP request that triggered this will timeout long before that.

**2. No error isolation**

If `send_email` fails for student #347, the whole loop could crash. Even with a try-catch, a temporary email provider outage blocks everything.

**3. DB writes one at a time**

Individual `save_to_db` calls mean 5000 separate INSERT statements. That's 5000 round trips to the database when a single batch insert could do it in one.

**4. No retry mechanism**

If the push notification fails, it's just lost. There's no way to know which students didn't get notified or retry failed deliveries.

**5. Blocks the main thread**

In Node.js, this loop blocks the event loop. The server can't handle any other requests while it's grinding through 5000 students.

### Scalable Redesign

```
┌──────────┐     ┌─────────────┐     ┌──────────────┐
│ API call  │────▶│ Message     │────▶│ Workers      │
│ (trigger) │     │ Queue       │     │ (consumers)  │
└──────────┘     │ (Redis/     │     │              │
                 │  RabbitMQ)  │     │ ┌──────────┐ │
                 └─────────────┘     │ │ Email    │ │
                                     │ │ Worker   │ │
                                     │ ├──────────┤ │
                                     │ │ DB Batch │ │
                                     │ │ Writer   │ │
                                     │ ├──────────┤ │
                                     │ │ Push     │ │
                                     │ │ Worker   │ │
                                     │ └──────────┘ │
                                     └──────────────┘
```

**Step 1: Decouple with a message queue**

When `notify_all` is called, don't do any work inline. Instead, push a job to a message queue (Redis with BullMQ, or RabbitMQ). The API returns `202 Accepted` immediately.

```javascript
async function notifyAll(studentIds, message) {
    // batch insert notifications first
    await Notification.insertMany(
        studentIds.map(id => ({ studentId: id, message, status: 'pending' }))
    );

    // fan out to queue
    for (const id of studentIds) {
        await queue.add('send-notification', { studentId: id, message });
    }
}
```

**Step 2: Worker-based processing**

Separate worker processes consume from the queue. Each worker handles one notification at a time with retry logic:

- Email worker pulls job → calls email API → marks success/failure
- Push worker pulls job → calls FCM → marks success/failure
- Workers run independently, so email failures don't block push notifications

**Step 3: Batch DB operations**

Instead of one INSERT per student, collect notifications in batches of 500-1000 and do a single `INSERT ... VALUES (...), (...), (...)`. This reduces DB round trips from 5000 to ~10.

**Step 4: Retry with backoff**

Failed jobs go back to the queue with exponential backoff (retry after 1s, 5s, 30s). After 3 failures, move to a dead letter queue for manual inspection.

**Step 5: Rate limiting**

Email providers throttle you at ~100 emails/second. The queue naturally handles this — set the worker concurrency to match the provider's rate limit.

### DB Consistency

- The batch insert happens first (synchronous, transactional). This guarantees every student has a notification record.
- Delivery status is updated by workers after the fact. If the email worker crashes, the notification record still exists with `status: pending` — a recovery job can pick these up.
- Using a queue with acknowledgment (RabbitMQ ACK or BullMQ job completion) ensures no message is lost even if a worker dies mid-processing.

---

## Stage 6 — Priority Inbox

### Approach

Fetch all notifications from the upstream protected API, score them using a weighted formula based on type and recency, then return the top 10 unread notifications.

### Scoring Logic

```
score = typeWeight + recencyBonus
```

| Type | Weight |
|------|--------|
| placement | 100 |
| result | 70 |
| event | 40 |

Recency bonus: notifications from the last 24h get +15, last 3 days get +8, last week get +3.

This ensures a placement notification from today always ranks above a week-old event, but a very recent event can outrank an older result.

### Implementation

See `notification_app_be/` for the full working code. Key files:

- `src/services/notificationService.js` — fetches upstream, filters unread, applies scoring
- `src/utils/scorer.js` — scoring/ranking utility
- `src/controllers/notificationController.js` — handler for priority endpoint
- `src/utils/apiClient.js` — axios instance with Bearer token

Endpoint: `GET /api/v1/notifications/priority`
