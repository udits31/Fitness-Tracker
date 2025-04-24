const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root123',
  database: 'project',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Connected to database successfully');
    connection.release();
  } catch (err) {
    console.error('Error connecting to database:', err);
  }
}

testConnection();

module.exports = pool;