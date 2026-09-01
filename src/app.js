const express = require("express");
const cors = require("cors");

const productsRouter = require("./routes/products");
const usersRouter = require("./routes/users");
const ordersRouter = require("./routes/orders");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/products", productsRouter);
app.use("/api/users", usersRouter);
app.use("/api/orders", ordersRouter);

// middleware per il 404
app.use((req, res, next) => {
  res.status(404).json({ error: "Not found" });
});

// middleware errori SQL e generici
app.use((err, req, res, next) => {
  console.error("err: ", err.code, err.message);

  if (err.code === "ER_DUP_ENTRY") {
    return res.status(409).json({ error: ` error code ${err.code} Duplicate entry` });
  }

  if (err.code === "ER_NO_REFERENCED_ROW_2") {
    return res.status(400).json({ error: ` error code ${err.code} Referenced row not found` });
  }

  res.status(500).json({ error: ` error code ${err.code} Internal server error` });
});

module.exports = app;
