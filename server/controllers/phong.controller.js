const db = require('../db');
const { generateId } = require('../utils/id.util'); 

const getAllPhong = async (req, res) => {
  const search = req.query.search || '';
  const ngayNhan = req.query.ngay_nhan;   
  const ngayTra = req.query.ngay_tra;     
  const statusFilter = req.query.trang_thai; 
  const roomTypeFilter = req.query.loai_phong; 

  let query = `
    SELECT 
        p.*,
        CASE
            WHEN $2::date IS NOT NULL AND $3::date IS NOT NULL AND $2::date > $3::date THEN
                EXISTS (
                    SELECT 1
                    FROM phong_dat pdph
                    JOIN phieu_dat pd ON pdph.ma_phieu = pd.ma_phieu
                    WHERE pdph.ma_phong = p.ma_phong
                      AND (
                            (pd.ngay_nhan < $2 AND pd.ngay_tra > $3) 
                            OR (pd.ngay_nhan >= $3 AND pd.ngay_nhan < $2) 
                            OR (pd.ngay_tra > $3 AND pd.ngay_tra <= $2) 
                            OR (pd.ngay_nhan <= $3 AND pd.ngay_tra >= $2) 
                          )
                )
            ELSE FALSE
        END AS is_booked_in_range
    FROM phong p
    WHERE (LOWER(p.so_phong) LIKE LOWER($1) OR LOWER(p.loai_phong) LIKE LOWER($1))
    AND p.trang_thai NOT IN ('Bao_tri') 
  `;
  const params = [`%${search}%`];
  let paramIndex = 2; 

  params.push(ngayTra || null, ngayNhan || null); 
  paramIndex += 2; 

  if (statusFilter) {
    query += ` AND p.trang_thai = $${paramIndex}`;
    params.push(statusFilter);
    paramIndex++;
  }

  if (roomTypeFilter) {
    query += ` AND p.loai_phong = $${paramIndex}`;
    params.push(roomTypeFilter);
    paramIndex++;
  }
  
  query += ` ORDER BY p.so_phong`;

  try {
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Lỗi trong getAllPhong (theo ngày/lọc):", err);
    res.status(500).json({ error: err.message });
  }
};


const getPhongById = async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Lấy thông tin phòng cơ bản
    const phongResult = await db.query('SELECT * FROM phong WHERE ma_phong = $1', [id]);
    if (phongResult.rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy phòng' });
    const phong = phongResult.rows[0];

    // 2. Lấy TẤT CẢ các lịch đặt phòng hoặc đang ở cho phòng này.
    // Lấy các lịch đặt mà ngày trả phòng >= ngày hiện tại
    // Và sắp xếp để ưu tiên các lịch đặt đang diễn ra hoặc sắp bắt đầu.
    const lichDatResult = await db.query(`
        SELECT 
            pd.ma_phieu,
            pd.ngay_dat,
            pd.ngay_nhan,
            pd.ngay_tra,
            kh.ten_kh,
            kh.sdt
        FROM phieu_dat pd
        JOIN phong_dat pdph ON pdph.ma_phieu = pd.ma_phieu
        JOIN khach_hang kh ON pd.ma_kh = kh.ma_kh
        WHERE pdph.ma_phong = $1
          AND pd.ngay_tra >= CURRENT_DATE -- Lịch đặt chưa kết thúc
        ORDER BY 
            CASE 
                WHEN pd.ngay_nhan <= CURRENT_DATE AND pd.ngay_tra >= CURRENT_DATE THEN 0 -- Đang ở
                WHEN pd.ngay_nhan > CURRENT_DATE THEN 1 -- Sắp tới
                ELSE 2 -- Đã kết thúc (nhưng vẫn nằm trong phạm vi ngay_tra >= CURRENT_DATE)
            END,
            pd.ngay_nhan ASC; -- Sắp xếp theo ngày nhận tăng dần
    `, [id]);

    // 3. Kết hợp thông tin phòng và lịch đặt
    phong.lich_dat_gan_nhat = lichDatResult.rows.map(booking => ({
        ma_phieu: booking.ma_phieu,
        ngay_dat: booking.ngay_dat,
        ngay_nhan: booking.ngay_nhan,
        ngay_tra: booking.ngay_tra,
        ten_kh: booking.ten_kh,
        sdt_kh: booking.sdt
    }));

    res.json(phong); // Trả về đối tượng phòng đã bao gồm lịch đặt
  } catch (err) {
    console.error("Lỗi trong getPhongById:", err);
    res.status(500).json({ error: err.message });
  }
};

const createPhong = async (req, res) => {
  const { so_phong, loai_phong, loai_giuong, gia, trang_thai } = req.body;
  try {
    const ma_phong = generateId('P'); 
    await db.query(`
      INSERT INTO phong (ma_phong, so_phong, loai_phong, loai_giuong, gia, trang_thai)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [ma_phong, so_phong, loai_phong, loai_giuong, gia, trang_thai]);
    res.json({ message: 'Thêm phòng thành công' });
  } catch (err) {
    console.error("Lỗi trong createPhong:", err);
    res.status(500).json({ error: err.message });
  }
};

const updatePhong = async (req, res) => {
  const { id } = req.params;
  const { so_phong, loai_phong, loai_giuong, gia, trang_thai } = req.body;
  try {
    await db.query(`
      UPDATE phong SET so_phong = $1, loai_phong = $2, loai_giuong = $3, gia = $4, trang_thai = $5
      WHERE ma_phong = $6
    `, [so_phong, loai_phong, loai_giuong, gia, trang_thai, id]);
    res.json({ message: 'Cập nhật phòng thành công' });
  }  catch (err) {
    console.error("Lỗi trong updatePhong:", err);
    res.status(500).json({ error: err.message });
  }
};

const deletePhong = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM phong WHERE ma_phong = $1', [id]);
    res.json({ message: 'Xoá phòng thành công' });
  } catch (err) {
    console.error("Lỗi trong deletePhong:", err);
    res.status(500).json({ error: err.message });
  }
};

const checkInPhong = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(`
            UPDATE phong SET trang_thai = 'Dang_o' WHERE ma_phong = $1 AND trang_thai = 'Da_dat' RETURNING *;
        `, [id]);
        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Không thể Check-in. Phòng không ở trạng thái "Đã đặt" hoặc không tồn tại.' });
        }
        res.json({ message: `Phòng ${id} đã được Check-in thành công!`, phong: result.rows[0] });
    } catch (err) {
        console.error('Lỗi Check-in phòng:', err);
        res.status(500).json({ error: 'Lỗi khi Check-in phòng: ' + err.message });
    }
};

const checkOutPhong = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(`
            UPDATE phong SET trang_thai = 'Trong' WHERE ma_phong = $1 AND trang_thai = 'Dang_o' RETURNING *;
        `, [id]);
        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Không thể Check-out. Phòng không ở trạng thái "Đang ở" hoặc không tồn tại.' });
        }
        res.json({ message: `Phòng ${id} đã được Check-out thành công!`, phong: result.rows[0] });
    } catch (err) {
        console.error('Lỗi Check-out phòng:', err);
        res.status(500).json({ error: 'Lỗi khi Check-out phòng: ' + err.message });
    }
};

module.exports = {
  getAllPhong,
  getPhongById,
  createPhong,
  updatePhong,
  deletePhong,
  checkInPhong, 
  checkOutPhong 
};
