# 📝 Real-Time To-Do App with Redis (Node.js + Express.js + Socket.IO)

A small but powerful showcase project demonstrating **Redis caching** and **Redis Pub/Sub** in a Node.js + Express.js application.  
This project is designed for **interview portfolios** — easy to run locally, visually impressive in real-time, and technically deep enough to discuss architecture, caching, and real-time updates.

---

## 🚀 Features
- **Real-Time Updates** — When one user adds a task, all connected clients see it instantly (via Redis Pub/Sub + Socket.IO)
- **Redis Caching** — Frequently accessed tasks are served from cache for speed
- **Cache Invalidation** — On any update, cache is refreshed automatically
- **Clean REST API** — Create, read, update, and delete to-do tasks
- **MongoDB Integration** — Persistent storage of tasks
- **JWT Authentication** — Secure endpoints for authenticated users

---

## 🛠️ Tech Stack
- **Backend:** Node.js, Express.js
- **Real-Time:** Socket.IO
- **Database:** MongoDB
- **Cache Layer:** Redis
- **Auth:** JWT
- **Environment:** Docker (for Redis), WSL2/Windows/Mac/Linux

---

## 📂 Project Structure

redis-realtime-todo/
│
├── src/
│ ├── config/ # DB & Redis connection
│ ├── controllers/ # Request handlers
│ ├── models/ # Mongoose schemas
│ ├── routes/ # API routes
│ ├── utils/ # JWT & cache helpers
│ ├── app.js # Express app
│ └── server.js # Socket.IO + Redis pub/sub
│
├── package.json
├── .env
└── README.md


---

## ⚡ Architecture

Client (Browser, Postman)
        |
        v
Express.js API ----> MongoDB (persistent storage)
        |
        v
Redis (Cache + Pub/Sub)
        |
        v
Socket.IO -> Broadcasts real-time updates to all connected clients

1️⃣ Clone the Repository

```bash
git clone https://github.com/SKSARUK10/redis-realtime-todo.git
cd redis-realtime-todo
```

2️⃣ Install Dependencies
```bash
npm install
```
3️⃣ Start Redis (Docker)
```bash
docker run -d --name redis -p 6379:6379 redis:latest
```
