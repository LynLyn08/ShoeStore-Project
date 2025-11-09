'use strict';
const db = require('../models');
const { Sequelize } = require('sequelize');

/**
 * @desc    Lấy danh sách ID sản phẩm yêu thích của user. Dùng để đồng bộ trạng thái nhanh.
 * @route   GET /api/wishlist
 * @access  Optional
 */
exports.getWishlistIds = async (req, res) => {
    if (!req.user?.id) {
        return res.json({ productIds: [] });
    }
    try {
        const wishlistItems = await db.Wishlist.findAll({
            where: { UserID: req.user.id },
            attributes: ['ProductID']
        });
        const productIds = wishlistItems.map(item => item.ProductID);
        res.json({ productIds });
    } catch (error) {
        console.error('WISHLIST GET IDS ERROR:', error);
        res.status(500).json({ message: 'Lỗi lấy danh sách yêu thích.' });
    }
};

/**
 * @desc    Lấy danh sách sản phẩm yêu thích (đầy đủ thông tin, phân trang). Dùng cho trang Profile.
 * @route   GET /api/profile/wishlist
 * @access  Private
 */
exports.getPaginatedWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize, 10) || 8));
        const offset = (page - 1) * pageSize;

        const defaultImageSubquery = `(
            SELECT TOP 1 i.ImageURL FROM ProductImages i WHERE i.ProductID = product.ProductID ORDER BY i.IsDefault DESC, i.ImageID
        )`;

        const { count, rows } = await db.Wishlist.findAndCountAll({
            where: { UserID: userId },
            include: [{
                model: db.Product,
                as: 'product',
                attributes: [
                    'ProductID', 'Name', 'Price', 'DiscountPercent', 'DiscountedPrice',
                    [Sequelize.literal(defaultImageSubquery), 'DefaultImage']
                ],
            }],
            limit: pageSize,
            offset,
            order: [['CreatedAt', 'DESC']],
        });

        res.json({ items: rows, total: count, page, pageSize });

    } catch (error) {
        console.error('WISHLIST GET PAGINATED ERROR:', error);
        res.status(500).json({ message: 'Lỗi khi tải danh sách yêu thích.' });
    }
};

/**
 * @desc    Kiểm tra một sản phẩm có trong danh sách yêu thích không.
 * @route   GET /api/wishlist/check/:productId
 * @access  Optional
 */
exports.checkWishlistStatus = async (req, res) => {
    if (!req.user?.id) {
        return res.json({ liked: false });
    }
    try {
        const productId = parseInt(req.params.productId, 10);
        const count = await db.Wishlist.count({
            where: { UserID: req.user.id, ProductID: productId }
        });
        res.json({ liked: count > 0 });
    } catch (error) {
        console.error('WISHLIST CHECK ERROR:', error);
        res.status(500).json({ message: 'Lỗi kiểm tra yêu thích.' });
    }
};

/**
 * @desc    Thêm/xóa một sản phẩm khỏi danh sách yêu thích.
 * @route   POST /api/wishlist/toggle
 * @access  Private
 */
exports.toggleWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.body;

        const [item, created] = await db.Wishlist.findOrCreate({
            where: { UserID: userId, ProductID: productId },
            defaults: { UserID: userId, ProductID: productId }
        });

        if (created) {
            // Vừa được tạo -> thêm thành công
            return res.json({ liked: true, message: 'Đã thêm vào danh sách yêu thích.' });
        } else {
            // Đã tồn tại -> xóa nó đi
            await item.destroy();
            return res.json({ liked: false, message: 'Đã xóa khỏi danh sách yêu thích.' });
        }
    } catch (error) {
        console.error('WISHLIST TOGGLE ERROR:', error);
        res.status(500).json({ message: 'Lỗi khi thay đổi danh sách yêu thích.' });
    }
};