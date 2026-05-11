Campus Management & Maintenance System
A modular backend system built for a coding assessment, focusing on high-performance algorithms, real-time notification ranking, and centralized logging. This repository contains three primary modules: a Vehicle Maintenance Scheduler, a Priority Notification Service, and a reusable Logging Middleware.
Project Overview
The system is designed to handle two main campus challenges:

Maintenance Optimization: Using the 0/1 Knapsack algorithm to maximize the impact of vehicle repairs within fixed mechanic hour constraints.
Notification Management: A priority-based inbox that scores and ranks campus alerts (Placements, Results, Events) based on type importance and recency.


System Architecture
The architecture follows a modular microservice-style approach using Node.js and Express (ES Modules).

Evaluation Service (Upstream): All data is fetched from the provided evaluation API.
Local Backends: Process raw data, apply business logic and algorithms, and serve processed results to the client.
Logging Middleware: A shared utility that ships logs to a central evaluation endpoint.


Repository Structure
textE23CSEU0193/
├── logging_middleware/            # Centralized logging logic
├── vehicle_maintence_scheduler/   # Maintenance optimization API
├── notification_app_be/           # Priority notification service
├── notification_system_design.md  # Technical design and Stage 1-5 answers
└── README.md

Setup and Installation
Prerequisites

Node.js (v18 or above)
npm

Install Dependencies
Run the following in each module folder:
bashcd logging_middleware && npm install
cd ../vehicle_maintence_scheduler && npm install
cd ../notification_app_be && npm install
Environment Configuration
Each module requires a .env file. Templates are available in .env.example.
Make sure to set your ACCESS_TOKEN in all three modules before running anything.
envPORT=4000
ACCESS_TOKEN=your_jwt_token_here
BASE_URL=http://4.224.186.213/evaluation-service
NODE_ENV=development

Running the Services
Vehicle Scheduler (Port 4000)
bashcd vehicle_maintence_scheduler
npm run dev
Notification App (Port 5000)
bashcd notification_app_be
npm run dev

API Documentation and Testing
All integrations have been verified using Postman. The backend follows a consistent Fetch, Process, and Serve flow across all modules.
1. Maintenance Scheduler — GET /api/v1/schedule

Fetches data from the /depots and /vehicles upstream endpoints.
Implements a bottom-up dynamic programming approach to find the optimal repair set.
Returns a list of tasks that yield the highest impact for each depot within the available mechanic hours.

2. Priority Notifications — GET /api/v1/notifications/priority

Fetches alerts from the /notifications upstream endpoint.
Ranking logic:

Placement (100 pts) ranks above Result (70 pts), which ranks above Event (40 pts).
A recency bonus of up to +15 points is added for messages received within the last 24 hours.


Filters out read or malformed messages and returns the top 10 most relevant alerts.

3. Logging Utility

Injected into all axios requests and error handlers across both services.
Automatically ships logs to the upstream /logs endpoint using the required signature: Log(stack, level, package, message).


Design and Scaling (Stage 1 through 5)
Detailed answers covering API contracts, database schema design using PostgreSQL, query optimization with composite indexing, and message queue architecture for bulk notifications are documented in notification_system_design.md.

Author
Abhimanyu Pratap Singh
Roll No: E23CSEU0193
Bennett University
