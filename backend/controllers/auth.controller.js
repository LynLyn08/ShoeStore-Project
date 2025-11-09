'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models'); // Nạp Sequelize và tất cả các model
const { Op } = require('sequelize');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

/**
 * @route   POST /api/auth/register
 * @desc    Đăng ký người dùng mới
 * @access  Public
 */
exports.register = async (req, res) => {
  // Dữ liệu đã được validate bởi middleware, chỉ cần lấy ra sử dụng
  const { Username, Email, Password, FullName, Phone, Address } = req.body;

  try {
    // 1. Kiểm tra Username hoặc Email đã tồn tại chưa bằng Sequelize
    const existingUser = await db.User.findOne({
      where: {
        [Op.or]: [{ Email: Email }, { Username: Username }]
      }
    });

    if (existingUser) {
      if (existingUser.Email === Email) {
        return res.status(409).json({ errors: [{ msg: 'Email đã tồn tại.', field: 'Email' }] });
      }
      if (existingUser.Username === Username) {
        return res.status(409).json({ errors: [{ msg: 'Username đã tồn tại.', field: 'Username' }] });
      }
    }

    // 2. Băm mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(Password, salt);

    // 3. Tạo người dùng mới bằng Sequelize
    await db.User.create({
      Username,
      Email,
      Password: hashedPassword,
      FullName,
      Phone,
      Address,
      Role: 'user' // Mặc định role là user
    });

    res.status(201).json({ message: 'Đăng ký thành công. Vui lòng đăng nhập.' });

  } catch (error) {
    console.error('REGISTER ERROR:', error);
    res.status(500).json({ errors: [{ msg: 'Lỗi máy chủ, vui lòng thử lại sau.' }] });
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Đăng nhập và trả về JWT
 * @access  Public
 */
exports.login = async (req, res) => {
  const { identifier, password, remember } = req.body;

  try {
    // 1. Tìm người dùng bằng Username hoặc Email
    const user = await db.User.findOne({
      where: {
        [Op.or]: [{ Email: identifier }, { Username: identifier }]
      }
    });

    if (!user) {
      return res.status(401).json({ errors: [{ msg: 'Tài khoản hoặc mật khẩu không chính xác.' }] });
    }

    // 2. So khớp mật khẩu
    const isMatch = await bcrypt.compare(password, user.Password);

    if (!isMatch) {
      return res.status(401).json({ errors: [{ msg: 'Tài khoản hoặc mật khẩu không chính xác.' }] });
    }

    // 3. Tạo JWT Payload
    const payload = {
      id: user.UserID,
      role: user.Role,
      username: user.Username,
      email: user.Email,
      avatar: user.AvatarURL
    };

    // 4. Ký và gửi Token
    const expiresIn = remember ? '30d' : '2h';
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn });

    res.json({
      token,
      role: user.Role,
      expiresIn,
      user: {
        id: user.UserID,
        username: user.Username,
        email: user.Email,
        fullName: user.FullName,
        avatar: user.AvatarURL,
      }
    });

  } catch (error) {
    console.error('LOGIN ERROR:', error);
    res.status(500).json({ errors: [{ msg: 'Lỗi máy chủ, vui lòng thử lại sau.' }] });
  }
};

/**
 * @route   POST /api/admin/auth/change-password
 * @desc    Người dùng (admin hoặc user) tự thay đổi mật khẩu của mình
 * @access  Private
 */
exports.changePassword = async (req, res) => {
    try {
        // req.user được cung cấp bởi middleware xác thực (authenticateToken hoặc express-jwt)
        const userId = req.user.id;
        const { oldPassword, newPassword } = req.body;

        const user = await db.User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "Không tìm thấy tài khoản." });
        }

        // Kiểm tra mật khẩu cũ
        const isMatch = await bcrypt.compare(oldPassword, user.Password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Mật khẩu cũ không chính xác." });
        }

        // Hash và cập nhật mật khẩu mới
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.Password = hashedPassword;
        await user.save();

        res.json({ success: true, message: "Đổi mật khẩu thành công!" });

    } catch (error) {
        console.error("Change password error:", error);
        res.status(500).json({ success: false, message: "Lỗi máy chủ." });
    }
};