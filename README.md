# Campus Management & Maintenance System

A modular backend system built for a coding assessment, focusing on high-performance algorithms, real-time notification ranking, and centralized logging. This repository contains three primary modules: a Vehicle Maintenance Scheduler, a Priority Notification Service, and a reusable Logging Middleware.

## 🚀 Project Overview

The system is designed to handle two main campus challenges:
1.  **Maintenance Optimization**: Using the **0/1 Knapsack algorithm** to maximize the impact of vehicle repairs within fixed mechanic hour constraints.
2.  **Notification Management**: A priority-based inbox that scores and ranks campus alerts (Placements, Results, Events) based on type importance and recency.

---

## 🏗️ System Architecture

The architecture follows a modular microservice-style approach using Node.js and Express (ES Modules).

-   **Evaluation Service (Upstream)**: All data is fetched from the provided evaluation API.
-   **Local Backends**: Process raw data, apply business logic/algorithms, and serve processed results to the client.
-   **Logging Middleware**: A shared utility that ships logs to a central evaluation endpoint.

---

## 📂 Repository Structure

```text
E23CSEU0193/
├── logging_middleware/        # Centralized logging logic
├── vehicle_maintence_scheduler/ # Maintenance optimization API
├── notification_app_be/       # Priority notification service
├── notification_system_design.md # Technical design & Stage 1-5 answers
└── README.md
```

---

## 🛠️ Setup & Installation

### 1. Prerequisites
- Node.js (v18+)
- npm

### 2. Install Dependencies
Run the following in each folder:
```bash
cd logging_middleware && npm install
cd ../vehicle_maintence_scheduler && npm install
cd ../notification_app_be && npm install
```

### 3. Environment Configuration
Each module requires a `.env` file. You can find templates in `.env.example`.
**Important**: Set your `ACCESS_TOKEN` in all three modules.

```env
PORT=4000
ACCESS_TOKEN=your_jwt_token_here
BASE_URL=http://4.224.186.213/evaluation-service
NODE_ENV=development
```

---

## 🚦 Running the Services

### Start Vehicle Scheduler (Port 4000)
```bash
cd vehicle_maintence_scheduler
npm run dev
```

### Start Notification App (Port 5000)
```bash
cd notification_app_be
npm run dev
```

---

## 🧪 API Documentation & Testing

I have used **Postman** to verify all integrations. The backend process follows a "Fetch → Process → Serve" flow.

### 1. Maintenance Scheduler (`GET /api/v1/schedule`)
- Fetches data from `/depots` and `/vehicles` upstream.
- Implements a bottom-up Dynamic Programming approach to find the optimal repair set.
- Returns a list of tasks that yield the highest impact for each depot.

### 2. Priority Notifications (`GET /api/v1/notifications/priority`)
- Fetches alerts from `/notifications` upstream.
- **Ranking Logic**: 
  - Placement (100 pts) > Result (70 pts) > Event (40 pts).
  - Recency Bonus: Up to +15 pts for messages within 24 hours.
- Filters out read/malformed messages and returns the top 10 most relevant alerts.

### 3. Logging Utility
- Injected into all axios requests and error handlers.
- Automatically ships logs to the upstream `/logs` endpoint with the required signature: `Log(stack, level, package, message)`.

---

## 📝 Design & Scaling (Stage 1 - 5)
Detailed answers regarding API contracts, Database Schema (PostgreSQL), Query Optimization (Composite Indexing), and Message Queue architectures for bulk notifications can be found in [notification_system_design.md](./notification_system_design.md).

---

## 👤 Author
**Abhimanyu Pratap Singh**
Roll No: E23CSEU0193
Bennett University
