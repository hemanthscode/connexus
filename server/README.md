# ⚡ Connexus Chat Application Backend

> **Enterprise-Grade Real-Time Chat Backend**
> Scalable, secure, and production-ready messaging platform built with **Node.js, Express, Socket.IO, and MongoDB**.

---

## 🚀 Overview

Connexus is a **real-time communication backend** engineered with enterprise-level architecture and security standards. It powers seamless messaging with:

* **⚡ High performance** – optimized WebSocket engine
* **🔒 Strong security** – JWT, bcrypt, Helmet, and rate-limiting
* **📈 Scalability** – supports millions of concurrent connections
* **🛡️ Reliability** – robust error handling, logging, and graceful shutdowns
* **🏗️ Clean architecture** – modular, maintainable, and future-proof

---

## 🏆 Tech Stack

| Category   | Technology         | Version |
| ---------- | ------------------ | ------- |
| Runtime    | Node.js            | 18+     |
| Framework  | Express.js         | 4.21.2  |
| Database   | MongoDB            | 7.8.7   |
| ODM        | Mongoose           | 7.8.7   |
| Real-time  | Socket.IO          | 4.8.1   |
| Auth       | JWT                | 9.0.2   |
| Validation | Joi                | 18.0.1  |
| Security   | Helmet, bcryptjs   | Latest  |
| Rate Limit | express-rate-limit | 6.11.2  |

---

## 🎯 Core Features

### 💬 Real-Time Messaging

* Instant delivery with WebSockets
* Typing indicators & message statuses
* Emoji reactions & message threading

### 👥 User Management

* Rich profiles with avatars
* Real-time presence tracking
* Block/unblock & privacy controls
* Multi-device sync

### 🔐 Security

* JWT-based authentication
* Encrypted passwords with bcrypt
* Input validation with Joi
* Helmet security headers & CORS protection

### 📂 Additional

* Direct & group conversations
* File attachments
* Soft delete & message editing
* Conversation archiving

---

## 🏗️ Architecture

```
src/
├── api/
│   ├── controllers/   # Request handlers
│   ├── services/      # Business logic
│   ├── validations/   # Joi schemas
│   ├── models/        # Mongoose entities
│   ├── middleware/    # Auth, errors, rate limiting
│   ├── routes/        # API endpoints
│   ├── socket/        # WebSocket auth & events
│   ├── utils/         # Helpers (JWT, etc.)
│   └── config/        # Env config
├── app.js             # Express setup
└── server.js          # Server startup
```

✅ **Clean separation of concerns**
✅ **Scalable & modular structure**

---

## 📡 REST API

### 🔐 Authentication

| Method | Endpoint             | Description           |
| ------ | -------------------- | --------------------- |
| POST   | `/api/auth/register` | Register a new user   |
| POST   | `/api/auth/login`    | Login and receive JWT |
| PUT    | `/api/auth/password` | Change password       |
| POST   | `/api/auth/logout`   | Logout user           |

### 👤 Users

| Method | Endpoint            | Description          |
| ------ | ------------------- | -------------------- |
| GET    | `/api/users/me`     | Current user profile |
| PUT    | `/api/users/me`     | Update profile       |
| GET    | `/api/users/search` | Search users         |
| GET    | `/api/users/:id`    | Get user by ID       |

### 💬 Chats

| Method | Endpoint                               | Description        |
| ------ | -------------------------------------- | ------------------ |
| GET    | `/api/chat/conversations`              | User conversations |
| POST   | `/api/chat/conversations/direct`       | Create direct chat |
| POST   | `/api/chat/conversations/group`        | Create group chat  |
| GET    | `/api/chat/conversations/:id/messages` | Get messages       |
| POST   | `/api/chat/messages`                   | Send message       |
| PUT    | `/api/chat/messages/edit`              | Edit message       |
| DELETE | `/api/chat/messages/:id`               | Delete message     |

---

## ⚡ WebSocket Events

**Client → Server**

* `join_conversation`
* `send_message`
* `typing_start` / `typing_stop`
* `add_reaction`
* `edit_message`
* `delete_message`

**Server → Client**

* `new_message`
* `user_online` / `user_offline`
* `user_typing`
* `message_edited` / `message_deleted`
* `reaction_updated`

---

## ⚙️ Setup

### 1️⃣ Install

```bash
git clone https://github.com/yourusername/connexus-server.git
cd connexus-server
npm install
cp .env.example .env
```

### 2️⃣ Run Dev

```bash
npm run dev
# http://localhost:5000
```



## 🤝 Contributing

1. Fork & create feature branch
2. Commit with semantic messages
3. Open PR with details

Standards:

* ESLint rules enforced
* 90%+ test coverage
* Update docs for new features

---

## 📈 Roadmap

* [x] Real-time messaging
* [x] Reactions & file sharing
* [ ] Voice messages
* [ ] Video calls
* [ ] E2E encryption
* [ ] Admin dashboard
* [ ] Multi-tenant support

---


🔥 Built with ❤️ by the **Connexus Team**
