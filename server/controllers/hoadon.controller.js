const pool = require('../db');
const { generateId } = require('../utils/id.util'); // Giả định bạn có hàm generateId

// --- Helper Function to format the joined data ---
// Hàm này sẽ gom nhóm các hàng từ truy vấn JOIN thành một đối tượng hóa đơn có cấu trúc.
const formatHoaDonDetails = (rows) => {
    if (!rows || rows.length === 0) return null;

    const hoaDon = {
        ma_hd: rows[0].ma_hd,
        ma_phieu: rows[0].ma_phieu,
        ngay_lap: rows[0].ngay_lap,
        tong_tien: parseFloat(rows[0].tong_tien),
        trang_thai_thanh_toan: rows[0].trang_thai_thanh_toan,
        hinh_thuc_thanh_toan: rows[0].hinh_thuc_thanh_toan,
        
        khach_hang: rows[0].kh_ma_kh ? {
            ma_kh: rows[0].kh_ma_kh,
            ten_kh: rows[0].kh_ten_kh,
            sdt: rows[0].kh_sdt,
            email: rows[0].kh_email,
            cmnd: rows[0].kh_cmnd,
            dia_chi: rows[0].kh_dia_chi,
            ngay_sinh: rows[0].kh_ngay_sinh,
            gioi_tinh: rows[0].kh_gioi_tinh,
            quoc_tich: rows[0].kh_quoc_tich
        } : null,

        nhan_vien_lap: rows[0].nv_ma_nv ? {
            ma_nv: rows[0].nv_ma_nv,
            ten_nv: rows[0].nv_ten_nv
        } : null,

        thong_tin_dat_phong: rows[0].pd_ma_phieu ? {
            ma_phieu_dat: rows[0].pd_ma_phieu,
            ngay_dat: rows[0].pd_ngay_dat,
            ngay_nhan: rows[0].pd_ngay_nhan,
            ngay_tra: rows[0].pd_ngay_tra,
            so_dem: rows[0].pd_ngay_nhan && rows[0].pd_ngay_tra
                ? (new Date(rows[0].pd_ngay_tra) - new Date(rows[0].pd_ngay_nhan)) / (1000 * 60 * 60 * 24)
                : null,
            phong_da_dat: []
        } : null,
        dich_vu_da_dung: [] // Thêm mảng này cho dịch vụ
    };

    const addedRooms = new Set();
    const addedServices = new Set();

    rows.forEach(row => {
        // Thêm phòng đã đặt
        if (row.p_ma_phong && !addedRooms.has(row.p_ma_phong)) {
            if (hoaDon.thong_tin_dat_phong) {
                hoaDon.thong_tin_dat_phong.phong_da_dat.push({
                    ma_phong: row.p_ma_phong,
                    so_phong: row.p_so_phong,
                    loai_phong: row.p_loai_phong,
                    gia_phong_tai_thoi_diem: parseFloat(row.p_gia) // Lấy giá hiện tại của phòng từ bảng phong
                });
                addedRooms.add(row.p_ma_phong);
            }
        }
        // Thêm dịch vụ đã sử dụng (nếu có bảng chi_tiet_hoa_don_dich_vu)
        if (row.dv_ma_dv && !addedServices.has(row.dv_ma_dv)) {
            hoaDon.dich_vu_da_dung.push({
                ma_dich_vu: row.dv_ma_dv,
                ten_dv: row.dv_ten_dv,
                so_luong: parseInt(row.dv_so_luong),
                don_gia_tai_thoi_diem: parseFloat(row.dv_don_gia_tai_thoi_diem)
            });
            addedServices.add(row.dv_ma_dv);
        }
    });

    return hoaDon;
};

// --- Controllers ---

// GET /api/hoadon?search=
const getAllHoaDon = async (req, res) => {
    try {
        const search = req.query.search || '';
        const query = `
            SELECT
                hd.ma_hd, hd.ngay_lap, hd.tong_tien, hd.trang_thai_thanh_toan, hd.hinh_thuc_thanh_toan,
                pd.ma_phieu AS pd_ma_phieu, pd.ngay_dat AS pd_ngay_dat, pd.ngay_nhan AS pd_ngay_nhan, pd.ngay_tra AS pd_ngay_tra,
                kh.ma_kh AS kh_ma_kh, kh.ten_kh AS kh_ten_kh, kh.sdt AS kh_sdt, kh.email AS kh_email,
                kh.cmnd AS kh_cmnd, kh.dia_chi AS kh_dia_chi, kh.ngay_sinh AS kh_ngay_sinh,
                kh.gioi_tinh AS kh_gioi_tinh, kh.quoc_tich AS kh_quoc_tich,
                nv.ma_nv AS nv_ma_nv, nv.ten_nv AS nv_ten_nv,
                pdph.ma_phong AS p_ma_phong, p.so_phong AS p_so_phong, p.loai_phong AS p_loai_phong, p.gia AS p_gia,
                ct_dv.ma_dich_vu AS dv_ma_dv, dv.ten_dv AS dv_ten_dv, ct_dv.so_luong AS dv_so_luong, ct_dv.don_gia_tai_thoi_diem AS dv_don_gia_tai_thoi_diem
            FROM
                hoa_don hd
            LEFT JOIN
                phieu_dat pd ON hd.ma_phieu = pd.ma_phieu
            LEFT JOIN
                khach_hang kh ON pd.ma_kh = kh.ma_kh -- Join via phieu_dat
            LEFT JOIN
                nhan_vien nv ON hd.ma_nv = nv.ma_nv
            LEFT JOIN
                phong_dat pdph ON pd.ma_phieu = pdph.ma_phieu
            LEFT JOIN
                phong p ON pdph.ma_phong = p.ma_phong
            LEFT JOIN
                chi_tiet_hoa_don_dich_vu ct_dv ON hd.ma_hd = ct_dv.ma_hd -- Join to get service details
            LEFT JOIN
                dich_vu dv ON ct_dv.ma_dich_vu = dv.ma_dv
            WHERE
                CAST(hd.ma_hd AS TEXT) ILIKE $1 OR
                CAST(pd.ma_phieu AS TEXT) ILIKE $1 OR
                LOWER(kh.ten_kh) ILIKE LOWER($1) OR
                LOWER(nv.ten_nv) ILIKE LOWER($1)
            ORDER BY
                hd.ngay_lap DESC, hd.ma_hd DESC;
        `;
        const result = await pool.query(query, [`%${search}%`]);

        // Group rows by ma_hd
        const groupedInvoices = new Map();
        result.rows.forEach(row => {
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
        const query = `
            SELECT
                hd.ma_hd, hd.ngay_lap, hd.tong_tien, hd.trang_thai_thanh_toan, hd.hinh_thuc_thanh_toan,
                pd.ma_phieu AS pd_ma_phieu, pd.ngay_dat AS pd_ngay_dat, pd.ngay_nhan AS pd_ngay_nhan, pd.ngay_tra AS pd_ngay_tra,
                kh.ma_kh AS kh_ma_kh, kh.ten_kh AS kh_ten_kh, kh.sdt AS kh_sdt, kh.email AS kh_email,
                kh.cmnd AS kh_cmnd, kh.dia_chi AS kh_dia_chi, kh.ngay_sinh AS kh_ngay_sinh,
                kh.gioi_tinh AS kh_gioi_tinh, kh.quoc_tich AS kh_quoc_tich,
                nv.ma_nv AS nv_ma_nv, nv.ten_nv AS nv_ten_nv,
                pdph.ma_phong AS p_ma_phong, p.so_phong AS p_so_phong, p.loai_phong AS p_loai_phong, p.gia AS p_gia,
                ct_dv.ma_dich_vu AS dv_ma_dv, dv.ten_dv AS dv_ten_dv, ct_dv.so_luong AS dv_so_luong, ct_dv.don_gia_tai_thoi_diem AS dv_don_gia_tai_thoi_diem
            FROM
                hoa_don hd
            LEFT JOIN
                phieu_dat pd ON hd.ma_phieu = pd.ma_phieu
            LEFT JOIN
                khach_hang kh ON pd.ma_kh = kh.ma_kh
            LEFT JOIN
                nhan_vien nv ON hd.ma_nv = nv.ma_nv
            LEFT JOIN
                phong_dat pdph ON pd.ma_phieu = pdph.ma_phieu
            LEFT JOIN
                phong p ON pdph.ma_phong = p.ma_phong
            LEFT JOIN
                chi_tiet_hoa_don_dich_vu ct_dv ON hd.ma_hd = ct_dv.ma_hd
            LEFT JOIN
                dich_vu dv ON ct_dv.ma_dich_vu = dv.ma_dv
            WHERE
                hd.ma_hd = $1;
        `;
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
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Start transaction

        const { 
            ma_phieu, 
            ma_nv, 
            tong_tien, // Assume tong_tien is provided from client or pre-calculated
            trang_thai_thanh_toan = 'chua_thanh_toan', 
            hinh_thuc_thanh_toan = null,
            dich_vu_da_dung = [] // Mảng các { ma_dich_vu, so_luong, don_gia_tai_thoi_diem }
        } = req.body;

        // Validate ma_phieu (booking slip)
        const phieuDatCheck = await client.query('SELECT ma_kh FROM phieu_dat WHERE ma_phieu = $1', [ma_phieu]);
        if (phieuDatCheck.rows.length === 0) {
            throw new Error('Mã phiếu đặt không hợp lệ.');
        }

        // Validate ma_nv (employee)
        const nhanVienCheck = await client.query('SELECT 1 FROM nhan_vien WHERE ma_nv = $1', [ma_nv]);
        if (nhanVienCheck.rows.length === 0) {
            throw new Error('Mã nhân viên không hợp lệ.');
        }

        const ma_hd = await generateId('hoa_don', 'HD');
        const ngay_lap = new Date(); // Use current date for ngay_lap

        // Insert into hoa_don table
        const insertQuery = `
            INSERT INTO hoa_don (ma_hd, ma_phieu, ma_nv, ngay_lap, tong_tien, trang_thai_thanh_toan, hinh_thuc_thanh_toan)
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;
        `;
        const values = [ma_hd, ma_phieu, ma_nv, ngay_lap, tong_tien, trang_thai_thanh_toan, hinh_thuc_thanh_toan];
        const newHoaDon = await client.query(insertQuery, values);

        // Insert service details if available
        for (const dv of dich_vu_da_dung) {
            if (!dv.ma_dich_vu || dv.so_luong === undefined || !dv.don_gia_tai_thoi_diem) {
                throw new Error('Thông tin dịch vụ không hợp lệ trong dich_vu_da_dung.');
            }
            // Check if service exists
            const dichVuCheck = await client.query('SELECT 1 FROM dich_vu WHERE ma_dv = $1', [dv.ma_dich_vu]);
            if (dichVuCheck.rows.length === 0) {
                throw new Error(`Mã dịch vụ ${dv.ma_dich_vu} không tồn tại.`);
            }

            await client.query(`
                INSERT INTO chi_tiet_hoa_don_dich_vu (ma_hd, ma_dich_vu, so_luong, don_gia_tai_thoi_diem)
                VALUES ($1, $2, $3, $4);
            `, [ma_hd, dv.ma_dich_vu, dv.so_luong, dv.don_gia_tai_thoi_diem]);
        }

        await client.query('COMMIT'); // Commit transaction
        res.status(201).json({ message: 'Thêm hóa đơn thành công', hoa_don: newHoaDon.rows[0] });

    } catch (err) {
        await client.query('ROLLBACK'); // Rollback if error
        console.error('Error creating hoa don:', err);
        res.status(500).json({ error: 'Lỗi khi tạo hóa đơn: ' + err.message });
    } finally {
        client.release();
    }
};

// PUT /api/hoadon/:id
const updateHoaDon = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { id } = req.params;
        const { 
            ma_phieu, 
            ma_nv, 
            tong_tien, 
            trang_thai_thanh_toan, 
            hinh_thuc_thanh_toan,
            dich_vu_da_dung = [] // Mảng mới các { ma_dich_vu, so_luong, don_gia_tai_thoi_diem }
        } = req.body;

        // Optional: Validate ma_phieu and ma_nv if they are being updated
        if (ma_phieu) {
            const phieuDatCheck = await client.query('SELECT 1 FROM phieu_dat WHERE ma_phieu = $1', [ma_phieu]);
            if (phieuDatCheck.rows.length === 0) {
                throw new Error('Mã phiếu đặt không hợp lệ.');
            }
        }
        if (ma_nv) {
            const nhanVienCheck = await client.query('SELECT 1 FROM nhan_vien WHERE ma_nv = $1', [ma_nv]);
            if (nhanVienCheck.rows.length === 0) {
                throw new Error('Mã nhân viên không hợp lệ.');
            }
        }

        const updateQuery = `
            UPDATE hoa_don SET
                ma_phieu = COALESCE($1, ma_phieu),
                ma_nv = COALESCE($2, ma_nv),
                tong_tien = COALESCE($3, tong_tien),
                trang_thai_thanh_toan = COALESCE($4, trang_thai_thanh_toan),
                hinh_thuc_thanh_toan = COALESCE($5, hinh_thuc_thanh_toan)
            WHERE ma_hd = $6 RETURNING *;
        `;
        const values = [ma_phieu, ma_nv, tong_tien, trang_thai_thanh_toan, hinh_thuc_thanh_toan, id];
        const result = await client.query(updateQuery, values);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Không tìm thấy hóa đơn để cập nhật' });
        }

        // Update service details
        // First, delete existing service details for this invoice
        await client.query('DELETE FROM chi_tiet_hoa_don_dich_vu WHERE ma_hd = $1', [id]);
        // Then, insert new service details
        for (const dv of dich_vu_da_dung) {
            if (!dv.ma_dich_vu || dv.so_luong === undefined || !dv.don_gia_tai_thoi_diem) {
                throw new Error('Thông tin dịch vụ không hợp lệ trong dich_vu_da_dung.');
            }
            const dichVuCheck = await client.query('SELECT 1 FROM dich_vu WHERE ma_dv = $1', [dv.ma_dich_vu]);
            if (dichVuCheck.rows.length === 0) {
                throw new Error(`Mã dịch vụ ${dv.ma_dich_vu} không tồn tại.`);
            }
            await client.query(`
                INSERT INTO chi_tiet_hoa_don_dich_vu (ma_hd, ma_dich_vu, so_luong, don_gia_tai_thoi_diem)
                VALUES ($1, $2, $3, $4);
            `, [id, dv.ma_dich_vu, dv.so_luong, dv.don_gia_tai_thoi_diem]);
        }

        await client.query('COMMIT');
        res.json({ message: 'Cập nhật hóa đơn thành công', hoa_don: result.rows[0] });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error updating hoa don:', err);
        res.status(500).json({ error: 'Lỗi khi cập nhật hóa đơn: ' + err.message });
    } finally {
        client.release();
    }
};

// DELETE /api/hoadon/:id
const deleteHoaDon = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { id } = req.params;

        // Delete related service details first to avoid foreign key constraints
        await client.query('DELETE FROM chi_tiet_hoa_don_dich_vu WHERE ma_hd = $1', [id]);

        const result = await client.query('DELETE FROM hoa_don WHERE ma_hd = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Không tìm thấy hóa đơn để xóa' });
        }

        await client.query('COMMIT');
        res.json({ message: 'Đã xóa hóa đơn thành công' });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error deleting hoa don:', err);
        res.status(500).json({ error: 'Lỗi khi xóa hóa đơn: ' + err.message });
    } finally {
        client.release();
    }
};


module.exports = {
    getAllHoaDon,
    getHoaDonById,
    createHoaDon,
    updateHoaDon,
    deleteHoaDon
};