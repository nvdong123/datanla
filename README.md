# 📸 Datanla Photo Booth - Hệ thống Quản lý Nhận Ảnh

Hệ thống quản lý quầy nhận ảnh photobooth tại Datanla Waterfall với 3 giao diện:
- **Public Display**: Màn hình hiển thị công khai cho khách hàng
- **Staff Dashboard**: Giao diện quản lý cho nhân viên
- **Login Page**: Trang đăng nhập bảo mật

---

## 🚀 Yêu cầu hệ thống

- **Node.js**: Phiên bản 14.x hoặc cao hơn ([Tải tại đây](https://nodejs.org/))
- **npm**: Đi kèm với Node.js
- **Trình duyệt**: Chrome, Firefox, Edge (phiên bản mới nhất)
- **Hệ điều hành**: Windows, macOS, Linux

---

## 📦 Cài đặt

### 1. Kiểm tra Node.js đã cài đặt chưa

Mở **Command Prompt** hoặc **PowerShell** và chạy:

```bash
node --version
npm --version
```

Nếu chưa cài, tải Node.js từ [https://nodejs.org/](https://nodejs.org/)

### 2. Cài đặt dependencies

Mở terminal tại thư mục project và chạy:

```bash
npm install
```

Lệnh này sẽ cài đặt:
- `express`: Web server framework
- `cors`: Xử lý Cross-Origin requests

---

## ▶️ Chạy ứng dụng

### Khởi động server

```bash
npm start
```

Hoặc:

```bash
node server.js
```

Server sẽ khởi động tại `http://localhost:3002`

Bạn sẽ thấy thông báo:
```
Server running on http://localhost:3002
Public Display: http://localhost:3002/public.html
Staff Dashboard: http://localhost:3002/staff.html
Login Page: http://localhost:3002/login.html
```

### Dừng server

Nhấn `Ctrl + C` trong terminal đang chạy server

---

## 🌐 Truy cập hệ thống

| Trang | URL | Mô tả |
|-------|-----|-------|
| **Màn hình công khai** | http://localhost:3002/public.html | Hiển thị cho khách hàng |
| **Đăng nhập** | http://localhost:3002/login.html | Đăng nhập nhân viên |
| **Quản lý** | http://localhost:3002/staff.html | Dashboard quản lý (cần đăng nhập) |

---

## 🔑 Thông tin đăng nhập

### Tài khoản mặc định:

**Admin:**
- Username: `datanla-admin`
- Password: `@dmin123`

**Staff:**
- Username: `datanla-staff`
- Password: `st@ff123`

> ⚠️ **Lưu ý**: Thay đổi mật khẩu trong file `server.js` (dòng 301-304) trước khi triển khai thực tế!

---

## ✨ Tính năng

### 1. Public Display (Màn hình công khai)
- ✅ Hiển thị danh sách ảnh sẵn sàng nhận (SUCCESS)
- ✅ Hiển thị danh sách ảnh đang in (PRINTING)
- ✅ Animation nổi bật cho ảnh mới in xong
- ✅ Tìm kiếm theo mã ảnh
- ✅ Cập nhật real-time qua Server-Sent Events (SSE)
- ✅ Logo Datanla Waterfall
- ✅ Giao diện tối ưu cho màn hình lớn

### 2. Staff Dashboard (Quản lý nhân viên)
- ✅ **KPI Cards**: Tổng đơn, Đang in, Sẵn sàng, Lỗi, Đã giao
- ✅ **Quản lý đơn hàng**: Bảng chi tiết với các trạng thái
- ✅ **Tìm kiếm & Lọc**: Theo mã đơn, trạng thái
- ✅ **Thao tác**:
  - Đánh dấu đã giao (yêu cầu đã thanh toán)
  - In lại ảnh bị lỗi
  - Đánh dấu lỗi thủ công
  - Thêm ghi chú cho đơn hàng
- ✅ **Tự động tạo đơn**: Tạo mã P-xxx tự động tăng
- ✅ **Danh sách đã giao**: Theo dõi đơn đã hoàn thành
- ✅ **Thống kê Admin**: Doanh thu, KPI, số lỗi
- ✅ **Toast notification**: Thông báo real-time
- ✅ **Dropdown menu**: Đăng xuất, thống kê

### 3. Login Page (Đăng nhập)
- ✅ Form đăng nhập với validation
- ✅ Hiển thị/ẩn mật khẩu
- ✅ Ghi nhớ đăng nhập
- ✅ Redirect tự động sau khi đăng nhập
- ✅ Bảo vệ trang staff (cần xác thực)

---

## 📊 Trạng thái đơn hàng

| Trạng thái | Mã | Mô tả |
|------------|-----|-------|
| **Chờ in** | `IN_QUEUE` | Đơn mới tạo, chờ máy in |
| **Đang in** | `PRINTING` | Đang in (mô phỏng 3-15 giây) |
| **Sẵn sàng** | `SUCCESS` | In thành công, khách có thể nhận |
| **Lỗi** | `ERROR` | In thất bại, cần in lại |
| **Đã giao** | `DELIVERED` | Khách đã nhận (ẩn khỏi màn hình công khai) |

---

## 🛠️ Cấu hình

### Thay đổi Port

Mở `server.js`, tìm dòng:
```javascript
const PORT = 3002;
```
Thay `3002` thành port mong muốn.

### Thay đổi tài khoản đăng nhập

Mở `server.js`, tìm dòng 301-304:
```javascript
const VALID_USERS = {
  'admin': 'admin123',
  'staff': 'staff123'
};
```
Thay đổi username/password theo ý muốn, sau đó restart server.

### Thay đổi Logo

Thay file logo trong các trang:
- `public.html` (dòng 15)
- `staff.html` (dòng 15)
- `login.html` (dòng 15)

---

## 📁 Cấu trúc thư mục

```
datanla-photobooth-pickup/
├── server.js                 # Server Node.js + Express
├── data.json                 # Database JSON (tự động tạo)
├── package.json              # Dependencies
├── README.md                 # File này
└── public/                   # Static files
    ├── login.html            # Trang đăng nhập
    ├── public.html           # Màn hình công khai
    ├── staff.html            # Dashboard quản lý
    ├── css/
    │   ├── login.css         # Style đăng nhập
    │   ├── public.css        # Style màn hình công khai
    │   └── staff.css         # Style dashboard
    └── js/
        ├── login.js          # Logic đăng nhập
        ├── public.js         # Logic màn hình công khai
        └── staff.js          # Logic dashboard
```

---

## 🐛 Xử lý lỗi thường gặp

### Lỗi: "npm is not recognized"
➡️ Node.js chưa được thêm vào PATH. Cài lại Node.js và chọn "Add to PATH"

### Lỗi: "Port 3002 is already in use"
➡️ Port 3002 đang bị chiếm dụng. Đổi port trong `server.js` hoặc tắt ứng dụng đang dùng port 3002

### Lỗi: "Cannot find module 'express'"
➡️ Chạy lại `npm install`

### Không đăng nhập được
➡️ Kiểm tra username/password trong `server.js` (dòng 301-304)

---

## 📝 API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/photos` | Lấy danh sách tất cả đơn ảnh |
| `POST` | `/photos` | Tạo đơn mới |
| `PUT` | `/photos/:id` | Cập nhật đơn |
| `DELETE` | `/photos/:id` | Xóa đơn |
| `POST` | `/api/login` | Đăng nhập |
| `GET` | `/events` | SSE stream (real-time updates) |

---

## 👨‍💻 Phát triển thêm

### Thêm tài khoản mới
Sửa object `VALID_USERS` trong `server.js`

### Kết nối database thực
Thay file `data.json` bằng MongoDB, MySQL, PostgreSQL

### Thêm xác thực JWT
Thay sessionStorage bằng JWT token và middleware authentication

---

## 📞 Hỗ trợ

Nếu gặp vấn đề, kiểm tra:
1. Node.js version: `node --version` (cần >= 14.x)
2. Server đang chạy: Terminal hiển thị "Server running..."
3. Console log: Mở DevTools (F12) → Console tab

---

## 📄 License

MIT License - Tự do sử dụng và chỉnh sửa

---

**Phát triển bởi Datanla Waterfall Team** 🌊

## Dữ liệu

Tất cả dữ liệu được lưu trong `data.json` và đồng bộ giữa hai giao diện qua API và SSE.

## Checklist demo

- ✅ Tạo đơn mới trên Staff → xuất hiện trên Public
- ✅ Đơn in xong → Staff nhận toast, Public hiển thị Ready với animation
- ✅ Staff đánh dấu Delivered → Public ẩn, Staff chuyển sang Delivered list
- ✅ Reprint trên ERROR → tăng attempts, mô phỏng lại
- ✅ Toggle Paid được persist
- ✅ Hai giao diện hoạt động đồng thời