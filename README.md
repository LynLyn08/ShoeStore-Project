# HỆ THỐNG WEBSITE BÁN GIÀY
Thành viên: Phạm Thị Thùy Linh - 22810310291
            Võ Thị Kim Liên- 22810310261
            Nguyễn Thị Hoài Sương - 22810310254

---

## 1. Giới thiệu
Dự án xây dựng website thương mại điện tử bán giày (Shoe Store) với đầy đủ chức năng cho người dùng (Khách, User) và người quản trị (Admin). Hệ thống sử dụng mô hình client-server với ReactJS cho Frontend và Node.js (Express) cho Backend, kết nối với CSDL SQL Server.

## 2. Công nghệ sử dụng

* **Backend:**
    * Ngôn ngữ: **JavaScript (Node.js)**
    * Framework: **Express.js**
    * ORM: **Sequelize**
    * Xác thực: **JSON Web Token (JWT)**
    * Database: **SQL Server**
    * Chức năng khác: **Nodemailer** (Gửi email), **Multer** (Upload ảnh), **VNPay** (Thanh toán).

* **Frontend:**
    * Thư viện: **React.js**
    * Quản lý State: **Redux Toolkit** (Slices)
    * UI: **React Bootstrap**
    * Gọi API: **Axios**

## 3. Cấu trúc thư mục

Dự án được chia làm 2 thư mục chính: `/frontend` và `/backend` .

* `/backend`
    * `/controllers`: Xử lý logic nghiệp vụ (request/response).
    * `/models`: Định nghĩa các models (schema) của Sequelize.
    * `/routes`: Định nghĩa các API endpoints (RESTful).
    * `/middleware`: Các hàm trung gian (xác thực token, check admin, cart owner).
    * `/services`: Xử lý các logic phức tạp (gửi mail, xử lý giao dịch).
* `/frontend`
    * `/src/components`: Các component React tái sử dụng (vd: `Checkout.js`).
    * `/src/pages`: Các component React tương ứng với một trang (vd: `Cart.js`, `Profile.js`, `AdminOrders.js`).
    * `/src/redux`: Quản lý state toàn cục (Redux Slices).
    * `/src/api`: Các hàm (axios) để gọi API từ backend.

## 4. Hướng dẫn cài đặt & chạy chương trình

### Yêu cầu môi trường
* Node.js (v18.0.0 trở lên)
* NPM hoặc Yarn
* SQL Server (2019 trở lên) và SQL Server Management Studio (SSMS).

### 4.1. Cài đặt Backend
1.  **Import Database:**
 * Cách1:
    * Mở SSMS, tạo một database mới (ví dụ: `ShoeStoreDB`).
    * Mở file `.sql` bạn vừa xuất (ví dụ: `MaSV_TenDeTai_DB.sql`).
    * Kéo thả file vào SSMS hoặc copy/paste nội dung.
    * Đảm bảo bạn đang chọn đúng Database `ShoeStoreDB` vừa tạo.
    * Bấm **Execute** để chạy script và tạo dữ liệu.
 * Cách 2
    * Tạo Database trong sql server và use database đó
    * chạy các lệnh sau trong terminal vị trí thư mục backend
       * npx sequelize-cli db:migrate
       * npx sequelize-cli db:seed:all

2.  **Cấu hình kết nối:**
    * Di chuyển vào thư mục `/backend`.
    * Tạo file `.env`.
    * Copy các khóa sau và điền thông tin CSDL của bạn:
        ```
        # Database (SQL Server)
        DB_USER=[Tên user SQL của bạn, vd: sa]
        DB_PASSWORD=[Mật khẩu SQL]
        DB_HOST=[vd: localhost]
        DB_NAME=ShoeStoreDB
        
        # JWT
        JWT_SECRET=your_jwt_secret_key_123
        
        # URL (cho ảnh và email)
        BASE_URL=http://localhost:5000
        
        # GMAIL (cho service gửi mail)
        GMAIL_USER=[Email của bạn, vd: myapp@gmail.com]
        GMAIL_PASS=[Mật khẩu ứng dụng Gmail]
        
        # VNPAY
        VNPAY_RETURN_URL=http://localhost:3000/order-success
        VNPAY_TMN_CODE=[Mã VNPAY của bạn]
        VNPAY_HASH_SECRET=[Chuỗi bí mật VNPAY]
        ```

3.  **Chạy Backend:**
    ```bash
    # Đi vào thư mục backend
    cd backend
    
    # Cài đặt thư viện
    npm install
    
    # Khởi động server (server chạy ở cổng 5000)
    # Lưu ý: Cần cài đặt nodemon toàn cục (npm install -g nodemon) nếu chưa có
     câu lệnh: nodemon server.js

### 4.2. Cài đặt Frontend
1.  **Cấu hình (nếu cần):**
    * Frontend sẽ gọi API ở `http://localhost:5000` (đã được cấu hình trong `frontend/src/api` hoặc `package.json`).

2.  **Chạy Frontend:**
    ```bash
    # Mở một terminal mới, đi vào thư mục frontend
    cd frontend
    
    # Cài đặt thư viện
    npm install
    
    # Khởi động React (app chạy ở cổng 3000)
    npm start
    ```

## 5. Tài khoản Demo

* **Vai trò Admin:**
    * **Email:** `admin@example.com`
    * **Username:** `admin`
    * **Password:** `Linh2308@`

* **Vai trò User (Khách hàng):**
    * **Email:** `user1@example.com`
    * **Username:** `user1`
    * **Password:** `User123456`
* (Lưu ý: Bạn hãy tự tạo các tài khoản này trong CSDL nếu script SQL chưa có)

## 6. Hình ảnh minh họa

### Chức năng User (Khách hàng)

**Trang chủ User**
![Trang chủ User](./imagesdemo/trangchuUser.jpeg)

**Trang Sản phẩm (Danh sách)**
![Trang Sản phẩm](./imagesdemo/trangsanpham.jpeg)

**Trang Chi tiết Sản phẩm**
![Trang Chi tiết Sản phẩm](./imagesdemo/trangchitiet.jpeg)

**Trang Giỏ hàng**
![Trang Giỏ hàng](./imagesdemo/tranggiohang.jpeg)

**Trang Thanh toán**
![Trang Thanh toán](./imagesdemo/trangthanhtoan.jpeg)

**Trang Profile (Đơn hàng)**
![Trang Profile Đơn hàng](./imagesdemo/trangprofileorder.jpeg)

**Trang Profile (Ví Voucher)**
![Trang Profile Ví Voucher](./imagesdemo/trangprofilevoucher.jpeg)

---
### Chức năng Admin (Quản trị)

**Trang chủ Admin (Dashboard)**
![Trang chủ Admin](./imagesdemo/trangchuAdmin.jpeg)

**Quản lý Danh mục**
![Quản lý Danh mục](./imagesdemo/quanlydanhmuc.jpeg)

**Quản lý Đơn hàng**
![Quản lý Đơn hàng](./imagesdemo/quanlydonhang.jpeg)

**Quản lý Khuyến mãi (Voucher)**
![Quản lý Khuyến mãi](./imagesdemo/quanlykhyenmai.jpeg)

**Quản lý Người dùng**
![Quản lý Người dùng](./imagesdemo/quanlynguoidung.jpeg)

**Quản lý Phương thức Thanh toán**
![Quản lý Phương thức Thanh toán](./imagesdemo/quanlyphuongthuctt.jpeg)

**Quản lý Sản phẩm**
![Quản lý Sản phẩm](./imagesdemo/quanlysanpham.jpeg)

