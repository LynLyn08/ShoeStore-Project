// backend/services/email.service.js (ĐÃ KHÔI PHỤC)
'use strict';
const nodemailer = require('nodemailer');

// Cấu hình transporter một lần và tái sử dụng
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    },
});

/**
 * Gửi email chứa mã OTP để reset mật khẩu.
 * @param {string} to - Địa chỉ email người nhận.
 * @param {string} otp - Mã OTP cần gửi.
 */
exports.sendOtpEmail = async (to, otp) => {
    try {
        const resetLink = `http://localhost:3000/reset-password?email=${encodeURIComponent(to)}`;

        await transporter.sendMail({
            from: `"Shoe Store" <${process.env.GMAIL_USER}>`,
            to: to,
            subject: "Mã đặt lại mật khẩu",
            html: `
                <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; line-height: 1.6;">
                    <h2>Yêu cầu đặt lại mật khẩu</h2>
                    <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
                    <p>Mã OTP của bạn là:</p>
                    <p style="font-size: 24px; font-weight: bold; letter-spacing: 5px; background-color: #f0f0f0; padding: 10px 20px; display: inline-block; border-radius: 5px;">
                        ${otp}
                    </p>
                    <p>Mã này sẽ có hiệu lực trong <strong>10 phút</strong>.</p>
                    <p>Hoặc, bạn có thể nhấp vào nút bên dưới để đến thẳng trang đặt lại mật khẩu:</p>
                    <a href="${resetLink}" target="_blank" style="display: inline-block; padding: 12px 24px; margin: 15px 0; font-size: 16px; font-weight: bold; color: #ffffff; background-color: #c71857; text-decoration: none; border-radius: 5px;">
                        Đặt lại mật khẩu
                    </a>
                    <p style="font-size: 12px; color: #888;">Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
                </div>
            `,
        });
        console.log(`OTP email sent successfully to ${to}`);
    } catch (error) {
        console.error(`Error sending OTP email to ${to}:`, error);
        throw new Error('Không thể gửi email OTP.');
    }
};

/**
 * Gửi email thông báo khi mật khẩu được admin reset.
 * @param {string} to - Email người nhận.
 * @param {string} username - Tên người dùng.
 * @param {string} newPassword - Mật khẩu mới (dạng plain text).
 */
exports.sendPasswordResetByAdminEmail = async (to, username, newPassword) => {
    try {
        await transporter.sendMail({
            from: `"Shoe Store" <${process.env.GMAIL_USER}>`,
            to: to,
            subject: 'Thông báo: Mật khẩu của bạn đã được đặt lại',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h3>Chào ${username},</h3>
                    <p>Mật khẩu tài khoản của bạn tại Shoe Store đã được quản trị viên đặt lại.</p>
                    <p>Mật khẩu mới của bạn là: <strong style="font-size: 16px;">${newPassword}</strong></p>
                    <p>Vui lòng đăng nhập và thay đổi mật khẩu ngay lập tức để bảo vệ tài khoản của bạn.</p>
                    <br>
                    <p>Trân trọng,<br>Đội ngũ hỗ trợ Shoe Store</p>
                </div>
            `,
        });
        console.log(`Admin password reset email sent successfully to ${to}`);
    } catch (error) {
        console.error(`Error sending admin reset email to ${to}:`, error);
        throw new Error('Không thể gửi email thông báo reset mật khẩu.');
    }
};

/**
 * Gửi email thông báo về mã coupon mới hoặc được cập nhật.
 * @param {string | string[]} to - Email người nhận (một hoặc nhiều).
 * @param {object} coupon - Đối tượng coupon { Code, DiscountType, DiscountValue, ExpiryDate }.
 * @param {string} subject - Tiêu đề email.
 */
/**
 * Gửi email thông báo về mã coupon mới hoặc được cập nhật.
 * @param {string | string[]} to - Email người nhận (một hoặc nhiều).
 * @param {object} coupon - Đối tượng coupon { Code, DiscountType, DiscountValue, ExpiryDate }.
 * @param {string} subject - Tiêu đề email.
 */
exports.sendCouponEmail = async (to, coupon, subject = 'Mã khuyến mãi từ Shoe Store') => {
    try {
        let discountDisplay = '';
        const discountValue = Number(coupon.DiscountValue); // Đảm bảo là số

        if (coupon.DiscountType === 'Percent') {
            discountDisplay = `${discountValue}%`;
        } else if (coupon.DiscountType === 'FixedAmount') {
            // Sửa lỗi: Đảm bảo sử dụng toLocaleString() trên biến đã được kiểm tra (discountValue)
            discountDisplay = `${discountValue.toLocaleString('vi-VN')}₫`; 
        } else {
             discountDisplay = 'một mức giảm giá hấp dẫn';
        }

        const mailOptions = {
            from: `"Shoe Store" <${process.env.GMAIL_USER}>`,
            to: Array.isArray(to) ? to.join(', ') : to,
            subject: subject,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h3>Chào bạn,</h3>
                    <p>Bạn có một mã khuyến mãi mới từ Shoe Store:</p>
                    <ul style="list-style: none; padding: 0;">
                        <li><strong>Mã:</strong> <span style="color: #d9534f; font-weight: bold;">${coupon.Code}</span></li>
                        <li><strong>Giảm giá:</strong> ${discountDisplay}</li> 
                        <li><strong>Hết hạn:</strong> ${new Date(coupon.ExpiryDate).toLocaleDateString('vi-VN')}</li>
                    </ul>
                    <p>Vui lòng sử dụng trong thời gian hiệu lực!</p>
                    <p>Trân trọng,<br>Shoe Store</p>
                </div>
            `,
        };
        await transporter.sendMail(mailOptions);
        console.log(`Coupon email sent successfully to ${to}`); 
    } catch (error) {
        // Nếu có lỗi, chúng ta in log chi tiết
        console.error(`Error sending coupon email to ${to}:`, error);
        throw new Error('Không thể gửi email coupon.');
    }
};
// KHÔNG CÓ HÀM sendCouponToCustomers NÀO Ở ĐÂY