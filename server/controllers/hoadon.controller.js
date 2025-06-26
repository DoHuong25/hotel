const pool = require('../db');
const { generateId } = require('../utils/id.util'); // Đảm bảo generateId được import đúng cách

/**
 * Groups rows from a SQL JOIN into a structured invoice object.
 * This is a helper function to avoid repetitive code.
 */
const formatHoaDonDetails = (rows) => {
    if (!rows || rows.length === 0) return null;

    const hoaDon = {
        ma_hd: rows[0].ma_hd,
        ma_phieu: rows[0].ma_phieu,
        ngay_lap: rows[0].ngay_lap,
        tong_tien: parseFloat(rows[0].tong_tien),
        trang_thai_thanh_toan: rows[0].trang_thai_thanh_toan,
        hinh_thuc_thanh_toan: rows[0].hinh_thuc_thanh_toan, 
        nhan_vien_lap: rows[0].nv_ten_nv, 
        khach_hang: rows[0].kh_ma_kh ? {
            ma_kh: rows[0].kh_ma_kh,
            ten_kh: rows[0].kh_ten_kh,
            sdt: rows[0].kh_sdt
        } : null,
        thong_tin_dat_phong: rows[0].pd_ma_phieu ? {
            ma_phieu_dat: rows[0].pd_ma_phieu,
            ngay_nhan: rows[0].ngay_nhan, // Sử dụng ngay_nhan từ JOIN
            ngay_tra: rows[0].ngay_tra,   // Sử dụng ngay_tra từ JOIN
            // Cập nhật cách tính số đêm ở đây để đảm bảo chính xác
            so_dem: (rows[0].ngay_nhan && rows[0].ngay_tra) ? 
                    (() => {
                        const ngayNhan = new Date(rows[0].ngay_nhan);
                        const ngayTra = new Date(rows[0].ngay_tra);
                        if (ngayTra > ngayNhan) {
                            return Math.ceil((ngayTra.getTime() - ngayNhan.getTime()) / (1000 * 60 * 60 * 24));
                        } else if (ngayTra.toDateString() === ngayNhan.toDateString()) {
                            return 1; 
                        }
                        return 0; 
                    })()
                    : 0,
            phong_da_dat: []
        } : null,
        dich_vu_da_dung: []
    };

    const addedRooms = new Set();
    const addedServices = new Set(); 

    rows.forEach(row => {
        // Add booked room(s)
        if (row.p_ma_phong && !addedRooms.has(row.p_ma_phong)) {
            if (hoaDon.thong_tin_dat_phong) {
                hoaDon.thong_tin_dat_phong.phong_da_dat.push({ ma_phong: row.p_ma_phong, so_phong: row.p_so_phong });
                addedRooms.add(row.p_ma_phong);
            }
        }
        // Add used service(s)
        if (row.sddv_ma_sddv && row.dv_ma_dv && row.dv_ten_dv && row.dv_so_luong && !addedServices.has(row.sddv_ma_sddv)) {
            hoaDon.dich_vu_da_dung.push({
                ma_sddv: row.sddv_ma_sddv,
                ma_dv: row.dv_ma_dv,
                ten_dv: row.dv_ten_dv,
                so_luong: parseInt(row.dv_so_luong)
            });
            addedServices.add(row.sddv_ma_sddv);
        }
    });

    return hoaDon;
};


/**
 * Builds the reusable part of the SQL query for fetching invoice details.
 */
const buildGetInvoicesQuery = () => `
    SELECT
        hd.ma_hd, hd.ma_phieu, hd.ngay_lap, hd.tong_tien, hd.trang_thai_thanh_toan, hd.hinh_thuc_thanh_toan,
        pd.ma_phieu AS pd_ma_phieu, pd.ngay_nhan, pd.ngay_tra, 
        kh.ma_kh AS kh_ma_kh, kh.ten_kh AS kh_ten_kh, kh.sdt AS kh_sdt,
        nv.ten_nv AS nv_ten_nv, 
        p.ma_phong AS p_ma_phong, p.so_phong AS p_so_phong, p.gia as p_gia,
        sddv.ma_sddv as sddv_ma_sddv, sddv.ma_dv AS dv_ma_dv, dv.ten_dv AS dv_ten_dv, sddv.so_luong AS dv_so_luong, dv.don_gia as dv_don_gia
    FROM hoa_don hd
    LEFT JOIN phieu_dat pd ON hd.ma_phieu = pd.ma_phieu
    LEFT JOIN khach_hang kh ON pd.ma_kh = kh.ma_kh
    LEFT JOIN nhan_vien nv ON hd.ma_nv = nv.ma_nv 
    LEFT JOIN phong_dat pdph ON pd.ma_phieu = pdph.ma_phieu
    LEFT JOIN phong p ON pdph.ma_phong = p.ma_phong
    LEFT JOIN su_dung_dv sddv ON pd.ma_phieu = sddv.ma_phieu
    LEFT JOIN dich_vu dv ON sddv.ma_dv = dv.ma_dv
`;

// GET /api/hoadon
const getAllHoaDon = async (req, res) => {
    try {
        const search = req.query.search || '';
        const query = `${buildGetInvoicesQuery()}
            WHERE hd.ma_hd ILIKE $1 OR pd.ma_phieu ILIKE $1 OR kh.ten_kh ILIKE $1 OR nv.ten_nv ILIKE $1
            ORDER BY hd.ngay_lap DESC, hd.ma_hd DESC;`;
        const result = await pool.query(query, [`%${search}%`]);
        
        const groupedInvoices = new Map();
        result.rows.forEach(row => {
            if (!row.ma_hd) return;
            const ma_hd = row.ma_hd;
            if (!groupedInvoices.has(ma_hd)) {
                groupedInvoices.set(ma_hd, []);
            }
            groupedInvoices.get(ma_hd).push(row);
        });
        
        const formattedInvoices = Array.from(groupedInvoices.values()).map(formatHoaDonDetails);
        res.json(formattedInvoices);
    } catch (err) {
        console.error('Error in getAllHoaDon:', err);
        res.status(500).json({ error: 'Lỗi khi lấy danh sách hóa đơn: ' + err.message });
    }
};

// GET /api/hoadon/:id
const getHoaDonById = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `${buildGetInvoicesQuery()} WHERE hd.ma_hd = $1;`;
        const result = await pool.query(query, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy hóa đơn' });
        }
        const formattedInvoice = formatHoaDonDetails(result.rows);
        res.json(formattedInvoice);
    } catch (err) {
        console.error('Error in getHoaDonById:', err);
        res.status(500).json({ error: 'Lỗi khi lấy chi tiết hóa đơn: ' + err.message });
    }
};

// POST /api/hoadon
const createHoaDon = async (req, res) => {
    const { ma_phieu, ma_nv, tong_tien, trang_thai_thanh_toan = 'dang_xu_li', hinh_thuc_thanh_toan = null, } = req.body;
    try {
        const ma_hd = generateId('HD'); 
        const ngay_lap = new Date();
        const insertQuery = `INSERT INTO hoa_don (ma_hd, ma_phieu, ma_nv, ngay_lap, tong_tien, trang_thai_thanh_toan, hinh_thuc_thanh_toan) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;`;
        const values = [ma_hd, ma_phieu, ma_nv, ngay_lap, tong_tien, trang_thai_thanh_toan, hinh_thuc_thanh_toan];
        const newHoaDon = await pool.query(insertQuery, values);
        res.status(201).json({ message: 'Thêm hóa đơn thành công', hoa_don: newHoaDon.rows[0] });
    } catch (err) {
        console.error('Error creating hoa don:', err);
        res.status(500).json({ error: 'Lỗi khi tạo hóa đơn: ' + err.message });
    }
};

// PUT /api/hoadon/:id
const updateHoaDon = async (req, res) => {
    const { id } = req.params;
    const { ngay_lap, dich_vu_da_dung, trang_thai_thanh_toan, hinh_thuc_thanh_toan } = req.body; 
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const hoaDonRes = await client.query('SELECT ma_phieu FROM hoa_don WHERE ma_hd = $1', [id]);
        if (hoaDonRes.rows.length === 0) {
            throw new Error('Không tìm thấy hóa đơn.');
        }
        const { ma_phieu } = hoaDonRes.rows[0];

        // Nếu chỉ cập nhật trạng thái thanh toán hoặc hình thức thanh toán, thực hiện UPDATE đơn giản
        // Điều kiện: chỉ có trang_thai_thanh_toan hoặc hinh_thuc_thanh_toan được cung cấp
        // và không có dich_vu_da_dung hay ngay_lap (cho các cập nhật phức tạp)
        if ((trang_thai_thanh_toan || hinh_thuc_thanh_toan) && !dich_vu_da_dung && !ngay_lap) {
            const updateResult = await client.query(
                'UPDATE hoa_don SET trang_thai_thanh_toan = COALESCE($1, trang_thai_thanh_toan), hinh_thuc_thanh_toan = COALESCE($2, hinh_thuc_thanh_toan) WHERE ma_hd = $3 RETURNING *',
                [trang_thai_thanh_toan, hinh_thuc_thanh_toan, id]
            );
            await client.query('COMMIT');
            return res.json(updateResult.rows[0]);
        }

        // Nếu có cập nhật dịch vụ hoặc các trường phức tạp khác, thực hiện logic đầy đủ
        // Xóa các dịch vụ đã sử dụng cũ và chèn lại các dịch vụ mới nếu có thay đổi
        if (Array.isArray(dich_vu_da_dung)) {
            await client.query('DELETE FROM su_dung_dv WHERE ma_phieu = $1', [ma_phieu]);
            for (const dv of dich_vu_da_dung) {
                const ma_sddv = generateId('SDDV'); 
                await client.query('INSERT INTO su_dung_dv (ma_sddv, ma_phieu, ma_dv, so_luong, ngay_su_dung) VALUES ($1, $2, $3, $4, $5)', [ma_sddv, ma_phieu, dv.ma_dv, dv.so_luong, ngay_lap || new Date()]);
            }
        }
        
        // Tính lại tổng tiền phòng
        const phongDatRes = await client.query(`SELECT p.gia, pd.ngay_nhan, pd.ngay_tra FROM phong_dat pdph JOIN phieu_dat pd ON pdph.ma_phieu = pd.ma_phieu JOIN phong p ON pdph.ma_phong = p.ma_phong WHERE pdph.ma_phieu = $1`, [ma_phieu]);
        let totalRoomPrice = 0;
        for (const phong of phongDatRes.rows) {
            const ngayNhan = new Date(phong.ngay_nhan);
            const ngayTra = new Date(phong.ngay_tra);
            let so_dem = 0;
            if (ngayTra > ngayNhan) {
                so_dem = Math.ceil((ngayTra.getTime() - ngayNhan.getTime()) / (1000 * 60 * 60 * 24));
            } else if (ngayTra.toDateString() === ngayNhan.toDateString()) {
                so_dem = 1;
            }
            totalRoomPrice += parseFloat(phong.gia) * so_dem;
        }

        // Tính lại tổng tiền dịch vụ
        const dichVuRes = await client.query(`SELECT dv.don_gia, sddv.so_luong FROM su_dung_dv sddv JOIN dich_vu dv ON sddv.ma_dv = dv.ma_dv WHERE sddv.ma_phieu = $1`, [ma_phieu]);
        const totalServicePrice = dichVuRes.rows.reduce((sum, item) => sum + (parseFloat(item.don_gia) * item.so_luong), 0);
        
        const new_tong_tien = totalRoomPrice + totalServicePrice;

        const updateResult = await client.query('UPDATE hoa_don SET ngay_lap = $1, tong_tien = $2, trang_thai_thanh_toan = $3, hinh_thuc_thanh_toan = $4 WHERE ma_hd = $5 RETURNING *', [ngay_lap, new_tong_tien, trang_thai_thanh_toan, hinh_thuc_thanh_toan, id]);
        
        await client.query('COMMIT');
        res.json(updateResult.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error updating invoice:', err);
        res.status(500).json({ error: 'Lỗi khi cập nhật hóa đơn: ' + err.message });
    } finally {
        client.release();
    }
};

// DELETE /api/hoadon/:id
const deleteHoaDon = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM hoa_don WHERE ma_hd = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy hóa đơn' });
        }
        res.json({ message: 'Đã xóa hóa đơn' });
    } catch (err) {
        console.error('Error deleting invoice:', err);
        res.status(500).json({ error: 'Lỗi khi xóa hóa đơn: ' + err.message });
    }
};

module.exports = {
    getAllHoaDon,
    getHoaDonById,
    createHoaDon,
    updateHoaDon,
    deleteHoaDon
};
