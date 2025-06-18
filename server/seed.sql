-- backend/schema.sql

-- Drop tables if they exist to allow for clean re-creation
DROP TABLE IF EXISTS su_dung_dv CASCADE;
DROP TABLE IF EXISTS phong_dat CASCADE;
DROP TABLE IF EXISTS hoa_don CASCADE;
DROP TABLE IF EXISTS phieu_dat CASCADE;
DROP TABLE IF EXISTS phong CASCADE;
DROP TABLE IF EXISTS dich_vu CASCADE;
DROP TABLE IF EXISTS nhan_vien CASCADE;
DROP TABLE IF EXISTS khach_hang CASCADE;

-- Create table KHACH_HANG
CREATE TABLE khach_hang (
    ma_kh VARCHAR(20) PRIMARY KEY,
    ten_kh VARCHAR(100) NOT NULL,
    sdt VARCHAR(20) NOT NULL UNIQUE, -- Sdt should be unique for customer search
    email VARCHAR(100),
    cmnd VARCHAR(20) UNIQUE, -- CMND/CCCD should be unique
    dia_chi VARCHAR(255),
    ngay_sinh DATE,
    gioi_tinh VARCHAR(10) CHECK (gioi_tinh IN ('nam', 'nu', 'khac')) NOT NULL,
    quoc_tich VARCHAR(50)
);

-- Create table NHAN_VIEN
CREATE TABLE nhan_vien (
    ma_nv VARCHAR(20) PRIMARY KEY,
    ten_nv VARCHAR(100) NOT NULL,
    chuc_vu VARCHAR(50) NOT NULL CHECK (chuc_vu IN ('quan_li', 'le_tan', 'tap_vu')),
    luong DECIMAL(10, 2),
    ngay_sinh DATE,
    dia_chi VARCHAR(255),
    sdt VARCHAR(20) UNIQUE,
    email VARCHAR(100) UNIQUE,
    gioi_tinh VARCHAR(10) CHECK (gioi_tinh IN ('nam', 'nu', 'khac')),
    ngay_bat_dau DATE
);

-- Create table PHONG
CREATE TABLE phong (
    ma_phong VARCHAR(20) PRIMARY KEY,
    so_phong VARCHAR(10) NOT NULL UNIQUE,
    loai_phong VARCHAR(50) NOT NULL CHECK (loai_phong IN ('Standard', 'Luxury', 'President')),
    loai_giuong VARCHAR(10) NOT NULL CHECK (loai_giuong IN ('single', 'double')),
    gia DECIMAL(10, 2) NOT NULL,
    trang_thai VARCHAR(50) NOT NULL DEFAULT 'Trong' CHECK (trang_thai IN ('Trong', 'Da_dat', 'Dang_o', 'Bao_tri'))
);

-- Create table DICH_VU
CREATE TABLE dich_vu (
    ma_dv VARCHAR(20) PRIMARY KEY,
    ten_dv VARCHAR(100) NOT NULL CHECK (ten_dv IN ('Spa', 'Laundry', 'Food', 'Drink', 'Internet', 'Gym')),
    don_gia DECIMAL(10, 2) NOT NULL,
    mo_ta TEXT
);

-- Create table PHIEU_DAT (Booking Slip)
CREATE TABLE phieu_dat (
    ma_phieu VARCHAR(20) PRIMARY KEY,
    ma_kh VARCHAR(20) NOT NULL,
    ma_nv VARCHAR(20) NOT NULL,
    ngay_dat DATE NOT NULL,
    ngay_nhan DATE NOT NULL,
    ngay_tra DATE NOT NULL,
    FOREIGN KEY (ma_kh) REFERENCES khach_hang(ma_kh) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (ma_nv) REFERENCES nhan_vien(ma_nv) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- Create table PHONG_DAT (Room Booked) - New Many-to-Many table
CREATE TABLE phong_dat (
    ma_phong_dat VARCHAR(20) PRIMARY KEY,
    ma_phieu VARCHAR(20) NOT NULL,
    ma_phong VARCHAR(20) NOT NULL,
    UNIQUE (ma_phieu, ma_phong),
    FOREIGN KEY (ma_phieu) REFERENCES phieu_dat(ma_phieu) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (ma_phong) REFERENCES phong(ma_phong) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- Create table SU_DUNG_DV (Service Usage)
CREATE TABLE su_dung_dv (
    ma_sddv VARCHAR(20) PRIMARY KEY,
    ma_phieu VARCHAR(20) NOT NULL,
    ma_dv VARCHAR(20) NOT NULL,
    so_luong INT NOT NULL,
    ngay_su_dung DATE NOT NULL,
    FOREIGN KEY (ma_phieu) REFERENCES phieu_dat(ma_phieu) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (ma_dv) REFERENCES dich_vu(ma_dv) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- Create table HOA_DON (Invoice)
CREATE TABLE hoa_don (
    ma_hd VARCHAR(20) PRIMARY KEY,
    ma_phieu VARCHAR(20) NOT NULL UNIQUE,
    ma_nv VARCHAR(20),
    ngay_lap DATE DEFAULT CURRENT_DATE,
    tong_tien DECIMAL(10, 2) NOT NULL,
    trang_thai_thanh_toan VARCHAR(20) DEFAULT 'dang_xu_li' CHECK (trang_thai_thanh_toan IN ('da_thanh_toan', 'dang_xu_li')),
    hinh_thuc_thanh_toan VARCHAR(20) CHECK (hinh_thuc_thanh_toan IN ('cash', 'banking', 'momo', 'zalopay')),
    FOREIGN KEY (ma_phieu) REFERENCES phieu_dat(ma_phieu) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (ma_nv) REFERENCES nhan_vien(ma_nv) ON UPDATE CASCADE ON DELETE SET NULL
);


-- Insert Dummy Data

-- 1. KHACH_HANG – 10 khách
INSERT INTO khach_hang (ma_kh, ten_kh, sdt, email, cmnd, dia_chi, ngay_sinh, gioi_tinh, quoc_tich) VALUES
('KH001', 'Nguyen Van An', '0901000001', 'an.nguyen@example.com', '01234567812', '123 Le Loi, TP HCM', '1995-03-15', 'nam', 'Viet Nam'),
('KH002', 'Tran Thi Binh', '0902000002', 'binh.tran@example.com', '02234567813', '45 Tran Hung Dao, Ha Noi', '1992-07-22', 'nu', 'Viet Nam'),
('KH003', 'Le Quang Cuong', '0903000003', 'cuong.le@example.com', '03234567814', '2 Nguyen Hue, Da Nang', '1988-11-09', 'nam', 'Viet Nam'),
('KH004', 'Pham Mai Dao', '0904000004', 'dao.pham@example.com', '04234567815', '99 Hai Ba Trung, Hue', '1999-02-28', 'nu', 'Viet Nam'),
('KH005', 'Hoang Minh Duc', '0905000005', 'duc.hoang@example.com', '05234567816', '56 Cach Mang Thang 8, TP HCM', '1990-05-05', 'nam', 'Viet Nam'),
('KH006', 'Vo Kim Anh', '0906000006', 'anh.vo@example.com', '06234567817', '11 Phan Boi Chau, Da Lat', '2000-01-24', 'nu', 'Viet Nam'),
('KH007', 'Dang Trung Kien', '0907000007', 'kien.dang@example.com', '07234567818', '7 Bach Dang, Ha Noi', '1987-08-14', 'nam', 'Viet Nam'),
('KH008', 'Nguyen Lan Huong', '0908000008', 'huong.nguyen@example.com', '08234567819', '88 Vo Thi Sau, Vung Tau', '1994-12-02', 'nu', 'Viet Nam'),
('KH009', 'Bui Tuan Kiet', '0909000009', 'kiet.bui@example.com', '09234567820', '15 Nguyen Tri Phuong, Can Tho', '1996-06-18', 'nam', 'Viet Nam'),
('KH010', 'Tran Thu Van', '0910000010', 'van.tran@example.com', '10234567821', '20 Dinh Tien Hoang, Nha Trang', '1993-09-27', 'nu', 'Viet Nam');

-- 2. NHAN_VIEN – 10 nhân viên
INSERT INTO nhan_vien (ma_nv, ten_nv, chuc_vu, luong, ngay_sinh, dia_chi, sdt, email, gioi_tinh, ngay_bat_dau) VALUES
('NV001', 'Le Tan Phong', 'quan_li', 15000000, '1985-04-10', '12 D3 Binh Thanh, TP HCM', '0931000001', 'phong.le@hotel.com', 'nam', '2015-06-01'),
('NV002', 'Pham Gia Han', 'le_tan', 8000000, '1998-03-20', '112 Nguyen Thi Minh Khai, TP HCM', '0932000002', 'han.pham@hotel.com', 'nu', '2022-01-05'),
('NV003', 'Vo Quoc Bao', 'le_tan', 8000000, '1997-11-05', '33 Tran Phu, Nha Trang', '0933000003', 'bao.vo@hotel.com', 'nam', '2021-09-10'),
('NV004', 'Nguyen Hong Nhung', 'tap_vu', 6000000, '1999-12-12', '2/4 Phan Dinh Phung, Da Nang', '0934000004', 'nhung.nguyen@hotel.com', 'nu', '2023-03-01'),
('NV005', 'Tran Van Hoang', 'tap_vu', 6000000, '1996-02-17', '90 Bui Thi Xuan, Da Lat', '0935000005', 'hoang.tran@hotel.com', 'nam', '2020-07-15'),
('NV006', 'Le Minh Chau', 'le_tan', 8200000, '1994-08-30', '70 Dang Dung, Hue', '0936000006', 'chau.le@hotel.com', 'nu', '2021-11-20'),
('NV007', 'Do Nhat Quang', 'tap_vu', 6200000, '1993-07-07', '3 Tran Phu, Ha Noi', '0937000007', 'quang.do@hotel.com', 'nam', '2019-10-10'),
('NV008', 'Nguyen Bao Anh', 'le_tan', 8300000, '2000-06-02', '15 Huynh Thuc Khang, Quy Nhon', '0938000008', 'anh.nguyen@hotel.com', 'nu', '2024-02-14'),
('NV009', 'Pham Quoc Hung', 'tap_vu', 6100000, '1991-05-18', '88 Le Duan, TP HCM', '0939000009', 'hung.pham@hotel.com', 'nam', '2018-09-25'),
('NV010', 'Tran Ngoc Thao', 'le_tan', 8400000, '1995-01-09', '6 Tran Hung Dao, Vung Tau', '0940000010', 'thao.tran@hotel.com', 'nu', '2023-05-05');

-- 3. PHONG – 10 phòng
INSERT INTO phong (ma_phong, so_phong, loai_phong, loai_giuong, gia, trang_thai) VALUES
('P001', '101', 'Standard', 'single', 500000, 'Trong'),
('P002', '102', 'Standard', 'double', 600000, 'Trong'),
('P003', '201', 'Luxury', 'double', 800000, 'Trong'),
('P004', '202', 'Luxury', 'double', 850000, 'Trong'),
('P005', '301', 'President', 'double', 1200000, 'Trong'),
('P006', '302', 'President', 'double', 1250000, 'Trong'),
('P007', '103', 'Standard', 'single', 520000, 'Trong'),
('P008', '104', 'Standard', 'double', 620000, 'Trong'),
('P009', '203', 'Luxury', 'single', 780000, 'Trong'),
('P010', '304', 'President', 'double', 1300000, 'Trong'); -- Changed to 'Trong' for fresh start

-- 4. DICH_VU – 10 dịch vụ
INSERT INTO dich_vu (ma_dv, ten_dv, don_gia, mo_ta) VALUES
('DV001', 'Spa', 300000, 'Goi spa thu gian 60 phut'),
('DV002', 'Laundry', 50000, 'Giat ui quan ao'),
('DV003', 'Food', 150000, 'Bua an toi tai phong'),
('DV004', 'Drink', 50000, 'Nuoc giai khat'),
('DV005', 'Internet', 20000, 'Thue WiFi trong phong'),
('DV006', 'Gym', 100000, 'Su dung phong tap the duc'),
('DV007', 'Spa', 450000, 'Massage da mat'),
('DV008', 'Laundry', 30000, 'Danh bong giay'),
('DV009', 'Food', 200000, 'Set an sang'),
('DV010', 'Drink', 80000, 'Ruou vang do');

 5. PHIEU_DAT – 10 phiếu đặt
INSERT INTO phieu_dat (ma_phieu, ma_kh, ma_nv, ngay_dat, ngay_nhan, ngay_tra) VALUES
('PD001', 'KH001', 'NV002', '2025-06-15', '2025-06-18', '2025-06-20'),
('PD002', 'KH002', 'NV003', '2025-06-16', '2025-06-19', '2025-06-21'),
('PD003', 'KH003', 'NV002', '2025-06-17', '2025-06-22', '2025-06-25'),
('PD004', 'KH004', 'NV003', '2025-06-18', '2025-06-23', '2025-06-26'),
('PD005', 'KH005', 'NV002', '2025-06-18', '2025-06-19', '2025-06-20'),
('PD006', 'KH006', 'NV008', '2025-06-19', '2025-06-24', '2025-06-27'),
('PD007', 'KH007', 'NV008', '2025-06-20', '2025-06-25', '2025-06-28'),
('PD008', 'KH008', 'NV002', '2025-06-21', '2025-06-26', '2025-06-29'),
('PD009', 'KH009', 'NV003', '2025-06-22', '2025-06-27', '2025-06-30'),
('PD010', 'KH010', 'NV008', '2025-06-23', '2025-06-28', '2025-07-01');

-- 6. PHONG_DAT – 1 phiếu ↔ 1 phòng (10 bản ghi)
INSERT INTO phong_dat (ma_phong_dat, ma_phieu, ma_phong) VALUES
('PDPH001', 'PD001', 'P001'),
('PDPH002', 'PD002', 'P003'),
('PDPH003', 'PD003', 'P004'),
('PDPH004', 'PD004', 'P005'),
('PDPH005', 'PD005', 'P002'),
('PDPH006', 'PD006', 'P006'),
('PDPH007', 'PD007', 'P007'),
('PDPH008', 'PD008', 'P008'),
('PDPH009', 'PD009', 'P009'),
('PDPH010', 'PD010', 'P010');

-- 7. SU_DUNG_DV (Service Usage)
INSERT INTO su_dung_dv (ma_sddv, ma_phieu, ma_dv, so_luong, ngay_su_dung) VALUES
('SDDV001', 'PD001', 'DV001', 1, '2025-06-18'),
('SDDV002', 'PD002', 'DV002', 2, '2025-06-19'),
('SDDV003', 'PD003', 'DV003', 1, '2025-06-22'),
('SDDV004', 'PD004', 'DV004', 3, '2025-06-23'),
('SDDV005', 'PD005', 'DV005', 1, '2025-06-19'),
('SDDV006', 'PD006', 'DV006', 2, '2025-06-24'),
('SDDV007', 'PD007', 'DV007', 1, '2025-06-25'),
('SDDV008', 'PD008', 'DV008', 1, '2025-06-26'),
('SDDV009', 'PD009', 'DV009', 1, '2025-06-27'),
('SDDV010', 'PD010', 'DV010', 2, '2025-06-28');

-- 8. HOA_DON – 10 hoá đơn
INSERT INTO hoa_don (ma_hd, ma_phieu, ma_nv, ngay_lap, tong_tien, trang_thai_thanh_toan, hinh_thuc_thanh_toan) VALUES
('HD001', 'PD001', 'NV001', '2025-06-20', 1350000, 'da_thanh_toan', 'cash'),
('HD002', 'PD002', 'NV001', '2025-06-21', 1520000, 'da_thanh_toan', 'banking'),
('HD003', 'PD003', 'NV001', '2025-06-25', 1750000, 'dang_xu_li', 'momo'),
('HD004', 'PD004', 'NV001', '2025-06-26', 1980000, 'dang_xu_li', 'zalopay'),
('HD005', 'PD005', 'NV001', '2025-06-20', 1120000, 'da_thanh_toan', 'cash'),
('HD006', 'PD006', 'NV001', '2025-06-27', 2250000, 'dang_xu_li', 'banking'),
('HD007', 'PD007', 'NV001', '2025-06-28', 1450000, 'da_thanh_toan', 'momo'),
('HD008', 'PD008', 'NV001', '2025-06-29', 1600000, 'dang_xu_li', 'cash'),
('HD009', 'PD009', 'NV001', '2025-06-30', 1820000, 'da_thanh_toan', 'zalopay'),
('HD010', 'PD010', 'NV001', '2025-07-01', 2050000, 'dang_xu_li', 'banking');

-- No initial data for phieu_dat, phong_dat, su_dung_dv, hoa_don as they are created via the booking process
-- or linked to other tables, ensuring referential integrity.
