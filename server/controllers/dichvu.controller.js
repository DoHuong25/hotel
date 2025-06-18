// dichvu.controller.js - controller for dichvu
const pool = require('../db');
const { generateId } = require('../utils/id.util');

const getAllDichVu = async (req, res) => {
  try {
    const search = req.query.search || '';
    const query = `
      SELECT * FROM dich_vu
      WHERE LOWER(ten_dv) LIKE LOWER($1)
      ORDER BY ma_dv;
    `;
    const result = await pool.query(query, [`%${search}%`]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createDichVu = async (req, res) => {
  try {
    const { ten_dv, don_gia, mo_ta } = req.body;
    const ma_dv = await generateId('dich_vu', 'DV');
    const query = `INSERT INTO dich_vu (ma_dv, ten_dv, don_gia, mo_ta)
                   VALUES ($1, $2, $3, $4) RETURNING *`;
    const result = await pool.query(query, [ma_dv, ten_dv, don_gia, mo_ta]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateDichVu = async (req, res) => {
  const { id } = req.params;
  const { ten_dv, don_gia, mo_ta } = req.body;
  const result = await pool.query(`
    UPDATE dich_vu SET ten_dv=$1, don_gia=$2, mo_ta=$3
    WHERE ma_dv=$4 RETURNING *;
  `, [ten_dv, don_gia, mo_ta, id]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy dịch vụ' });
  res.json(result.rows[0]);
};

const deleteDichVu = async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('DELETE FROM dich_vu WHERE ma_dv = $1 RETURNING *', [id]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy dịch vụ' });
  res.json({ message: 'Đã xoá dịch vụ' });
};

module.exports = { getAllDichVu, createDichVu, updateDichVu, deleteDichVu };
