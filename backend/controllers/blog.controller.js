'use strict';
const db = require('../models');
const { Sequelize, Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

// =======================================================
// ===               CONTROLLERS CHO USER              ===
// =======================================================

/**
 * @route   GET /api/blogs
 * @desc    Lấy danh sách các bài blog (đang hoạt động) có phân trang
 * @access  Public
 */
exports.getAllBlogs = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.max(1, parseInt(req.query.limit, 10) || 9);
        const offset = (page - 1) * limit;

        const { count, rows } = await db.Blog.findAndCountAll({
            where: { IsActive: true },
            attributes: [
                'BlogID', 'Title', 'Author', 'ImageURL', 'CreatedAt',
                // Tạo một đoạn trích ngắn (excerpt) từ nội dung
                [Sequelize.fn('LEFT', Sequelize.col('Content'), 250), 'Excerpt']
            ],
            order: [['CreatedAt', 'DESC']],
            limit,
            offset
        });

        res.json({
            blogs: rows,
            total: count,
            page,
            limit
        });

    } catch (error) {
        console.error("GET /api/blogs error:", error);
        res.status(500).json({ message: "Lỗi khi lấy danh sách bài viết." });
    }
};

/**
 * @route   GET /api/blogs/:id
 * @desc    Lấy chi tiết một bài blog
 * @access  Public
 */
exports.getBlogById = async (req, res) => {
    try {
        const blogId = parseInt(req.params.id, 10);
        if (isNaN(blogId)) {
            return res.status(400).json({ message: 'ID bài viết không hợp lệ.' });
        }

        const blog = await db.Blog.findOne({
            where: {
                BlogID: blogId,
                IsActive: true // Người dùng chỉ có thể xem các bài viết đang hoạt động
            }
        });

        if (!blog) {
            return res.status(404).json({ message: 'Không tìm thấy bài viết.' });
        }

        res.json(blog);

    } catch (error) {
        console.error("GET /api/blogs/:id error:", error);
        res.status(500).json({ message: "Lỗi khi lấy chi tiết bài viết." });
    }
};
// =======================================================
// ===               CONTROLLERS CHO ADMIN               ===
// =======================================================

/**
 * @route   GET /api/admin/blogs
 * @desc    Admin lấy danh sách blog (phân trang, tìm kiếm, lọc)
 * @access  Private (Admin)
 */
exports.getAllBlogsAdmin = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
        const offset = (page - 1) * limit;

        const { keyword, status, date } = req.query; //
        let whereClause = {}; 

        if (keyword) {
            whereClause[Op.or] = [
                { Title: { [Op.like]: `%${keyword}%` } },
                { Author: { [Op.like]: `%${keyword}%` } }
            ];
        }
        if (status && (status === 'true' || status === 'false')) {
            whereClause.IsActive = (status === 'true');
        }

        // === SỬA LỖI: THÊM ĐOẠN CODE NÀY ĐỂ LỌC THEO NGÀY ===
        if (date) {
            // 'date' từ frontend có dạng "YYYY-MM-DD"
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0); // Đặt 00:00:00 của ngày đó

            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999); // Đặt 23:59:59 của ngày đó

            // Lọc các bài đăng có CreatedAt nằm trong khoảng 1 ngày
            whereClause.CreatedAt = {
                [Op.between]: [startDate, endDate]
            };
        }
        // === KẾT THÚC SỬA LỖI ===

        const { count, rows } = await db.Blog.findAndCountAll({
            where: whereClause, // Giờ whereClause đã bao gồm cả điều kiện ngày
            order: [['CreatedAt', 'DESC']],
            limit,
            offset
        });
        
        res.json({
            blogs: rows,
            total: count,
            page,
            limit
        });

    } catch (error) {
        console.error('ADMIN GET BLOGS ERROR:', error);
        res.status(500).json({ errors: [{ msg: 'Lỗi máy chủ' }] });
    }
};

/**
 * @route   GET /api/admin/blogs/:id
 * @desc    Admin lấy chi tiết blog
 * @access  Private (Admin)
 */
exports.getBlogByIdAdmin = async (req, res) => {
    try {
        const blog = await db.Blog.findByPk(req.params.id);
        if (!blog) return res.status(404).json({ errors: [{ msg: 'Không tìm thấy bài viết' }] });
        res.json(blog);
    } catch (error) {
        console.error('ADMIN GET BLOG DETAIL ERROR:', error);
        res.status(500).json({ errors: [{ msg: 'Lỗi máy chủ' }] });
    }
};

/**
 * @route   POST /api/admin/blogs
 * @desc    Admin tạo blog mới
 * @access  Private (Admin)
 */
exports.createBlog = async (req, res) => {
    try {
        const { Title, Content, Author, IsActive } = req.body;
        const ImageURL = req.file ? `/uploads/blogs/${req.file.filename}` : null;

        const newBlog = await db.Blog.create({
            Title, Content, Author, ImageURL,
            IsActive: IsActive === 'true'
        });

        res.status(201).json({ message: 'Thêm bài viết thành công', blog: newBlog });
    } catch (error) {
        console.error('ADMIN ADD BLOG ERROR:', error);
        res.status(500).json({ errors: [{ msg: 'Lỗi máy chủ' }] });
    }
};

/**
 * @route   PUT /api/admin/blogs/:id
 * @desc    Admin cập nhật blog
 * @access  Private (Admin)
 */
exports.updateBlog = async (req, res) => {
    try {
        const blog = await db.Blog.findByPk(req.params.id);
        if (!blog) return res.status(404).json({ errors: [{ msg: 'Không tìm thấy bài viết' }] });

        const { Title, Content, Author, IsActive } = req.body;
        let newImageURL = blog.ImageURL; // Giữ lại ảnh cũ

        if (req.file) {
            newImageURL = `/uploads/blogs/${req.file.filename}`;
            // Xóa ảnh cũ nếu có
            if (blog.ImageURL) {
                const oldImagePath = path.join(__dirname, '../../', blog.ImageURL);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlink(oldImagePath, err => { if (err) console.error("Lỗi xóa ảnh cũ:", err) });
                }
            }
        }
        
        await blog.update({
            Title, Content, Author, 
            ImageURL: newImageURL,
            IsActive: IsActive === 'true'
        });

        res.json({ message: 'Cập nhật bài viết thành công', blog });
    } catch (error) {
        console.error('ADMIN UPDATE BLOG ERROR:', error);
        res.status(500).json({ errors: [{ msg: 'Lỗi máy chủ' }] });
    }
};

/**
 * @route   DELETE /api/admin/blogs/:id
 * @desc    Admin xóa blog
 * @access  Private (Admin)
 */
exports.deleteBlog = async (req, res) => {
    try {
        const blog = await db.Blog.findByPk(req.params.id);
        if (!blog) return res.status(404).json({ errors: [{ msg: 'Không tìm thấy bài viết' }] });

        // Xóa ảnh liên quan trước khi xóa record
        if (blog.ImageURL) {
            const imagePath = path.join(__dirname, '../../', blog.ImageURL);
            if (fs.existsSync(imagePath)) {
                fs.unlink(imagePath, err => { if (err) console.error("Lỗi xóa ảnh:", err) });
            }
        }

        await blog.destroy();
        res.json({ message: 'Xóa bài viết thành công' });
    } catch (error) {
        console.error('ADMIN DELETE BLOG ERROR:', error);
        res.status(500).json({ errors: [{ msg: 'Lỗi máy chủ' }] });
    }
};