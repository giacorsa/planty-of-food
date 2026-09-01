const express = require('express');
const router = express.Router();
const db = require('../db');

async function validateIdsExist(conn, table, ids) {
  if (!Array.isArray(ids) || ids.length === 0) return true;

  const placeholders = ids.map(() => '?').join(',');
  const [rows] = await conn.query(
    `SELECT id FROM ${table} WHERE id IN (${placeholders})`,
    ids
  );

  return rows.length === ids.length;
}

// CREATE order with usersIds and productsIds
router.post('/', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const { usersIds = [], productsIds = [] } = req.body;

    await conn.beginTransaction();

    const [orderResult] = await conn.query('INSERT INTO orders () VALUES ()');
    
    const orderId = orderResult.insertId;

    for (const userId of usersIds) {
      await conn.query(
        'INSERT INTO order_users (order_id, user_id) VALUES (?, ?)',
        [orderId, userId]
      );
    }

    for (const productId of productsIds) {
      await conn.query(
        'INSERT INTO order_products (order_id, product_id) VALUES (?, ?)',
        [orderId, productId]
      );
    }

    await conn.commit();
    res.status(201).json({ id: orderId, usersIds, productsIds });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

// GET all orders with filters: from, to, productId
router.get('/', async (req, res, next) => {
  try {
    const { from, to, productId } = req.query;

    let sql = `
      SELECT o.id, o.created_at,
             GROUP_CONCAT(DISTINCT u.nome SEPARATOR ', ') AS utenti,
             GROUP_CONCAT(DISTINCT p.nome SEPARATOR ', ') AS prodotti
      FROM orders o
      LEFT JOIN order_users ou ON o.id = ou.order_id
      LEFT JOIN users u ON ou.user_id = u.id
      LEFT JOIN order_products op ON o.id = op.order_id
      LEFT JOIN products p ON op.product_id = p.id
      WHERE 1 = 1
    `;
    const params = [];

    if (from) {
      sql += ' AND o.created_at >= ?';
      params.push(from);
    }
    if (to) {
      sql += ' AND o.created_at <= ?';
      params.push(to);
    }
    if (productId) {
      sql += ' AND p.id = ?';
      params.push(productId);
    }

    sql += ' GROUP BY o.id, o.created_at ORDER BY o.created_at DESC';

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET single order (with users & products)
router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!req.params.id || !Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: `Invalid order ID` });
    }

    const [orders] = await db.query('SELECT * FROM orders WHERE id = ?', [id] );
    if (!orders.length) return res.status(404).json({ error: `Order ${id} not found` });

    const [users] = await db.query(
      `SELECT u.* FROM users u
       JOIN order_users ou ON u.id = ou.user_id
       WHERE ou.order_id = ?`,
      [id]
    );

    const [products] = await db.query(
      `SELECT p.* FROM products p
       JOIN order_products op ON p.id = op.product_id
       WHERE op.order_id = ?`,
      [id]
    );

    res.json({
      order: orders[0],
      users,
      products
    });
  } catch (err) {
    next(err);
  }
});

// UPDATE order (usersIds + productsIds)
router.put('/:id', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const { usersIds = [], productsIds = [] } = req.body;
    const id = Number(req.params.id);

    if (!req.params.id || !Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: `Invalid order ID` });
    }

    const [orderRows] = await conn.query(
      'SELECT * FROM orders WHERE id = ?',
      [id]
    );

    if (orderRows.length === 0) {
      return res.status(404).json({ error: `Order with id ${id} not found` });
    }

    await conn.beginTransaction();

    // VALIDAZIONE UTENTI
    const usersValid = await validateIdsExist(conn, 'users', usersIds);
    if (!usersValid) {
      await conn.rollback();
      return res.status(400).json({
        error: 'One or more userIds do not exist'
      });
    }

    // VALIDAZIONE PRODOTTI
    const productsValid = await validateIdsExist(conn, 'products', productsIds);
    if (!productsValid) {
      await conn.rollback();
      return res.status(400).json({
        error: 'One or more productIds do not exist'
      });
    }

    // CANCELLAZIONE COMPLETA
    await conn.query('DELETE FROM order_users WHERE order_id = ?', [id]);
    await conn.query('DELETE FROM order_products WHERE order_id = ?', [id]);

    // INSERIMENTO UTENTI
    for (const userId of usersIds) {
      await conn.query(
        'INSERT INTO order_users (order_id, user_id) VALUES (?, ?)',
        [id, userId]
      );
    }

    // INSERIMENTO PRODOTTI
    for (const productId of productsIds) {
      await conn.query(
        'INSERT INTO order_products (order_id, product_id) VALUES (?, ?)',
        [id, productId]
      );
    }

    await conn.commit();

    res.json({
      id,
      usersIds,
      productsIds
    });

  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

// PATCH order (update parziale)
router.patch('/:id', async (req, res, next) => {
  const conn = await db.getConnection();

  try {

    const { usersIds, productsIds } = req.body;
    const id = Number(req.params.id);

    if (!req.params.id || !Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: `Invalid order ID` });
    } 

    // Verifico che l'ordine esista
    const [orderRows] = await conn.query(
      'SELECT * FROM orders WHERE id = ?',
      [id]
    );

    if (orderRows.length === 0) {
      return res.status(404).json({ error: `Order with id ${id} not found` });
    }

    await conn.beginTransaction();

  if (Array.isArray(usersIds)) {
    const usersValid = await validateIdsExist(conn, 'users', usersIds);
    if (!usersValid) {
      await conn.rollback();
      return res.status(400).json({
        error: 'One or more userIds do not exist'
      });
    }

    await conn.query('DELETE FROM order_users WHERE order_id = ?', [id]);

    for (const userId of usersIds) {
      await conn.query(
        'INSERT INTO order_users (order_id, user_id) VALUES (?, ?)',
        [id, userId]
      );
    }
  }

  if (Array.isArray(productsIds)) {
    const productsValid = await validateIdsExist(conn, 'products', productsIds);
    if (!productsValid) {
      await conn.rollback();
      return res.status(400).json({
        error: 'One or more productIds do not exist'
      });
    }

    await conn.query('DELETE FROM order_products WHERE order_id = ?', [id]);

    for (const productId of productsIds) {
      await conn.query(
        'INSERT INTO order_products (order_id, product_id) VALUES (?, ?)',
        [id, productId]
      );
    }
  }
    await conn.commit();

    res.json({
      id,
      usersIds: usersIds ?? 'unchanged',
      productsIds: productsIds ?? 'unchanged'
    });

  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

// DELETE order
router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!req.params.id || !Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: `Invalid order ID` });
    }

    const [result] = await db.query(
      'DELETE FROM orders WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Order not found' });

    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
