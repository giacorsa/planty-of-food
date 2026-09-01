const express = require('express');
const router = express.Router();
const db = require('../db');

// Get All users
router.get('/', async (req, res, next) => {
    try {
        const [rows] = await db.query('SELECT * FROM users');
        res.json(rows);
    } catch(err) {
        next(err);
    }
});

// Get single user
router.get('/:id', async (req, res, next) => {
    try {

        const idNum = Number(req.params.id);

        if (!req.params.id || !Number.isInteger(idNum) || idNum <= 0) {
            return res.status(400).json({ error: `Invalid user ID` });
        }

        const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [idNum]);
        if(!rows.length){
            return res.status(404).json({error: `User with id ${idNum} not found`});
        }
        res.json(rows[0]);
    } catch(err) {
        next(err);
    }
});

// Create user
router.post('/', async (req, res, next) => {
    try {
        const {firstname, lastname, email} = req.body;
        if(!firstname || !lastname || !email){
            return res.status(400).json({error: 'User name, lastname and email are required'});
        }
        const [result] = await db.query('INSERT INTO users (nome, cognome, email) VALUES (?,?,?)', [firstname, lastname, email]);
        res.status(201).json({id: result.insertId, firstname, lastname, email});
    } catch(err) {
        next(err);
    } 
});

// Update user
router.put('/:id', async (req, res, next) => {
    try {      
        
        const {firstname, lastname, email} = req.body;
        const idNum = Number(req.params.id);

        if (!req.params.id || !Number.isInteger(idNum) || idNum <= 0) {
            return res.status(400).json({ error: `Invalid user ID` });
        }

        const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [idNum]);

        if (rows.length === 0) {
            return res.status(404).json({ error: `User with id ${idNum} not found` });
        }

        const currentUser = rows[0];

        const newFirstname = firstname ?? currentUser.nome;
        const newLastname  = lastname ?? currentUser.cognome;
        const newEmail     = email ?? currentUser.email;

        const [result] = await db.query('UPDATE users SET nome = ?, cognome = ?, email = ? WHERE ID = ?', 
            [newFirstname, newLastname, newEmail, idNum]);

        if (result.affectedRows === 0){
            return res.status(404).json({ error: `User with id ${idNum} not found`});
        }

        res.json({
                id: idNum,
                firstname: newFirstname,
                lastname: newLastname,
                email: newEmail
        });
    } catch(err) {
        next(err);
    }
});

// Delete user
router.delete('/:id', async (req, res, next) => {
    try {

        const idNum = Number(req.params.id);

        if (!req.params.id || !Number.isInteger(idNum) || idNum <= 0) {
            return res.status(400).json({ error: `Invalid user ID` });
        }

        const [result] = await db.query('DELETE FROM users WHERE id = ?', [idNum]);
        if(result.affectedRows === 0){
            return res.status(404).json({error: `User with id ${idNum} not found`});
        }
        res.status(204).end();
    } catch(err) {
        next(err);
    }
});

module.exports = router;