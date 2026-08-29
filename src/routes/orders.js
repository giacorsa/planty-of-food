const express = require('express');
const router = express.Router();
const db = require('../db');

// CREATE order with usersIds and productsIds
router.post('/', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const { usersIds = [], productsIds = [] } = req.body;

    await conn.beginTransaction();

    const [orderResult] = await conn.query('INSERT INTO orders () VALUES ()');
    console.log("CREATE ORDER - orderResult:", orderResult.insertId);
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
    const { id } = req.params;

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
    const { id } = req.params;
    const { usersIds = [], productsIds = [] } = req.body;

console.log("usersIds: ", usersIds);
console.log("productsIds: ", productsIds);

    // Verifico che l'ordine esista
    const [orderRows] = await conn.query(
      'SELECT * FROM orders WHERE id = ?',
      [id]
    );

    if (orderRows.length === 0) {
      return res.status(404).json({ error: `Order with id ${id} not found` });
    }

    await conn.beginTransaction();

    // Cancello le vecchie associazioni
    await conn.query('DELETE FROM order_users WHERE order_id = ?', [id]);
    await conn.query('DELETE FROM order_products WHERE order_id = ?', [id]);

    // Inserisco le nuove associazioni utenti
    for (const userId of usersIds) {
      await conn.query(
        'INSERT INTO order_users (order_id, user_id) VALUES (?, ?)',
        [id, userId]
      );
    }

    // Inserisco le nuove associazioni prodotti
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
    const { id } = req.params;
    const { usersIds, productsIds } = req.body;

    // Verifico che l'ordine esista
    const [orderRows] = await conn.query(
      'SELECT * FROM orders WHERE id = ?',
      [id]
    );

    if (orderRows.length === 0) {
      return res.status(404).json({ error: `Order with id ${id} not found` });
    }

    await conn.beginTransaction();

    // Validazione utenti (se usersIds è presente)
    if (Array.isArray(usersIds)) {
      if (usersIds.length > 0) {
        const [validUsers] = await conn.query(
          `SELECT id FROM users WHERE id IN (${usersIds.map(() => '?').join(',')})`,
          usersIds
        );

        if (validUsers.length !== usersIds.length) {
          await conn.rollback();
          return res.status(400).json({
            error: 'One or more userIds do not exist'
          });
        }
      }

      // Cancello vecchie associazioni utenti
      await conn.query('DELETE FROM order_users WHERE order_id = ?', [id]);

      // Inserisco le nuove
      for (const userId of usersIds) {
        await conn.query(
          'INSERT INTO order_users (order_id, user_id) VALUES (?, ?)',
          [id, userId]
        );
      }
    }

    // Validazione prodotti (se productsIds è presente)
    if (Array.isArray(productsIds)) {
      if (productsIds.length > 0) {
        const [validProducts] = await conn.query(
          `SELECT id FROM products WHERE id IN (${productsIds.map(() => '?').join(',')})`,
          productsIds
        );

        if (validProducts.length !== productsIds.length) {
          await conn.rollback();
          return res.status(400).json({
            error: 'One or more productIds do not exist'
          });
        }
      }

      // Cancello vecchie associazioni prodotti
      await conn.query('DELETE FROM order_products WHERE order_id = ?', [id]);

      // Inserisco le nuove
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
    const { id } = req.params;

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
