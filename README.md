# Campus Management & Maintenance System

A modular back-end solution created for a coding challenge with a focus on efficient algorithms, notification ranking, and logging infrastructure. Three distinct modules can be found in this repo; namely, the Vehicle Maintenance Planner, Priority Notification System, and a logging utility middleware.

---

## Project Background

The solution aims at addressing the following key campus challenges:

1. **Maximize Maintenance Impact** — The system will employ the 0/1 Knapsack algorithm to achieve maximum efficiency when conducting vehicle maintenance based on the time constraints of mechanics.
2. **Manage Notifications** — An inbox with prioritization features where notifications (placements, event results, events) are ranked by their priority and freshness.

---

## System Architecture

The architecture is microservices-oriented, implemented with Node.js and ES6 (ES Modules).

- **Evaluation Service (Upstream)** — Raw data is taken from the upstream evaluation API.
- **Back-end Services** — Transform raw data into the results, apply necessary algorithms and business rules, and provide the results to the client.
- **Logging Middleware** — A utility component responsible for shipping log entries to an upstream evaluation service.

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

Run these following command inside each module folder:

```bash
cd logging_middleware && npm install
cd ../vehicle_maintence_scheduler && npm install
cd ../notification_app_be && npm install
```

### Environment Configuration

Each module requires a `.env` file. The templates are available in `.env.example`.

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

AAll integrations were tested and validated through Postman. The backend operates according to the Fetch, Process, and Serve pattern for all modules. Live responses from the upstream evaluation service are shown in the screenshots below.
---

### 1. Depots Endpoint

**GET** `http://4.224.186.213/evaluation-service/depots`

Returns the entire set of depot information along with the hours that a mechanic can work at a particular depot. This acts as the capacity constraint in
**Sample Response**

```json
{
  "depots": [
    { "ID": 4, "MechanicHours": 97 },
    { "ID": 5, "MechanicHours": 164 }
  ]
}
```

<img width="1470" height="924" alt="Screenshot 2026-05-11 at 1 45 41 PM" src="https://github.com/user-attachments/assets/db05eac2-4c21-413d-8648-8354beb0892a" />


---

### 2. Vehicles Endpoint

**GET** `http://4.224.186.213/evaluation-service/vehicles`

This endpoint contains information about all vehicle repair jobs, including cost and value associated with each repair job. These details are provided to the knapsack optimizer for scheduling repairs based on the depot.

**Sample
```json
{
  "vehicles": [
    { "TaskID": "c8054ffd-2894-4d16-870e-ab71d5415cc9", "Duration": 8, "Impact": 10 },
    { "TaskID": "3386ea04-e9bc-49ce-8e3a-983f6efef96b", "Duration": 6, "Impact": 6 },
    { "TaskID": "d00bac82-2570-4bb8-8d0a-2c07d54890f8", "Duration": 5, "Impact": 2 }
  ]
}
```

<img width="1470" height="956" alt="Screenshot 2026-05-11 at 1 46 02 PM" src="https://github.com/user-attachments/assets/959c9cf8-24c8-4cce-a47d-90ccc4f78dce" />


---

### 3. Notifications Endpoint

**GET** `http://4.224.186.213/evaluation-service/notifications`

Fetches all the campus notifications which are sorted out based on their type, message, and timestamp. These notifications are then processed by the priority scoring algorithm to get the most relevant ones

| Type | Base Score |
|---|---|
| Placement | 100 pts |
| Result | 70 pts |
| Event | 40 pts |

A +15 point recency bonus is granted when notifications have been received during the past 24 hours. Malformed and read notifications will be screened out from all other rankings.

**Sample Response**

```json
{
  "notifications": [
    {
      "ID": "4e30a7db-7e5a-4ca4-9e9f-cd4542354a77",
      "Type": "Placement",
      "Message": "Alphabet Inc. Class C hiring",
      "Timestamp": "2026-05-10 14:16:15"
    },
    {
      "ID": "ef227f54-fe5f-4857-8765-f4e5641d17fa",
      "Type": "Event",
      "Message": "induction",
      "Timestamp": "2026-05-10 16:46:07"
    }
  ]
}
```

<img width="1470" height="956" alt="Screenshot 2026-05-11 at 1 46 18 PM" src="https://github.com/user-attachments/assets/5cd779a0-a639-4a00-a604-af7280424e74" />


---

### 4. Maintenance Scheduler - Local API

**GET** `/api/v1/schedule`

- Pulls from `/depots` and `/vehicles` endpoints upstream.
- Implements the bottom-up dynamic programming knapsack algorithm for each depot.
- Sends back the best combination of tasks for each vehicle under mechanic hour constraints.

---

### 5. Logging Utility

- Injected to all axios calls and errors handlers in both services.
- Sends logs upstream automatically to `/logs` endpoint with mandatory signature `Log(stack, level, package, message)`.

---

## System Design and Scalability (Stages 1 to 5)

Full explanations of API contracts, design of the database schema with PostgreSQL, composite index optimization techniques, and message queue designs for mass notification can be found in [notification_system_design.md](./notification_system_design.md).

---

## Author

**Abhimanyu Pratap Singh**  
Roll No: E23CSEU0193  
Bennett University
