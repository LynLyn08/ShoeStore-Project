'use strict';
const db = require('../models');
const { Op } = require('sequelize');

// ... (keep getActivePaymentMethods)
exports.getActivePaymentMethods = async (req, res) => {
    try {
        const methods = await db.PaymentMethod.findAll({
            where: { IsActive: true },
            order: [['MethodID', 'ASC']]
        });
        res.json(methods);
    } catch (error) {
        console.error('USER PAYMENT METHODS LIST ERROR:', error);
        res.status(500).json({ errors: [{ msg: 'Lỗi máy chủ' }] });
    }
};

// --- ADMIN ---
exports.getAllPaymentMethods = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page || '1', 10));
        const limit = Math.max(1, parseInt(req.query.limit || '10', 10));
        const offset = (page - 1) * limit;
        
        // SỬA: Lấy 'type' thay vì 'isActive'
        const { keyword, type } = req.query;

        const whereClause = {};
        if (keyword) {
            whereClause[Op.or] = [
                { Name: { [Op.like]: `%${keyword}%` } },
                { Code: { [Op.like]: `%${keyword}%` } }
            ];
        }

        // SỬA: Lọc theo 'type' (OFFLINE hoặc ONLINE)
        if (type === 'OFFLINE' || type === 'ONLINE') {
            whereClause.Type = type;
        }

        const { count, rows } = await db.PaymentMethod.findAndCountAll({
            where: whereClause,
            limit,
            offset,
            order: [['MethodID', 'ASC']]
        });

        res.json({ paymentMethods: rows, total: count, page, limit });
    } catch (error) {
        console.error('ADMIN PAYMENT METHODS LIST ERROR:', error);
        res.status(500).json({ errors: [{ msg: 'Lỗi máy chủ' }] });
    }
};

// ... (Giữ nguyên các hàm getById, create, update, delete)
exports.getPaymentMethodById = async (req, res) => {
    try {
        const method = await db.PaymentMethod.findByPk(req.params.id);
        if (!method) {
            return res.status(404).json({ errors: [{ msg: 'Không tìm thấy phương thức thanh toán' }] });
        }
        res.json(method);
    } catch (error) {
        console.error('ADMIN PAYMENT METHOD DETAIL ERROR:', error);
        res.status(500).json({ errors: [{ msg: 'Lỗi máy chủ' }] });
    }
};

exports.createPaymentMethod = async (req, res) => {
    try {
        const { Code } = req.body;
        const existing = await db.PaymentMethod.findOne({ where: { Code } });
        if (existing) {
            return res.status(409).json({ errors: [{ msg: 'Mã phương thức đã tồn tại' }] });
        }
        const newMethod = await db.PaymentMethod.create(req.body);
        res.status(201).json({ message: 'Tạo phương thức thanh toán thành công', method: newMethod });
    } catch (error) {
        console.error('ADMIN CREATE PAYMENT METHOD ERROR:', error);
        res.status(500).json({ errors: [{ msg: 'Lỗi máy chủ' }] });
    }
};

exports.updatePaymentMethod = async (req, res) => {
    try {
        const method = await db.PaymentMethod.findByPk(req.params.id);
        if (!method) {
            return res.status(404).json({ errors: [{ msg: 'Không tìm thấy phương thức thanh toán' }] });
        }

        const { Code } = req.body;
        if (Code && Code !== method.Code) {
            const existing = await db.PaymentMethod.findOne({ where: { Code } });
            if (existing) {
                return res.status(409).json({ errors: [{ msg: 'Mã phương thức đã tồn tại' }] });
            }
        }

        await method.update(req.body);
        res.json({ message: 'Cập nhật phương thức thanh toán thành công', method });
    } catch (error) {
        console.error('ADMIN UPDATE PAYMENT METHOD ERROR:', error);
        res.status(500).json({ errors: [{ msg: 'Lỗi máy chủ' }] });
    }
};

exports.deletePaymentMethod = async (req, res) => {
    try {
        const methodId = req.params.id;
        
        const transactionCount = await db.PaymentTransaction.count({ where: { MethodID: methodId } });
        if (transactionCount > 0) {
            return res.status(409).json({ errors: [{ msg: 'Không thể xóa: Phương thức đang được sử dụng trong các giao dịch.' }] });
        }

        const deletedRows = await db.PaymentMethod.destroy({ where: { MethodID: methodId } });
        if (deletedRows === 0) {
            return res.status(404).json({ errors: [{ msg: 'Không tìm thấy phương thức thanh toán' }] });
        }
        res.json({ message: 'Xóa phương thức thanh toán thành công' });
    } catch (error) {
        console.error('ADMIN DELETE PAYMENT METHOD ERROR:', error);
        res.status(500).json({ errors: [{ msg: 'Lỗi máy chủ' }] });
    }
};