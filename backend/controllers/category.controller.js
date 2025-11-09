'use strict';
const db = require('../models');
const { Op } = require('sequelize');

/**
 * @route   GET /api/admin/categories
 * @desc    Admin lấy danh sách danh mục (có phân trang, tìm kiếm, lọc)
 * @access  Private (Admin)
 */
exports.getAllCategories = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page || '1', 10));
        const limit = Math.max(1, parseInt(req.query.limit || '10', 10));
        const offset = (page - 1) * limit;
        
        // SỬA: Thêm targetGroup
        const { keyword, targetGroup } = req.query;

        const whereClause = {};
        if (keyword) {
            whereClause[Op.or] = [
                { Name: { [Op.like]: `%${keyword}%` } },
                { Description: { [Op.like]: `%${keyword}%` } }
            ];
        }
        
        // SỬA: Thêm logic lọc theo targetGroup
        if (targetGroup) {
            whereClause.TargetGroup = targetGroup;
        }

        const { count, rows } = await db.Category.findAndCountAll({
            where: whereClause,
            limit,
            offset,
            order: [['CreatedAt', 'DESC']]
        });

        res.json({ categories: rows, total: count, page, limit });
    } catch (error) {
        console.error('ADMIN CATEGORIES LIST ERROR:', error);
        res.status(500).json({ errors: [{ msg: 'Lỗi máy chủ' }] });
    }
};

/**
 * @route   GET /api/admin/categories/:id
 * @desc    Admin lấy chi tiết một danh mục
 * @access  Private (Admin)
 */
exports.getCategoryById = async (req, res) => {
    try {
        const category = await db.Category.findByPk(req.params.id);
        if (!category) {
            return res.status(404).json({ errors: [{ msg: 'Không tìm thấy danh mục' }] });
        }
        res.json(category);
    } catch (error) {
        console.error('ADMIN CATEGORY DETAIL ERROR:', error);
        res.status(500).json({ errors: [{ msg: 'Lỗi máy chủ' }] });
    }
};

/**
 * @route   POST /api/admin/categories
 * @desc    Admin tạo danh mục mới
 * @access  Private (Admin)
 */
exports.createCategory = async (req, res) => {
    const { Name, TargetGroup, Description } = req.body;
    try {
        const existingCategory = await db.Category.findOne({ where: { Name } });
        if (existingCategory) {
            return res.status(409).json({ errors: [{ msg: 'Tên danh mục đã tồn tại' }] });
        }
        const newCategory = await db.Category.create({ Name, TargetGroup, Description });
        res.status(201).json({ message: 'Thêm danh mục thành công', category: newCategory });
    } catch (error) {
        console.error('ADMIN ADD CATEGORY ERROR:', error);
        res.status(500).json({ errors: [{ msg: 'Lỗi khi thêm danh mục' }] });
    }
};

/**
 * @route   PUT /api/admin/categories/:id
 * @desc    Admin cập nhật danh mục
 * @access  Private (Admin)
 */
exports.updateCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const { Name } = req.body;

        const category = await db.Category.findByPk(categoryId);
        if (!category) {
            return res.status(404).json({ errors: [{ msg: 'Không tìm thấy danh mục' }] });
        }

        if (Name && Name !== category.Name) {
            const existingCategory = await db.Category.findOne({ 
                where: { 
                    Name, 
                    CategoryID: { [Op.ne]: categoryId }
                } 
            });
            if (existingCategory) {
                return res.status(409).json({ errors: [{ msg: 'Tên danh mục đã tồn tại' }] });
            }
        }

        await category.update(req.body);
        res.json({ message: 'Cập nhật danh mục thành công', category });
    } catch (error) {
        console.error('ADMIN UPDATE CATEGORY ERROR:', error);
        res.status(500).json({ errors: [{ msg: 'Lỗi máy chủ' }] });
    }
};

/**
 * @route   DELETE /api/admin/categories/:id
 * @desc    Admin xóa danh mục
 * @access  Private (Admin)
 */
exports.deleteCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const productCount = await db.Product.count({ where: { CategoryID: categoryId } });

        if (productCount > 0) {
            return res.status(400).json({ errors: [{ msg: 'Không thể xóa danh mục vì còn sản phẩm liên quan' }] });
        }

        const deletedRows = await db.Category.destroy({ where: { CategoryID: categoryId } });
        if (deletedRows === 0) {
            return res.status(404).json({ errors: [{ msg: 'Không tìm thấy danh mục để xóa' }] });
        }
        res.json({ message: 'Xóa danh mục thành công' });
    } catch (error) {
        console.error('ADMIN DELETE CATEGORY ERROR:', error);
        res.status(500).json({ errors: [{ msg: 'Lỗi máy chủ' }] });
    }
};

/**
 * @route   GET /api/admin/products/categories
 * @desc    Lấy danh sách các danh mục đang hoạt động (dùng cho form sản phẩm)
 * @access  Private (Admin)
 */
exports.getActiveCategories = async (req, res) => {
    try {
        const categories = await db.Category.findAll({
            where: { IsActive: true },
            order: [['Name', 'ASC']]
        });
        res.json({ categories });
    } catch (error) {
        console.error('ADMIN GET ACTIVE CATEGORIES ERROR:', error);
        res.status(500).json({ errors: [{ msg: 'Lỗi máy chủ' }] });
    }
};