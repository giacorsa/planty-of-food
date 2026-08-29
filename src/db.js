const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'gianni',
    password: 'Tigre.150',
    database: 'pof_gas',
    connectionLimit: 10
});

module.exports = pool;