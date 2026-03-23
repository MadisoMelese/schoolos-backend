# SchoolOS Backend

> A comprehensive, open-source School Management Information System (MIS) REST API built with Node.js, Express, TypeScript, and MongoDB.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Authentication](#authentication)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

SchoolOS is a production-ready backend system designed for schools of all sizes. It provides a complete REST API for managing every aspect of a school, from students and teachers to exams, fees, attendance, and more.

The authentication system is powered by [Authforge-Express](https://github.com/hamidukarimi/authforge-express), a robust JWT-based auth system with access/refresh token rotation, session management, and role-based access control.

---

## Features

- **Authentication & Authorization** — JWT access/refresh tokens, session management, role-based access (admin, teacher, student, parent)
- **Student Management** — Full CRUD, filtering, search, and pagination
- **Teacher Management** — Full CRUD with subject and qualification tracking
- **Class Management** — Class creation, student enrollment, capacity management
- **Timetable** — Weekly scheduling with teacher conflict detection
- **Attendance** — Single and bulk attendance recording, student summary reports
- **Exams** — Exam scheduling with status tracking
- **Grades** — Auto grade calculation (A+/A/B/C/D/F), bulk entry, student summaries
- **Fees** — Fee creation, partial/full payment recording, overdue tracking, student summaries
- **Announcements** — Audience-targeted announcements (all, teachers, students, parents)
- **Messages** — Internal messaging system with inbox, sent, unread count, and read receipts
- **Library** — Book catalog management, borrow/return tracking with availability control
- **HR** — Staff management, contract types, department tracking, salary summaries

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express.js |
| Language | TypeScript |
| Database | MongoDB + Mongoose |
| Authentication | JWT (Access + Refresh tokens) |
| Validation | Zod |
| Password Hashing | bcrypt |
| Environment | dotenv |

---

## Project Structure

```
src/
├── config/
│   ├── db.ts                        # MongoDB connection
│   └── env.ts                       # Environment variables
├── controllers/
│   ├── user.controller.ts           # Auth: register, profile
│   ├── session.controller.ts        # Auth: login
│   ├── logout.controller.ts         # Auth: logout
│   ├── refresh.controller.ts        # Auth: token refresh
│   ├── student.controller.ts
│   ├── teacher.controller.ts
│   ├── class.controller.ts
│   ├── attendance.controller.ts
│   ├── exam.controller.ts
│   ├── grade.controller.ts
│   ├── timetable.controller.ts
│   ├── fee.controller.ts
│   ├── announcement.controller.ts
│   ├── message.controller.ts
│   ├── library.controller.ts
│   └── hr.controller.ts
├── middlewares/
│   ├── auth.middleware.ts           # JWT verification
│   ├── adminOnly.middleware.ts      # Admin role guard
│   ├── role.middleware.ts           # Role-based guard
│   ├── validate.middleware.ts       # Zod request validation
│   ├── error.middleware.ts          # Global error handler
│   └── rateLimit.middleware.ts      # Rate limiting
├── models/
│   ├── User.model.ts
│   ├── Session.model.ts
│   ├── Student.model.ts
│   ├── Teacher.model.ts
│   ├── Class.model.ts
│   ├── Attendance.model.ts
│   ├── Exam.model.ts
│   ├── Grade.model.ts
│   ├── Timetable.model.ts
│   ├── Fee.model.ts
│   ├── Announcement.model.ts
│   ├── Message.model.ts
│   ├── Book.model.ts
│   ├── BookBorrow.model.ts
│   └── Staff.model.ts
├── routes/
│   ├── index.ts                     # Route aggregator
│   ├── user.routes.ts
│   ├── session.routes.ts
│   ├── logout.routes.ts
│   ├── refresh.routes.ts
│   ├── student.routes.ts
│   ├── teacher.routes.ts
│   ├── class.routes.ts
│   ├── attendance.routes.ts
│   ├── exam.routes.ts
│   ├── grade.routes.ts
│   ├── timetable.routes.ts
│   ├── fee.routes.ts
│   ├── announcement.routes.ts
│   ├── message.routes.ts
│   ├── library.routes.ts
│   └── hr.routes.ts
├── services/
│   ├── user.service.ts
│   ├── session.service.ts
│   ├── refresh.service.ts
│   ├── student.service.ts
│   ├── teacher.service.ts
│   ├── class.service.ts
│   ├── attendance.service.ts
│   ├── exam.service.ts
│   ├── grade.service.ts
│   ├── timetable.service.ts
│   ├── fee.service.ts
│   ├── announcement.service.ts
│   ├── message.service.ts
│   ├── library.service.ts
│   └── hr.service.ts
├── types/
│   └── express.d.ts                 # Express type extensions
├── utils/
│   ├── ApiError.ts                  # Custom error class
│   └── jwt.ts                       # JWT helpers
├── validators/
│   ├── user.validator.ts
│   ├── session.validator.ts
│   ├── student.validator.ts
│   ├── teacher.validator.ts
│   ├── class.validator.ts
│   ├── attendance.validator.ts
│   ├── exam.validator.ts
│   ├── grade.validator.ts
│   ├── timetable.validator.ts
│   ├── fee.validator.ts
│   ├── announcement.validator.ts
│   ├── message.validator.ts
│   ├── library.validator.ts
│   └── hr.validator.ts
├── app.ts                           # Express app setup
└── server.ts                        # Server entry point
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- npm or yarn

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/hamidukarimi/SchoolOS-backend.git
cd SchoolOS-backend
```

**2. Install dependencies**

```bash
npm install
```

**3. Set up environment variables**

```bash
cp .env.example .env
```

Fill in your values in the `.env` file (see [Environment Variables](#environment-variables)).

**4. Build the project**

```bash
npm run build
```

**5. Start the server**

```bash
# Development
npm run dev

# Production
npm start
```

The server will start on the port defined in your `.env` file (default: `5000`).

### First Admin User

After starting the server, register a user via the API and then manually update their role to `admin` in MongoDB:

```js
db.users.updateOne(
  { email: "your@email.com" },
  { $set: { role: "admin" } }
)
```

---

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/schoolos

# JWT
JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_ACCESS_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d
```

---

## API Reference

All endpoints are prefixed with `/api`.

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/users` | Register a new user | Public |
| POST | `/api/sessions` | Login | Public |
| POST | `/api/logout` | Logout | Required |
| POST | `/api/token/refresh` | Refresh access token | Public |
| GET | `/api/users/me` | Get my profile | Required |
| PUT | `/api/users/me` | Update my profile | Required |
| PUT | `/api/users/me/password` | Change password | Required |

---

### Students

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/students` | Get all students | Required |
| GET | `/api/students/:id` | Get student by ID | Required |
| POST | `/api/students` | Create a student | Admin |
| PUT | `/api/students/:id` | Update a student | Admin |
| DELETE | `/api/students/:id` | Delete a student | Admin |

**Query Parameters (GET /api/students)**

| Param | Type | Description |
|-------|------|-------------|
| status | string | Filter by status (active, inactive, suspended, graduated) |
| classId | string | Filter by class |
| search | string | Search by name or studentId |
| page | number | Page number (default: 1) |
| limit | number | Results per page (default: 20) |

---

### Teachers

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/teachers` | Get all teachers | Required |
| GET | `/api/teachers/:id` | Get teacher by ID | Required |
| POST | `/api/teachers` | Create a teacher | Admin |
| PUT | `/api/teachers/:id` | Update a teacher | Admin |
| DELETE | `/api/teachers/:id` | Delete a teacher | Admin |

---

### Classes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/classes` | Get all classes | Required |
| GET | `/api/classes/:id` | Get class by ID | Required |
| POST | `/api/classes` | Create a class | Admin |
| PUT | `/api/classes/:id` | Update a class | Admin |
| DELETE | `/api/classes/:id` | Delete a class | Admin |
| POST | `/api/classes/:id/students` | Add student to class | Admin |
| DELETE | `/api/classes/:id/students/:studentId` | Remove student from class | Admin |

---

### Timetable

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/timetables` | Get all timetable entries | Required |
| GET | `/api/timetables/:id` | Get timetable entry by ID | Required |
| POST | `/api/timetables` | Create timetable entry | Admin |
| PUT | `/api/timetables/:id` | Update timetable entry | Admin |
| DELETE | `/api/timetables/:id` | Delete timetable entry | Admin |

---

### Attendance

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/attendance` | Get all attendance records | Required |
| GET | `/api/attendance/:id` | Get attendance by ID | Required |
| GET | `/api/attendance/summary/:studentId` | Get student attendance summary | Required |
| POST | `/api/attendance` | Record single attendance | Admin |
| POST | `/api/attendance/bulk` | Record bulk attendance | Admin |
| PUT | `/api/attendance/:id` | Update attendance | Admin |
| DELETE | `/api/attendance/:id` | Delete attendance record | Admin |

---

### Exams

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/exams` | Get all exams | Required |
| GET | `/api/exams/:id` | Get exam by ID | Required |
| POST | `/api/exams` | Create an exam | Admin |
| PUT | `/api/exams/:id` | Update an exam | Admin |
| DELETE | `/api/exams/:id` | Delete an exam | Admin |

---

### Grades

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/grades` | Get all grades | Required |
| GET | `/api/grades/:id` | Get grade by ID | Required |
| GET | `/api/grades/summary/:studentId` | Get student grade summary | Required |
| POST | `/api/grades` | Create a grade | Admin |
| POST | `/api/grades/bulk` | Bulk create grades | Admin |
| PUT | `/api/grades/:id` | Update a grade | Admin |
| DELETE | `/api/grades/:id` | Delete a grade | Admin |

**Grade Scale**

| Percentage | Grade |
|-----------|-------|
| 90% and above | A+ |
| 80% – 89% | A |
| 70% – 79% | B |
| 60% – 69% | C |
| 50% – 59% | D |
| Below 50% | F |

---

### Fees

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/fees` | Get all fees | Required |
| GET | `/api/fees/:id` | Get fee by ID | Required |
| GET | `/api/fees/summary/:studentId` | Get student fee summary | Required |
| POST | `/api/fees` | Create a fee | Admin |
| POST | `/api/fees/:id/payment` | Record a payment | Admin |
| PUT | `/api/fees/:id` | Update a fee | Admin |
| DELETE | `/api/fees/:id` | Delete a fee | Admin |

---

### Announcements

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/announcements` | Get all announcements | Required |
| GET | `/api/announcements/:id` | Get announcement by ID | Required |
| POST | `/api/announcements` | Create an announcement | Admin |
| PUT | `/api/announcements/:id` | Update an announcement | Admin |
| DELETE | `/api/announcements/:id` | Delete an announcement | Admin |

---

### Messages

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/messages/inbox` | Get inbox | Required |
| GET | `/api/messages/sent` | Get sent messages | Required |
| GET | `/api/messages/unread-count` | Get unread count | Required |
| GET | `/api/messages/:id` | Get message by ID | Required |
| POST | `/api/messages` | Send a message | Required |
| PATCH | `/api/messages/:id/read` | Mark as read | Required |
| DELETE | `/api/messages/:id` | Delete a message | Required |

---

### Library

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/library/books` | Get all books | Required |
| GET | `/api/library/books/:id` | Get book by ID | Required |
| GET | `/api/library/borrows` | Get all borrow records | Required |
| POST | `/api/library/books` | Add a book | Admin |
| PUT | `/api/library/books/:id` | Update a book | Admin |
| DELETE | `/api/library/books/:id` | Delete a book | Admin |
| POST | `/api/library/books/:id/borrow` | Borrow a book | Admin |
| PATCH | `/api/library/borrows/:borrowId/return` | Return a book | Admin |

---

### HR

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/hr` | Get all staff | Admin |
| GET | `/api/hr/summary` | Get HR summary | Admin |
| GET | `/api/hr/:id` | Get staff by ID | Admin |
| POST | `/api/hr` | Create a staff member | Admin |
| PUT | `/api/hr/:id` | Update a staff member | Admin |
| DELETE | `/api/hr/:id` | Delete a staff member | Admin |

---

## Authentication

SchoolOS uses a JWT-based authentication system with two tokens:

- **Access Token** — short-lived token sent in the `Authorization` header as `Bearer <token>`
- **Refresh Token** — long-lived token stored in an `httpOnly` cookie, used to generate new access tokens

### User Roles

| Role | Description |
|------|-------------|
| `admin` | Full access to all endpoints |
| `teacher` | Access to their own classes, attendance, grades |
| `student` | Read-only access to their own data |
| `parent` | Read-only access to their child's data |

### Request Headers

For protected endpoints, include the access token in every request:

```
Authorization: Bearer <your_access_token>
```

### Response Format

All responses follow this consistent structure:

```json
{
  "success": true,
  "data": {},
  "message": "Operation successful"
}
```

Error responses:

```json
{
  "success": false,
  "message": "Error description",
  "stack": "..." 
}
```

> Note: `stack` is only included in development mode.

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch: `git checkout -b feat/your-feature-name`
3. Make your changes and commit: `git commit -m "feat: add your feature"`
4. Push to your branch: `git push origin feat/your-feature-name`
5. Open a Pull Request

Please make sure your code follows the existing patterns — controllers stay thin, business logic lives in services, all inputs are validated with Zod.

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## ⭐ Support

If you find this project useful, consider giving it a star ⭐ on GitHub.

<p align="center">Built with care for schools everywhere.</p>