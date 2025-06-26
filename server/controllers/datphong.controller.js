// datphong.controller.js - controller cho các thao tác đặt phòng
const pool = require('../db'); // Import pool kết nối cơ sở dữ liệu
const { generateId } = require('../utils/id.util'); // Import hàm tạo ID (đã sửa sang CommonJS trong id.util.js)

/**
 * Hàm trợ giúp để tính toán tổng tiền phòng dựa trên phiếu đặt.
 * @param {object} client - Đối tượng client từ pool kết nối DB (để sử dụng trong transaction).
 * @param {string} ma_phieu - Mã phiếu đặt cần tính tổng tiền phòng.
 * @returns {Promise<number>} Tổng tiền phòng.
 */
async function calculateRoomTotal(client, ma_phieu) {
    // Truy vấn để lấy giá phòng và ngày nhận/trả từ các phòng đã đặt trong phiếu này
    const phongDatRes = await client.query(`
        SELECT p.gia, pd.ngay_nhan, pd.ngay_tra
        FROM phong_dat pdph
        JOIN phieu_dat pd ON pdph.ma_phieu = pd.ma_phieu
        JOIN phong p ON pdph.ma_phong = p.ma_phong
        WHERE pdph.ma_phieu = $1
    `, [ma_phieu]);

    let totalRoomPrice = 0;
    // Lặp qua từng phòng đã đặt để tính tổng tiền
    for (const phong of phongDatRes.rows) {
        const ngayNhan = new Date(phong.ngay_nhan);
        const ngayTra = new Date(phong.ngay_tra);

        let so_dem = 0;
        if (ngayTra > ngayNhan) { // Chỉ tính nếu ngày trả thực sự sau ngày nhận
            so_dem = Math.ceil((ngayTra.getTime() - ngayNhan.getTime()) / (1000 * 60 * 60 * 24));
        } else if (ngayTra.toDateString() === ngayNhan.toDateString()) {
             // Nếu ngày nhận và ngày trả cùng một ngày, tính là 1 đêm (check-in/check-out trong cùng ngày)
             so_dem = 1; 
        } else {
            console.warn(`Cảnh báo: Ngày trả (${phong.ngay_tra}) trước Ngày nhận (${phong.ngay_nhan}) cho phiếu đặt ${ma_phieu}. Mặc định 1 đêm.`);
            so_dem = 1; // Trường hợp ngày trả trước ngày nhận, mặc định 1 đêm
        }
        
        totalRoomPrice += parseFloat(phong.gia) * so_dem; // Tổng giá phòng = giá * số đêm
    }
    return totalRoomPrice;
}

/**
 * Hàm trợ giúp để tính tổng tiền dịch vụ và chèn vào bảng su_dung_dv.
 * @param {object} client - Đối tượng client từ pool kết nối DB.
 * @param {string} ma_phieu - Mã phiếu đặt liên quan.
 * @param {Array<Object>} selectedServices - Mảng các dịch vụ đã chọn từ frontend.
 * @param {string} ngay_su_dung - Ngày dịch vụ được sử dụng (thường là ngày nhận phòng).
 * @returns {Promise<number>} Tổng tiền dịch vụ.
 */
async function calculateAndInsertServiceTotal(client, ma_phieu, selectedServices, ngay_su_dung) {
    let totalServicePrice = 0;
    if (!selectedServices || selectedServices.length === 0) {
        return 0; // Không có dịch vụ nào, tổng tiền dịch vụ là 0
    }

    for (const service of selectedServices) {
        // Lấy đơn giá dịch vụ từ DB
        const dvRes = await client.query('SELECT don_gia FROM dich_vu WHERE ma_dv = $1', [service.ma_dv]);
        if (dvRes.rows.length > 0) {
            const don_gia = parseFloat(dvRes.rows[0].don_gia);
            const so_luong = service.so_luong;
            totalServicePrice += don_gia * so_luong;

            // Chèn bản ghi vào bảng su_dung_dv
            const ma_sddv = generateId('SDDV');
            await client.query(`
                INSERT INTO su_dung_dv (ma_sddv, ma_phieu, ma_dv, so_luong, ngay_su_dung)
                VALUES ($1, $2, $3, $4, $5);
            `, [ma_sddv, ma_phieu, service.ma_dv, so_luong, ngay_su_dung]);
            console.log(`Đã thêm dịch vụ ${service.ma_dv} (SL: ${so_luong}) cho phiếu ${ma_phieu}`);
        } else {
            console.warn(`Cảnh báo: Không tìm thấy dịch vụ với mã ${service.ma_dv}.`);
        }
    }
    return totalServicePrice;
}


// Xử lý logic đặt phòng mới
const datPhong = async (req, res) => {
  // Bóc tách dữ liệu cần thiết từ request body
  const { ma_kh, ngay_dat, ngay_nhan, ngay_tra, ma_phongs, hinh_thuc_thanh_toan, ma_nv_thuc_hien, dich_vu_da_dung } = req.body;
  
  // Sử dụng ma_nv từ request body nếu có, nếu không thì dùng 'NV001' mặc định
  const ma_nv_tao_hd = ma_nv_thuc_hien || 'NV001'; 
  // Sử dụng hinh_thuc_thanh_toan từ request body nếu có, nếu không thì để null
  const hinh_thuc_tt = hinh_thuc_thanh_toan || null; 

  const client = await pool.connect(); // Lấy một client từ pool để bắt đầu transaction
  try {
    await client.query('BEGIN'); // Bắt đầu transaction SQL

    // 1. Tạo ID phiếu đặt
    const ma_phieu = generateId('PD'); 

    // 2. Chèn dữ liệu vào bảng phieu_dat (phiếu đặt)
    await client.query(`
      INSERT INTO phieu_dat (ma_phieu, ma_kh, ma_nv, ngay_dat, ngay_nhan, ngay_tra)
      VALUES ($1, $2, $3, $4, $5, $6);
    `, [ma_phieu, ma_kh, ma_nv_tao_hd, ngay_dat, ngay_nhan, ngay_tra]); 
    console.log(`Đã tạo phiếu đặt: ${ma_phieu} cho KH: ${ma_kh}`);

    // 3. Xử lý đặt nhiều phòng: Chèn vào phong_dat và cập nhật trạng thái phòng
    if (!ma_phongs || ma_phongs.length === 0) {
      throw new Error('Không có phòng nào được chọn để đặt.');
    }

    for (const phongId of ma_phongs) {
      const phongDat = generateId('PDPH'); // Tạo ID duy nhất cho mỗi bản ghi phong_dat

      // Chèn vào bảng phong_dat để ghi nhận phòng đã được đặt
      await client.query(`
        INSERT INTO phong_dat (ma_phong_dat, ma_phieu, ma_phong)
        VALUES ($1, $2, $3);
      `, [phongDat, ma_phieu, phongId]);
      console.log(`Đã liên kết phòng ${phongId} với phiếu đặt ${ma_phieu}`);

      // Cập nhật trạng thái của phòng thành 'Da_dat' (đã đặt)
      await client.query(`
        UPDATE phong SET trang_thai = 'Da_dat' WHERE ma_phong = $1;
      `, [phongId]);
      console.log(`Đã cập nhật trạng thái phòng ${phongId} thành 'Da_dat'`);
    }

    // 4. Tính toán tổng tiền phòng
    const tong_tien_phong = await calculateRoomTotal(client, ma_phieu);
    
    // 5. Tính toán tổng tiền dịch vụ và chèn vào su_dung_dv
    // Ngày sử dụng dịch vụ mặc định là ngày nhận phòng
    const tong_tien_dich_vu = await calculateAndInsertServiceTotal(client, ma_phieu, dich_vu_da_dung, ngay_nhan); 

    // Tổng tiền cuối cùng = tiền phòng + tiền dịch vụ
    const tong_tien_hoa_don = tong_tien_phong + tong_tien_dich_vu;
    console.log(`Tổng tiền phòng: ${tong_tien_phong}đ, Tổng tiền dịch vụ: ${tong_tien_dich_vu}đ. Tổng hóa đơn: ${tong_tien_hoa_don}đ`);

    // 6. Tạo Hóa đơn
    const ma_hd = generateId('HD'); 

    await client.query(`
      INSERT INTO hoa_don (ma_hd, ma_phieu, ma_nv, ngay_lap, tong_tien, trang_thai_thanh_toan, hinh_thuc_thanh_toan)
      VALUES ($1, $2, $3, $4, $5, $6, $7);
    `, [ma_hd, ma_phieu, ma_nv_tao_hd, ngay_dat, tong_tien_hoa_don, 'dang_xu_li', hinh_thuc_tt]); 
    console.log(`Đã tạo hóa đơn ${ma_hd} cho phiếu đặt ${ma_phieu} với tổng tiền ${tong_tien_hoa_don}`);

    await client.query('COMMIT'); 
    res.status(201).json({ ma_phieu, ma_hd, message: 'Đặt phòng và tạo hóa đơn thành công' });

  } catch (err) {
    await client.query('ROLLBACK'); 
    console.error("Lỗi trong datPhong:", err); 
    res.status(500).json({ error: 'Lỗi khi tạo phiếu đặt phòng hoặc hóa đơn: ' + err.message });
  } finally {
    client.release(); 
  }
};

module.exports = { datPhong };
