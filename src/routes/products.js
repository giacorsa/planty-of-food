const express = require("express");
const router = express.Router();
const db = require("../db");

//GET all products
router.get("/", async (req, res, next) => {
  try {
    const [rows] = await db.query("SELECT * from products");
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// Get single product
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query("SELECT * FROM products WHERE id = ?", [id]);
    if (!rows.length) {
      return res.status(404).json({ error: `Product with id ${id} not found` });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// Create product
router.post("/", async (req, res, next) => {
  try {
    console.log("BODY RICEVUTO:", req.body);
    const { name } = req.body;
    console.log("name", name);
    if (!name) {
      return res.status(400).json({ error: "Product name required" });
    }
    const [result] = await db.query("INSERT INTO products (nome) VALUES (?)", [
      name,
    ]);
    res.status(201).json({ id: result.insertId, name });
  } catch (err) {
    next(err);
  }
});

// Update product
router.put("/:id", async (req, res, next) => {
  try {
    const { name } = req.body;
    const { id } = req.params;
    const [result] = await db.query(
      "UPDATE products SET nome = ? WHERE ID = ?",
      [name, id],
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: `Product with id ${id} not found`,
      });
    }
    res.json({ id, name });
  } catch (err) {
    next(err);
  }
});

// Delete product
router.delete("/:id", async (req, res, next) => {
  try {
    console.log("req.params: ", req.params);
    const { id } = req.params;
    console.log("id: ", id);
    const [result] = await db.query("DELETE FROM products WHERE id = ?", [id]);
    console.log("result: ", result);    
    if (result.affectedRows === 0) {
      return (
        res.status(404).json({ error: `Product with id ${id} not found` })
      );
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
