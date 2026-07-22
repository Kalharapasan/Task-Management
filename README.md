# Task Management System

🚀 **Live Deployment Links:**
- **Frontend App:** [https://task-management-frontend-psi-ruddy.vercel.app](https://task-management-frontend-psi-ruddy.vercel.app)
- **Backend API:** [https://task-management-backend-mu-three.vercel.app](https://task-management-backend-mu-three.vercel.app)

---

## Project Overview

The **Task Management System** is a full-stack web application designed for managing daily tasks with user authentication, task organization, status tracking, search, filtering, sorting, pagination, and data visualization.

The project is structured into two main applications:
- **`backend/`** — A RESTful API built with **Node.js**, **Express.js**, and **MySQL**. It handles authentication using short-lived JWT access tokens and rotating `httpOnly` refresh token cookies, user sessions, full task CRUD operations, pagination, search, filtering, sorting, and dashboard statistics queries.
- **`frontend/`** — A single-page application (SPA) built with **React.js** (via **Vite**) and styled using **Tailwind CSS**. It provides an intuitive interface for user login, dashboard task statistics with interactive charts, paginated task lists with search/filter controls, and a Kanban board with drag-and-drop workflow capability.

### 🌟 Bonus Features Implemented
All requested optional bonus features are fully implemented:
- **Pagination:** Server-side pagination with configurable page limits (`page`/`limit` params) and interactive client UI controls.
- **Dark Mode:** Comprehensive Dark Mode support with a light/dark theme toggle (Sun/Moon icon) persisted in `localStorage`.
- **Docker Support:** `docker-compose.yml` orchestrating MySQL database, Express backend, and React frontend containers.
- **Unit & Integration Tests:** Full Jest + Supertest integration test suite covering Auth lifecycle, Task CRUD, validation, and bulk operations.
- **Loading Indicators:** Skeleton loading states and animated spinners across pages and form submission triggers.
- **Toast Notifications:** Reactive toast popup notification system for user feedback on actions (success, error, warning).
- **Refresh Token Authentication:** Short-lived access tokens (15 mins) paired with rotating httpOnly refresh token cookies (7 days).
- **Deployment:** Live automated deployment pipeline set up on Vercel for both Frontend and Serverless Backend.

---

## Technology Stack

### Frontend
- **Framework & Tooling:** React 18, Vite
- **Routing:** React Router v6
- **Styling:** Tailwind CSS, PostCSS, Autoprefixer (with Dark Mode support)
- **Data Fetching:** Axios (with automatic token refresh interceptors)
- **Icons & Visualization:** Lucide React, Recharts

### Backend
- **Runtime & Framework:** Node.js, Express.js
- **Database:** MySQL (using `mysql2` connection pool)
- **Authentication:** JSON Web Tokens (`jsonwebtoken`), Password Hashing (`bcryptjs`), Cookie Parser (`cookie-parser`)
- **Security & Utilities:** Helmet, CORS, Express Rate Limit, Compression, Morgan

### Testing & DevOps
- **Testing:** Jest, Supertest (Backend integration testing)
- **Containerization:** Docker, Docker Compose
- **Deployment:** Vercel (Frontend & Serverless Backend)

---

## Installation Instructions

### Prerequisites
- **Node.js:** `v18.x` or higher
- **npm:** `v9.x` or higher
- **MySQL Server:** `v8.x` or MariaDB `v10.11+` (or Docker for containerized setup)

### Steps

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd "Task Management"
   ```

2. **Install Backend Dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```

---

## Environment Variables

Copy the example environment files in both `backend` and `frontend` directories and update them according to your configuration.

### Backend (`backend/.env`)
Create a `backend/.env` file (refer to `backend/.env.example`):

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=task_management
DB_USER=root
DB_PASSWORD=your_mysql_password

# Authentication Tokens
JWT_SECRET=your_jwt_secret_key_here
ACCESS_TOKEN_EXPIRES_IN=15m

JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here
REFRESH_TOKEN_EXPIRES_IN=7d

COOKIE_SAME_SITE=lax

# Seed Account Credentials
DEFAULT_USER_NAME=Admin User
DEFAULT_USER_EMAIL=admin@test.com
DEFAULT_USER_PASSWORD=123456
```

### Frontend (`frontend/.env`)
Create a `frontend/.env` file (refer to `frontend/.env.example`):

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## Database Setup

1. **Start your MySQL server.**
2. **Execute the SQL Schema Script:**
   Import `backend/database/schema.sql` into your MySQL instance to create the database (`task_management`), table schemas, and default seeded data.

   ```bash
   mysql -u root -p < backend/database/schema.sql
   ```

3. **Default Seed Account Credentials:**
   - **Email:** `admin@test.com`
   - **Password:** `123456`

4. **Optional - Reseed Data via Script:**
   To reset or reseed the database using Node.js:
   ```bash
   cd backend
   npm run seed
   ```

---

## Running the Backend

From the project root directory:

```bash
cd backend
npm run dev
```

- The API server will start at `http://localhost:5000`.
- Health check endpoint: `GET http://localhost:5000/api/health`

*To run integration tests:*
```bash
npm test
```

---

## Running the Frontend

From the project root directory:

```bash
cd frontend
npm run dev
```

- The frontend application will start at `http://localhost:5173`.
- Open `http://localhost:5173` in your browser and sign in using the seed account (`admin@test.com` / `123456`).

---

## API Documentation

All API routes are prefixed with `/api`. Protected routes require a Bearer Access Token in the `Authorization` header (`Authorization: Bearer <accessToken>`).

### Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Description | Request Body | Auth Required |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user, return access token & set refresh cookie | `{ "email": "...", "password": "..." }` | No |
| `POST` | `/api/auth/refresh` | Rotate refresh token cookie and issue new access token | None (Reads httpOnly cookie) | No |
| `POST` | `/api/auth/logout` | Revoke refresh token session & clear auth cookie | None | Yes |
| `GET` | `/api/auth/me` | Fetch details of currently authenticated user | None | Yes |

### Task Endpoints (`/api/tasks`)

| Method | Endpoint | Description | Query / Request Body | Auth Required |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/tasks` | Fetch paginated tasks with search/filter | Query: `search`, `status`, `priority`, `sort`, `page`, `limit` | Yes |
| `GET` | `/api/tasks/:id` | Fetch single task by ID | Path Param: `:id` | Yes |
| `POST` | `/api/tasks` | Create a new task | `{ "title": "...", "description": "...", "priority": "High", "status": "Pending", "due_date": "YYYY-MM-DD" }` | Yes |
| `PUT` | `/api/tasks/:id` | Update an existing task | `{ "title": "...", "description": "...", "priority": "...", "status": "...", "due_date": "..." }` | Yes |
| `DELETE` | `/api/tasks/:id` | Delete a task | Path Param: `:id` | Yes |
| `PATCH` | `/api/tasks/bulk/status` | Bulk update status for multiple tasks | `{ "ids": [1, 2], "status": "Completed" }` | Yes |
| `DELETE` | `/api/tasks/bulk` | Bulk delete multiple tasks | `{ "ids": [1, 2] }` | Yes |
| `GET` | `/api/tasks/stats/dashboard` | Get aggregate task statistics for dashboard | None | Yes |

---

## Assumptions Made

1. **Pre-seeded Account Access:** User registration is disabled by default; access relies on the seeded administrator user credentials or manually seeded accounts.
2. **Dual-Token Authentication Strategy:** Access tokens are short-lived (15 minutes) and stored in-memory by the frontend client for enhanced security. Refresh tokens are stored in `httpOnly` cookies with rotating sessions.
3. **Due Date Validation:** The rule preventing past `due_date` values is enforced during task creation (`POST /api/tasks`). Updating existing tasks permits modifying status or due dates without blocking historical tasks.
4. **Task Title Search:** Search queries perform case-insensitive partial string matching on task titles.
5. **Overdue Task Logic:** A task is deemed "Overdue" when its `due_date` is prior to today's date and its status is not `Completed`.

---

## Known Limitations

1. **Password Recovery:** Self-service password reset or "Forgot Password" email workflows are not implemented.
2. **User Management UI:** Creating, editing, or managing user accounts through the graphical interface is not included (single-tenant / seeded user model).
3. **Notification System:** Real-time email or push notifications for upcoming task due dates are not integrated.
