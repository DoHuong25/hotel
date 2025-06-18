const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.connect()
  .then(() => console.log('✅ Kết nối PostgreSQL thành công!'))
  .catch(err => console.error('❌ Lỗi kết nối DB:', err));

module.exports = pool;
