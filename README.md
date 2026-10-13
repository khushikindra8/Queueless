# ⚡ QueueLess — Smart Queue Management System

[![Node.js](https://img.shields.io/badge/Node.js-v18+-68a063?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.21-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg?style=for-the-badge)](https://opensource.org/licenses/ISC)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](https://github.com/khushikindra8/Queueless/pulls)

> **Say goodbye to long waiting lines and chaotic waiting rooms.**  
> QueueLess is a modern, full-stack digital queue management solution designed for hospitals, banks, clinics, academic centers, and government service hubs.

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
  - [Customer / User Portal](#-customer--user-portal)
  - [Staff Counter Management](#-staff-counter-management)
  - [Administrator Control Hub](#-administrator-control-hub)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Database Schema](#-database-schema)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation Steps](#installation-steps)
  - [Database Setup](#database-setup)
  - [Environment Configuration](#environment-configuration)
  - [Running the Application](#running-the-application)
- [Default Login Credentials](#-default-login-credentials)
- [API Reference](#-api-reference)
- [Project Directory Structure](#-project-directory-structure)
- [Contributing](#-contributing)
- [Authors & Acknowledgments](#-authors--acknowledgments)
- [License](#-license)

---

## 🌟 Overview

Physical queues cause frustration, congestion, and operational delays. **QueueLess** eliminates traditional waiting lines by transitioning organizations to digital queues. Users receive unique digital queue tokens and track their exact position in real time from their own phones or computers, while staff and admins operate specialized portals to call, serve, and monitor customer flow effortlessly.

---

## ✨ Key Features

### 👤 Customer / User Portal
- **Instant Token Generation**: Browse available services and generate a digital queue token (e.g., `GC-001`, `BP-003`) with a single click.
- **Live Queue Tracking**: Check real-time token status (`waiting`, `called`, `serving`, `served`, `skipped`).
- **Position & Wait Estimation**: See exactly how many people are ahead in line and track average wait times.
- **One Active Token Rule**: Prevents spamming by restricting a user to one active token at a time per day.

### 👨‍💼 Staff Counter Management
- **Service Desk Selector**: Staff can switch between active service counters.
- **Next-in-Line Call System**: One-click action to call the next waiting patron.
- **Status Controls**: Mark tokens as **Serving**, **Served**, or **Skipped** (if absent).
- **Live Counter Queue Feed**: View real-time waiting lists with customer details, timestamps, and order.

### 🛠️ Administrator Control Hub
- **Real-Time Operational Analytics**:
  - Total tokens generated today
  - Active, waiting, completed, and skipped tokens
  - Service-by-service traffic breakdown
  - Real-time average wait time calculations
- **Service Management (CRUD)**: Add, edit, activate/deactivate services and assign service prefixes.
- **Role-Based User Management**: View registered users and promote/demote permissions across `user`, `staff`, and `admin` roles.

---

## 🛠 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | HTML5, CSS3 (Modern Glassmorphism & Responsive Layouts), Vanilla JavaScript (ES6+) |
| **Backend** | Node.js, Express.js |
| **Database** | MySQL (with `mysql2` connection pooling) |
| **Authentication** | `express-session` (Cookie-based sessions), `bcryptjs` (Password hashing) |
| **Security & Utilities** | CORS, Dotenv, Role-Based Access Control (RBAC) Middleware |

---

## 📐 System Architecture

```text
       ┌────────────────────────┐
       │     QueueLess UI       │
       │ (User / Staff / Admin) │
       └───────────┬────────────┘
                   │  REST API Calls (JSON & Session Cookies)
                   ▼
       ┌────────────────────────┐
       │   Express.js Server    │
       │    (Port 3000)         │
       ├────────────────────────┤
       │ 🔐 Auth Middleware     │  (Session & Role verification)
       │ 📦 Services Router     │  (/api/services)
       │ 🎫 Queue Router        │  (/api/queue)
       │ 📊 Admin Router        │  (/api/admin)
       └───────────┬────────────┘
                   │  mysql2 (Connection Pool)
                   ▼
       ┌────────────────────────┐
       │     MySQL Database     │
       │       `queueless`      │
       │                        │
       │ • users                │
       │ • services             │
       │ • tokens               │
       └────────────────────────┘
```

---

## 🗄 Database Schema

The database consists of three relational tables:

1. **`users`**
   - `id`: INT (Primary Key, Auto Increment)
   - `name`: VARCHAR(100)
   - `email`: VARCHAR(150) (Unique)
   - `password`: VARCHAR(255) (Bcrypt hashed)
   - `role`: ENUM (`'user'`, `'staff'`, `'admin'`)
   - `created_at`: DATETIME

2. **`services`**
   - `id`: INT (Primary Key, Auto Increment)
   - `name`: VARCHAR(100)
   - `prefix`: VARCHAR(5) (e.g., `GC`, `AO`, `BP`)
   - `description`: TEXT
   - `is_active`: BOOLEAN
   - `created_at`: DATETIME

3. **`tokens`**
   - `id`: INT (Primary Key, Auto Increment)
   - `token_number`: VARCHAR(20) (e.g., `GC-001`)
   - `user_id`: INT (Foreign Key -> `users.id`)
   - `service_id`: INT (Foreign Key -> `services.id`)
   - `served_by`: INT (Foreign Key -> `users.id`)
   - `status`: ENUM (`'waiting'`, `'called'`, `'serving'`, `'served'`, `'skipped'`)
   - `created_at`, `called_at`, `served_at`: DATETIME

---

## 🚀 Getting Started

Follow the instructions below to set up and run QueueLess locally.

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/) (bundled with Node.js)
- [MySQL Server](https://dev.mysql.com/downloads/mysql/) (v8.0+ or MariaDB)

---

### Installation Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/khushikindra8/Queueless.git
   cd Queueless
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

---

### Database Setup

1. Start your local MySQL service.
2. Run the provided schema script located in `config/schema.sql`. You can execute this via terminal or import it using MySQL Workbench / phpMyAdmin:

   ```bash
   mysql -u root -p < config/schema.sql
   ```

   *(This automatically creates the `queueless` database, tables, indexes, sample services, and the default admin user).*

---

### Environment Configuration

1. Create a `.env` file in the root directory (you can copy the example template):
   ```bash
   cp .env.example .env
   ```

2. Configure your environment variables in `.env`:
   ```env
   # Server Port
   PORT=3000

   # Database Connection
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=queueless

   # Session Secret
   SESSION_SECRET=your_super_secret_session_key
   ```

---

### Running the Application

- **Development mode (with auto-reload via nodemon):**
  ```bash
  npm run dev
  ```

- **Production mode:**
  ```bash
  npm start
  ```

Once started, open your browser and navigate to:
```
http://localhost:3000
```

---

## 🔑 Default Login Credentials

A pre-configured Administrator account is automatically seeded in `schema.sql`:

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@queueless.com` | `admin123` |

> *Tip: You can register standard user accounts directly via the `/register` page, and then promote them to `staff` or `admin` from the Admin Dashboard.*

---

## 📡 API Reference

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user | Public |
| `POST` | `/api/auth/login` | Authenticate user & start session | Public |
| `POST` | `/api/auth/logout` | Terminate session | Authenticated |
| `GET` | `/api/auth/me` | Get currently logged-in user profile | Authenticated |

### 🛠️ Services (`/api/services`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/services` | Get all active services | Public |
| `GET` | `/api/services/all` | Get all services (active & inactive) | Admin |
| `POST` | `/api/services` | Create a new service | Admin |
| `PUT` | `/api/services/:id` | Update service details / status | Admin |
| `DELETE` | `/api/services/:id` | Delete a service | Admin |

### 🎫 Queue Management (`/api/queue`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/queue/join` | Join a service queue & get token | User |
| `GET` | `/api/queue/my-token` | Fetch user's active token & position | User |
| `GET` | `/api/queue/status/:serviceId` | Public queue counter overview | Public |
| `GET` | `/api/queue/waiting/:serviceId`| List all waiting tokens for a service | Staff / Admin |
| `PUT` | `/api/queue/call-next/:serviceId`| Call the next ticket in line | Staff / Admin |
| `GET` | `/api/queue/current/:serviceId`| Fetch ticket currently being served | Staff / Admin |
| `PUT` | `/api/queue/serve/:tokenId` | Mark token as served | Staff / Admin |
| `PUT` | `/api/queue/skip/:tokenId` | Mark token as skipped | Staff / Admin |

### 📊 Admin Analytics & Users (`/api/admin`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/admin/dashboard` | Aggregated metrics & stats | Admin |
| `GET` | `/api/admin/users` | List all registered users | Admin |
| `PUT` | `/api/admin/users/:id/role` | Change user role (`user`/`staff`/`admin`) | Admin |

---

## 📂 Project Directory Structure

```text
queueless/
├── config/
│   ├── db.js              # MySQL connection pool configuration
│   └── schema.sql         # Database schema, tables, and seed data
├── middleware/
│   └── auth.js            # Authentication & RBAC middleware guards
├── public/                # Static frontend assets
│   ├── admin/
│   │   └── dashboard.html # Admin analytics and management view
│   ├── css/
│   │   └── style.css      # Custom styling & glassmorphic UI design
│   ├── js/
│   │   ├── admin-dashboard.js
│   │   ├── api.js         # Fetch client & HTTP helpers
│   │   ├── login.js
│   │   ├── register.js
│   │   ├── staff-dashboard.js
│   │   ├── user-dashboard.js
│   │   └── utils.js       # Toast notifications, modal helpers
│   ├── staff/
│   │   └── dashboard.html # Staff counter console
│   ├── user/
│   │   └── dashboard.html # User token tracker interface
│   ├── index.html         # Landing page
│   ├── login.html         # Login page
│   └── register.html      # Registration page
├── routes/                # Express API endpoints
│   ├── admin.js
│   ├── auth.js
│   ├── queue.js
│   └── services.js
├── .env.example           # Environment variables sample template
├── .gitignore             # Git ignore file
├── package.json           # Dependencies and scripts
├── server.js              # Express app entry point
└── README.md              # Project documentation
```

---

## 🤝 Contributing

Contributions make the open-source community a fantastic place to learn, inspire, and create. Any contributions you make are **greatly appreciated**!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 👥 Authors & Acknowledgments

Developed with ❤️ by:
- **Kuhu**
- **Khushi Kindra** ([@khushikindra8](https://github.com/khushikindra8))
- **Saksham Bajaj**

---

## 📄 License

This project is licensed under the **ISC License** — see the [package.json](package.json) file for details.
