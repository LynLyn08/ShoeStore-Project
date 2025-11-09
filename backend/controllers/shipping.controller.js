'use strict';
const db = require('../models');

/**
 * @route   GET /api/shipping/providers
 * @desc    Lấy danh sách các nhà cung cấp vận chuyển đang hoạt động
 * @access  Public
 */
exports.getProviders = async (req, res) => {
    try {
        const providers = await db.ShippingProvider.findAll({
            where: { IsActive: true },
            attributes: ['ProviderID', 'Code', 'Name', 'Fee'], // Chỉ lấy các trường cần thiết
            order: [['Name', 'ASC']]
        });
        res.json(providers);
    } catch (error) {
        console.error("GET /shipping/providers error:", error);
        res.status(500).json({ message: "Lỗi khi lấy danh sách nhà vận chuyển." });
    }
};