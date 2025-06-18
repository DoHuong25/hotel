const db = require('../db');
const { v4: uuidv4 } = require('uuid');

const getAllPhong = async (req, res) => {
  const search = req.query.search || '';
  const query = `
    SELECT * FROM phong 
    WHERE so_phong ILIKE $1 OR loai_phong ILIKE $1
    ORDER BY so_phong
  `;
  const result = await db.query(query, [`%${search}%`]);
  res.json(result.rows);
};

const getPhongById = async (req, res) => {
  const { id } = req.params;
  const result = await db.query('SELECT * FROM phong WHERE ma_phong = $1', [id]);
  res.json(result.rows[0]);
};

const createPhong = async (req, res) => {
  const { so_phong, loai_phong, loai_giuong, gia, trang_thai } = req.body;
  const ma_phong = uuidv4();
  await db.query(`
    INSERT INTO phong (ma_phong, so_phong, loai_phong, loai_giuong, gia, trang_thai)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [ma_phong, so_phong, loai_phong, loai_giuong, gia, trang_thai]);
  res.json({ message: 'Thêm phòng thành công' });
};

const updatePhong = async (req, res) => {
  const { id } = req.params;
  const { so_phong, loai_phong, loai_giuong, gia, trang_thai } = req.body;
  await db.query(`
    UPDATE phong SET so_phong = $1, loai_phong = $2, loai_giuong = $3, gia = $4, trang_thai = $5
    WHERE ma_phong = $6
  `, [so_phong, loai_phong, loai_giuong, gia, trang_thai, id]);
  res.json({ message: 'Cập nhật phòng thành công' });
};

const deletePhong = async (req, res) => {
  const { id } = req.params;
  await db.query('DELETE FROM phong WHERE ma_phong = $1', [id]);
  res.json({ message: 'Xoá phòng thành công' });
};

module.exports = {
  getAllPhong,
  getPhongById,
  createPhong,
  updatePhong,
  deletePhong
};
