'use strict';
const db = require('../models');

/**
 * @route   GET /api/addresses
 * @desc    Lấy tất cả địa chỉ của người dùng đã đăng nhập
 * @access  Private
 */
exports.getAllAddresses = async (req, res) => {
    const userId = req.user.id; // Lấy từ middleware
    try {
        const addresses = await db.Address.findAll({
            where: { UserID: userId },
            order: [['IsDefault', 'DESC'], ['AddressID', 'DESC']]
        });
        res.json({ success: true, data: addresses });
    } catch (error) {
        console.error("GET /addresses error:", error);
        res.status(500).json({ success: false, message: "Không thể tải danh sách địa chỉ." });
    }
};

/**
 * @route   POST /api/addresses
 * @desc    Tạo địa chỉ mới
 * @access  Private
 */
exports.createAddress = async (req, res) => {
    const userId = req.user.id;
    // SỬA: Dùng req.body trực tiếp với uppercase (match frontend)
    const { FullName, Phone, Email, Street, City, State, Country, Note, IsDefault } = req.body;

    const transaction = await db.sequelize.transaction();
    try {
        // THÊM: Validate required fields để tránh record rỗng
        if (!FullName || !Phone || !Street || !City) {
            await transaction.rollback();
            return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc: Họ tên, SĐT, Địa chỉ, Thành phố." });
        }

        // Nếu người dùng muốn set làm mặc định, hoặc đây là địa chỉ đầu tiên
        const addressCount = await db.Address.count({ where: { UserID: userId }, transaction });
        const shouldBeDefault = addressCount === 0 || IsDefault === true;
        
        if (shouldBeDefault) {
            // Gỡ mặc định của tất cả các địa chỉ khác
            await db.Address.update(
                { IsDefault: false },
                { where: { UserID: userId, IsDefault: true }, transaction }
            );
        }

        const newAddress = await db.Address.create({
            UserID: userId,
            FullName,
            Phone,
            Email,
            Street,
            City,
            State,
            Country,
            Note,
            IsDefault: shouldBeDefault
        }, { transaction });
        
        await transaction.commit();
        res.status(201).json({ success: true, id: newAddress.AddressID, data: newAddress });

    } catch (error) {
        await transaction.rollback();
        console.error("POST /addresses error:", error);
        res.status(500).json({ success: false, message: error.message || "Không thể tạo địa chỉ mới." });
    }
};

/**
 * @route   PATCH /api/addresses/:id
 * @desc    Cập nhật một địa chỉ
 * @access  Private
 */
exports.updateAddress = async (req, res) => {
    const userId = req.user.id;
    const addressId = parseInt(req.params.id, 10);

    const transaction = await db.sequelize.transaction();
    try {
        const address = await db.Address.findOne({
            where: { AddressID: addressId, UserID: userId },
            transaction
        });

        if (!address) {
            await transaction.rollback();
            return res.status(404).json({ success: false, message: "Không tìm thấy địa chỉ." });
        }
        
        // SỬA: Dùng req.body với uppercase cho update
        const updateData = {
            FullName: req.body.FullName,
            Phone: req.body.Phone,
            Email: req.body.Email,
            Street: req.body.Street,
            City: req.body.City,
            State: req.body.State,
            Country: req.body.Country,
            Note: req.body.Note,
            // IsDefault xử lý riêng dưới
        };
        
        // Cập nhật các trường thông thường
        await address.update(updateData, { transaction });
        
        // Xử lý riêng logic 'IsDefault' nếu được cung cấp
        if (req.body.IsDefault === true) {
            await db.Address.update(
                { IsDefault: false },
                { where: { UserID: userId, IsDefault: true }, transaction }
            );
            await address.update({ IsDefault: true }, { transaction });
        }
        
        await transaction.commit();
        res.json({ success: true, data: address });
    } catch (error) {
        await transaction.rollback();
        console.error("PATCH /addresses/:id error:", error);
        res.status(500).json({ success: false, message: "Không thể cập nhật địa chỉ." });
    }
};

/**
 * @route   DELETE /api/addresses/:id
 * @desc    Xóa một địa chỉ
 * @access  Private
 */
exports.deleteAddress = async (req, res) => {
    const userId = req.user.id;
    const addressId = parseInt(req.params.id, 10);

    const transaction = await db.sequelize.transaction();
    try {
        const addressToDelete = await db.Address.findOne({
            where: { AddressID: addressId, UserID: userId },
            transaction
        });

        if (!addressToDelete) {
            await transaction.rollback();
            return res.status(404).json({ success: false, message: "Không tìm thấy địa chỉ." });
        }
        
        const wasDefault = addressToDelete.IsDefault;
        await addressToDelete.destroy({ transaction });

        // Nếu địa chỉ vừa xóa là mặc định, cần set một địa chỉ khác làm mặc định
        if (wasDefault) {
            const nextAddress = await db.Address.findOne({
                where: { UserID: userId },
                order: [['AddressID', 'DESC']], // Lấy cái mới nhất còn lại
                transaction
            });
            if (nextAddress) {
                await nextAddress.update({ IsDefault: true }, { transaction });
            }
        }
        
        await transaction.commit();
        res.json({ success: true, message: "Đã xóa địa chỉ." });
    } catch (error) {
        await transaction.rollback();
        console.error("DELETE /addresses/:id error:", error);
        res.status(500).json({ success: false, message: "Không thể xóa địa chỉ." });
    }
};

/**
 * @route   PATCH /api/addresses/:id/default
 * @desc    Đặt một địa chỉ làm mặc định
 * @access  Private
 */
exports.setDefaultAddress = async (req, res) => {
    const userId = req.user.id;
    const addressId = parseInt(req.params.id, 10);

    const transaction = await db.sequelize.transaction();
    try {
        const address = await db.Address.findOne({
            where: { AddressID: addressId, UserID: userId },
            transaction
        });
        
        if (!address) {
            await transaction.rollback();
            return res.status(404).json({ success: false, message: "Không tìm thấy địa chỉ." });
        }
        
        // Gỡ mặc định cũ
        await db.Address.update(
            { IsDefault: false },
            { where: { UserID: userId, IsDefault: true }, transaction }
        );

        // Set mặc định mới
        await address.update({ IsDefault: true }, { transaction });

        await transaction.commit();
        res.json({ success: true, message: "Đã đặt địa chỉ làm mặc định." });

    } catch (error) {
        await transaction.rollback();
        console.error("PATCH /addresses/:id/default error:", error);
        res.status(500).json({ success: false, message: "Không thể đặt làm mặc định." });
    }
};