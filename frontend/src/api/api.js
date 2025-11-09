// src/api/api.js
import axios from 'axios';

// 1. Tạo instance với cấu hình cơ bản
const api = axios.create({
    // Ưu tiên lấy URL từ biến môi trường, nếu không có thì dùng localhost
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// 2. REQUEST INTERCEPTOR: Tự động gắn token vào header
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 3. RESPONSE INTERCEPTOR: Xử lý lỗi toàn cục (ví dụ: 401 Unauthorized)
api.interceptors.response.use(
    (response) => {
        // Nếu response thành công, trả về nguyên vẹn
        return response;
    },
    (error) => {
        // Nếu nhận lỗi 401 (Unauthorized) từ backend -> Token hết hạn hoặc không hợp lệ
        if (error.response && error.response.status === 401) {
            // Chỉ redirect nếu không phải đang ở trang login (tránh vòng lặp vô tận nếu chính trang login gây ra lỗi 401)
            if (!window.location.pathname.startsWith('/login')) {
                console.warn('Phiên đăng nhập hết hạn. Đang chuyển hướng về trang đăng nhập...');
                // Xóa token cũ
                localStorage.removeItem('token');
                // Chuyển hướng về trang login
                window.location.href = '/login';
            }
        }
        // Trả lỗi về để component gọi API có thể xử lý tiếp (ví dụ: hiện thông báo lỗi cụ thể)
        return Promise.reject(error);
    }
);

export default api;