# Planty of Food — Backend REST API (Node.js + Express + MySQL)

This repository contains the complete backend of the final Start2Impact project for the Nodejs course.  
The solutions includes:

- API RESTful developed by **Express.js**
- Database **MySQL**
- File **migrations.sql** to creare all the tables
- Automatic Test with **Jest**, **Supertest** e **Sinon**
- Modular and easily extensible architecture

The React frontend is not required for the evaluation and has been left as optional development..

---

## 🚀 Used Technologies

- **Node.js**
- **Express.js**
- **MySQL**
- **Jest** (test runner)
- **Supertest** (test HTTP)
- **Sinon** (stubs, spies, mocks)

---

## 📁 Project Structure

```bash
pof-backend/
│
├── src/
│   ├── app.js
│   ├── db.js
│   └── routes/
│       ├── orders.js
│       ├── users.js
│       └── products.js
│
├── tests/
│   ├── orders.test.js
│   ├── users.test.js
│   └── products.test.js
│
├── migrations.sql
├── package.json
└── README.md
```

---

## 🗄️ Database

The file **migrations.sql** contains all the instructions needed to create the tables:

- `users`
- `products`
- `orders`
- `order_users`
- `order_products`

TO creare the database:

```sql
SOURCE migrations.sql;
```

---

## ⚙️ Installazione

Clone the repository:
git clone <https://github.com/>giacorsa/pof-backend.git
cd pof-backend

---

## Installa le dipendenze

npm install

---

## Avvio del server

npm start

The server will start on:
<http://localhost:3001>

---

## 🧪 Test automatici

The tests were implemented with:

Jest → test runner

Supertest → API HTTP test

Sinon → stubs, spies, mocks to simulate MySQL

To run the tests:
npm test

The tests don't require a real database:
All MySQL queries are simulated using Sinon.

---

## 📌 Available API

👤 Users
POST /api/users

GET /api/users

GET /api/users/:id

PUT /api/users/:id

DELETE /api/users/:id

📦 Products
POST /api/products

GET /api/products

GET /api/products/:id

PUT /api/products/:id

DELETE /api/products/:id

🧾 Orders
POST /api/orders

GET /api/orders

GET /api/orders/:id

PUT /api/orders/:id

PATCH /api/orders/:id (partial update with validation)

DELETE /api/orders/:id

---

## 👨‍💻 Author

Gianni Corsa  
GitHub: <https://github.com/giacorsa>

---

## 📄 Licenza

MIT License
You are free to use, modify and distribute this project.

---
