# Campus Management & Maintenance System

A modular back-end system has been developed that caters to the coding assignment and involves efficient algorithms, real-time notification ranking, and central logging mechanism. The present repository comprises three main modules: Vehicle Maintenance Scheduler, Priority Notification System, and Logging Middleware.

---

## Project Overview

The system is designed to handle two main campus challenges:

1. **Maintenance Optimization** – Maximizing the effect of repairs to vehicles under limited mechanic time by applying the 0/1 knapsack problem.
2. **Notification Management** – An inbox system which ranks campus notifications based on their priority and timestamping.

---

## System Architecture

The architectural style used in the design pattern is a modular microservices architecture using Node.js and Express (ES Modules).

- **Evaluation Service (Upstream)** — All the data will be sourced from the evaluation API available.
- **Local Backends** — Raw data processing, applying business rules/ algorithms, and providing the processed data to the client.
- **Logging Middleware** — A logging utility which helps log data to an evaluation endpoint.
---

## Repository Structure

```
E23CSEU0193/
├── logging_middleware/            # Centralized logging logic
├── vehicle_maintence_scheduler/   # Maintenance optimization API
├── notification_app_be/           # Priority notification service
├── notification_system_design.md  # Technical design and Stage 1–5 answers
└── README.md
```

---

## Setup and Installation

### Prerequisites

- Node.js v18 or above
- npm

### Install Dependencies

Run the following command inside each module folder:

```bash
cd logging_middleware && npm install
cd ../vehicle_maintence_scheduler && npm install
cd ../notification_app_be && npm install
```

### Environment Configuration

Each module requires a `.env` file. Templates are available in `.env.example`.

Make sure to set your `ACCESS_TOKEN` in all three modules before running the services.

```env
PORT=4000
ACCESS_TOKEN=your_jwt_token_here
BASE_URL=http://4.224.186.213/evaluation-service
NODE_ENV=development
```

---

## Running the Services

### Vehicle Scheduler — Port 4000

```bash
cd vehicle_maintence_scheduler
npm run dev
```

### Notification App — Port 5000

```bash
cd notification_app_be
npm run dev
```

---

## API Documentation

The integration of Postman has been tested for all APIs. All APIs follow a standard pattern of Fetching, Processing, and Serving.

### 1. Maintenance Scheduler

**Endpoint:** `GET /api/v1/schedule`

- Fetches data from the `/depots` and `/vehicles` upstream APIs.
- Uses a bottom-up dynamic programming algorithm to determine the best repair task set.
- Returns the set of tasks that produce the maximum effect at each depot based on available mechanic time slots.
### 2. Priority Notifications

**Endpoint:** `GET /api/v1/notifications/priority`

- Retrieves notifications from the `/notifications` upstream endpoint.
- Priority scoring system:
  - Positioning – 100 points
  - Outcome – 70 points
  - Event – 40 points
  - Freshness bonus – maximum +15 points for notifications received in the last 24 hours
- Excludes read or corrupted notifications, returning only the top 10 most significant notifications.

### 3. Logging Utility

- This is embedded within all axios requests and error handlers in both applications.
- Automatically sends the logs to the parent `/logs` API end-point with the required signature `Log(stack, level, package, message)`.

---

## Design and Scaling (Stage 1 through 5)

Answers to questions pertaining to the API contracts, designing a database schema using PostgreSQL, optimizing queries using composite indexes, and queuing system for mass notification messages are provided in [notification_system_design.md](./notification_system_design.md).

---

## Author

**Abhimanyu Pratap Singh**  
Roll No: E23CSEU0193  
Bennett University
