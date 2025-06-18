
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const [resPhong, resKH, resHD] = await Promise.all([
      fetch('/api/phong'),
      fetch('/api/khachhang'),
      fetch('/api/hoadon')
    ]);

    const phong = await resPhong.json();
    const khach = await resKH.json();
    const hoadon = await resHD.json();

    document.getElementById("totalPhong").textContent = phong.length;
    document.getElementById("phongDangO").textContent = phong.filter(p => p.trang_thai === "Dang_o").length;
    document.getElementById("tongKH").textContent = khach.length;
    document.getElementById("tongHD").textContent = hoadon.length;

    const doanhthu = hoadon
      .filter(hd => hd.trang_thai_thanh_toan === 'da_thanh_toan')
      .reduce((sum, hd) => sum + Number(hd.tong_tien), 0);

    document.getElementById("tongDoanhThu").textContent = doanhthu.toLocaleString('vi-VN');
  } catch (err) {
    console.error("Lỗi khi tải thống kê:", err);
  }
});
