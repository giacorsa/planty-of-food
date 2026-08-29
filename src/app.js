const express = require("express");
const cors = require("cors");

const productsRouter = require("./routes/products");
const usersRouter = require("./routes/users");
const ordersRouter = require("./routes/orders");

const app = express();

app.use(cors());
app.use(express.json()); // <-- deve essere qui, pulito

app.use("/api/products", productsRouter);
app.use("/api/users", usersRouter);
app.use("/api/orders", ordersRouter);

// middleware errori
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

// app.listen(3001, () => {
//   console.log("Backend running on http://localhost:3001");
// });

module.exports = app;
