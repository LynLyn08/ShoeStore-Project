'use strict';
const db = require('../models');
const { Sequelize } = require('sequelize');

/**
 * @route   GET /api/home
 * @desc    Lấy dữ liệu cho trang chủ (sản phẩm mới, blog mới)
 * @access  Public
 */
exports.getHomePageData = async (req, res) => {
    try {
        // Sử dụng Sequelize.literal để tái tạo logic lấy ảnh phức tạp từ SQL gốc
        const defaultImageSubquery = `(
            COALESCE(
                (SELECT TOP 1 pi.ImageURL FROM ProductImages pi WHERE pi.ProductID = Product.ProductID AND pi.IsDefault = 1 AND pi.VariantID IS NOT NULL ORDER BY pi.ImageID),
                (SELECT TOP 1 pi2.ImageURL FROM ProductImages pi2 WHERE pi2.ProductID = Product.ProductID AND pi2.IsDefault = 1 ORDER BY pi2.ImageID),
                (SELECT TOP 1 pi3.ImageURL FROM ProductImages pi3 WHERE pi3.ProductID = Product.ProductID ORDER BY pi3.IsDefault DESC, pi3.ImageID),
                '/images/placeholder-product.jpg'
            )
        )`;

        // Promise để lấy 8 sản phẩm mới nhất
        const productsPromise = db.Product.findAll({
            limit: 8,
            order: [['CreatedAt', 'DESC']],
            attributes: [
                'ProductID', 'Name', 'Price', 'DiscountPercent', 'DiscountedPrice',
                [Sequelize.literal(defaultImageSubquery), 'DefaultImage']
            ],
            include: [{
                model: db.Category,
                as: 'category',
                attributes: [['Name', 'CategoryName']]
            }]
        });

        // Promise để lấy 3 bài blog mới nhất
        const blogsPromise = db.Blog.findAll({
            where: { IsActive: true },
            limit: 3,
            order: [['CreatedAt', 'DESC']],
            attributes: [
                'BlogID', 'Title', 'ImageURL', 'CreatedAt',
                // Tạo Excerpt (đoạn trích) bằng hàm của Sequelize
                [Sequelize.fn('LEFT', Sequelize.col('Content'), 400), 'Excerpt']
            ]
        });

        // Chạy cả hai promise song song để tăng hiệu suất
        const [products, blogs] = await Promise.all([productsPromise, blogsPromise]);

        res.json({ products, blogs });

    } catch (error) {
        console.error('GET /api/home error:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy dữ liệu trang chủ' });
    }
};