'use strict';

const db = require('../models');
const { Op, Sequelize } = require('sequelize');
const OrderService = require('../services/order.service');
const { createPaymentUrl } = require('../utils/vnpay.util');
// =======================================================
// ===           CONTROLLERS CHO GUEST (PUBLIC)        ===
// =======================================================

/**
 * @route   POST /api/guest-orders/place
 * @desc    Khách vãng lai đặt hàng
 * @access  Public
 */
exports.placeGuestOrder = async (req, res) => {
    const sessionId = req.header("X-Session-ID") || null;
    try {
        // Frontend gửi một object phẳng, chúng ta gom thông tin khách vào 'shipping'
        const { fullName, phone, email, street, city, ...restOfBody } = req.body;
        const guestInfo = { FullName: fullName, Phone: phone, Email: email, Address: `${street}, ${city}` };
        
        let orderData = {
            ...restOfBody,
            shipping: guestInfo,
            sessionId
        };
        
        // --- Phần này giữ nguyên logic cũ ---
        if (req.body.shippingProviderId) {
            const provider = await db.ShippingProvider.findByPk(req.body.shippingProviderId);
            if (provider) {
                orderData.ShippingProvider = provider.Name;
                orderData.ShippingProviderID = provider.ProviderID;
            } else {
                return res.status(400).json({ success: false, message: 'Đơn vị vận chuyển không hợp lệ.' });
            }
            delete orderData.shippingProviderId;
        }
        orderData.TotalAmount = req.body.totalAmount || 0;
        // --- Hết phần giữ nguyên ---

        // BƯỚC 1: Luôn tạo đơn hàng GuestOrder trong DB trước
        const newOrder = await OrderService.placeOrderTransaction(orderData, true); // isGuest = true

        // BƯỚC 2: KIỂM TRA PHƯƠNG THỨC THANH TOÁN
        if (orderData.paymentMethod === 'VNPAY') {
            const ipAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
            
            const paymentUrl = createPaymentUrl(
                ipAddr,
                newOrder.TotalAmount,
                newOrder.GuestOrderID, // Dùng GuestOrderID
                process.env.VNPAY_RETURN_URL,
                `Thanh toan don hang ${newOrder.GuestOrderID}`
            );

            // Trả về code '01' để frontend biết cần chuyển hướng
            return res.status(200).json({
                success: true,
                code: '01',
                message: 'Vui lòng thanh toán để hoàn tất đơn hàng.',
                paymentUrl: paymentUrl
            });
        }

        // Nếu là COD
        res.status(201).json({
            success: true,
            code: '00',
            message: 'Đặt hàng thành công!',
            guestOrderId: newOrder.GuestOrderID
        });

    } catch (error) {
        console.error("GUEST place order error:", error);
        res.status(500).json({ success: false, message: error.message || "Lỗi khi đặt hàng." });
    }
};

/**
 * @route   POST /api/guest-history/lookup
 * @desc    Tra cứu lịch sử đơn hàng của khách
 * @access  Public
 */
exports.lookupOrders = async (req, res) => {
    const { email, phone } = req.body;
    try {
        const orders = await db.GuestOrder.findAll({
            where: {
                Email: { [Op.iLike]: email },
                [Op.and]: Sequelize.literal(`REPLACE(REPLACE(REPLACE(REPLACE(Phone, ' ', ''), '-', ''), '(', ''), ')', '') LIKE '%${phone}'`)
            },
            attributes: [ 
                'GuestOrderID', 'TotalAmount', 'Status', 'OrderDate', 'ShippingProvider',  // THÊM: ShippingProvider
                [Sequelize.literal(`(
                    SELECT TOP 1 p.Name
                    FROM GuestOrderItems goi
                    JOIN ProductVariants pv ON pv.VariantID = goi.VariantID
                    JOIN Products p ON p.ProductID = pv.ProductID
                    WHERE goi.GuestOrderID = "GuestOrder"."GuestOrderID"
                    ORDER BY goi.GuestOrderItemID ASC
                )`), 'FirstItemName'],
                [Sequelize.literal(`(
                    SELECT TOP 1 pi.ImageURL
                    FROM GuestOrderItems goi
                    JOIN ProductVariants pv ON pv.VariantID = goi.VariantID
                    JOIN ProductImages pi ON pi.ProductID = pv.ProductID
                    WHERE goi.GuestOrderID = "GuestOrder"."GuestOrderID"
                    ORDER BY pi.IsDefault DESC, pi.ImageID ASC
                )`), 'FirstItemImage'],
            ],
            include: [{  // THÊM: Include ShippingProvider để fallback
                model: db.ShippingProvider,
                as: 'shippingProvider',
                attributes: ['Name'],
                required: false
            }],
            order: [['OrderDate', 'DESC']],
            raw: true
        });

        if (orders.length === 0) {
            return res.status(404).json({ errors: [{ msg: 'Không tìm thấy đơn hàng nào với thông tin đã cung cấp.' }] });
        }

        // SỬA: Fallback Name từ include nếu ShippingProvider NULL
        const processedOrders = orders.map(order => ({
            ...order,
            ShippingProvider: order.ShippingProvider || order['shippingProvider.Name'] || 'Chưa chọn'
        }));

        const byStatus = processedOrders.reduce((acc, order) => {
            (acc[order.Status] = acc[order.Status] || []).push(order);
            return acc;
        }, { Pending: [], Confirmed: [], Shipped: [], Delivered: [], Cancelled: [] });

        return res.json(byStatus);
    } catch (error) {
        console.error('[guest-history][lookup] Error:', error);
        return res.status(500).json({ errors: [{ msg: 'Lỗi máy chủ.' }] });
    }
};

/**
 * @route   GET /api/guest-history/:id
 * @desc    Lấy chi tiết đơn hàng của khách
 * @access  Public
 */
exports.getOrderDetail = async (req, res) => {
    try {
        const order = await db.GuestOrder.findByPk(req.params.id, {
            include: [{ 
                model: db.GuestOrderItem, 
                as: 'items',
                include: [{
                    model: db.ProductVariant,
                    as: 'variant',
                    include: { model: db.Product, as: 'product', attributes: ['Name'] }
                }]
            }, {  // THÊM: Include ShippingProvider
                model: db.ShippingProvider,
                as: 'shippingProvider',
                attributes: ['Name'],
                required: false
            }]
        });

        if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });

        // SỬA: Fallback Name
        order.dataValues.ShippingProvider = order.ShippingProvider || order.shippingProvider?.Name || 'Chưa chọn';

        // Logic lấy ảnh cho từng item có thể được thêm vào đây nếu cần
        for (const item of order.items) {
             const image = await db.ProductImage.findOne({
                where: { ProductID: item.variant.product.ProductID }, // Đây là ví dụ, logic có thể phức tạp hơn
                order: [['IsDefault', 'DESC']],
                attributes: ['ImageURL']
            });
            item.dataValues.ImageURL = image ? image.ImageURL : '/placeholder.jpg';
        }

        res.json({ Order: order, Items: order.items });
    } catch (error) {
        console.error('[guest-history][detail] Error:', error);
        return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

/**
 * @route   POST /api/guest-history/:id/cancel
 * @desc    Khách tự hủy đơn hàng
 * @access  Public
 */
exports.cancelOrder = async (req, res) => {
    try {
        const order = await db.GuestOrder.findByPk(req.params.id);
        if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
        if (order.Status !== 'Pending') return res.status(400).json({ message: 'Chỉ có thể hủy đơn khi đang ở trạng thái "Chờ xác nhận".' });

        await order.update({ Status: 'Cancelled' });
        res.json({ message: 'Đã hủy đơn hàng.', Order: order });
    } catch (error) {
        console.error('[guest-history][cancel] Error:', error);
        return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

// =======================================================
// ===               CONTROLLERS CHO ADMIN               ===
// =======================================================

/**
 * @route   GET /api/admin/orders?customerType=guest
 * @desc    Admin lấy danh sách đơn hàng của khách
 * @access  Private (Admin)
 */
exports.getAllGuestOrdersAdmin = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page || '1', 10));
        const limit = Math.max(1, parseInt(req.query.limit || '10', 10));
        const offset = (page - 1) * limit;
        const { keyword, status } = req.query;

        const whereClause = {};
        if (status) whereClause.Status = status;
        if (keyword) {
            whereClause[Op.or] = [
                { FullName: { [Op.like]: `%${keyword}%` } },
                { Email: { [Op.like]: `%${keyword}%` } },
                { Phone: { [Op.like]: `%${keyword}%` } },
                { GuestOrderID: !isNaN(parseInt(keyword)) ? parseInt(keyword) : null },
            ];
        }

        const { count, rows } = await db.GuestOrder.findAndCountAll({
            where: whereClause,
            include: [{  // THÊM: Include ShippingProvider
                model: db.ShippingProvider,
                as: 'shippingProvider',
                attributes: ['Name'],
                required: false
            }],
            limit,
            offset,
            order: [['OrderDate', 'DESC']]
        });

        // SỬA: Fallback Name trong rows
        const processedRows = rows.map(order => ({
            ...order.toJSON(),
            ShippingProvider: order.ShippingProvider || order.shippingProvider?.Name || 'Chưa chọn'
        }));

        res.json({ orders: processedRows, total: count, page, limit });
    } catch (error) {
        console.error("ADMIN GET GUEST ORDERS ERROR:", error);
        res.status(500).json({ errors: [{ msg: 'Lỗi máy chủ' }] });
    }
};

/**
 * @route   GET /api/admin/orders/guest/:id
 * @desc    Admin lấy chi tiết một đơn hàng của khách
 * @access  Private (Admin)
 */
exports.getGuestOrderDetailAdmin = async (req, res) => {
    try {
        const order = await db.GuestOrder.findByPk(req.params.id, {
            include: [{ 
                model: db.GuestOrderItem, 
                as: 'items',
                include: [{
                    model: db.ProductVariant,
                    as: 'variant',
                    include: { model: db.Product, as: 'product', attributes: ['Name'] }
                }]
            }, {  // THÊM: Include ShippingProvider
                model: db.ShippingProvider,
                as: 'shippingProvider',
                attributes: ['Name'],
                required: false
            }]
        });
        if (!order) return res.status(404).json({ errors: [{ msg: 'Không tìm thấy đơn hàng' }] });

        // SỬA: Fallback Name
        order.dataValues.ShippingProvider = order.ShippingProvider || order.shippingProvider?.Name || 'Chưa chọn';

        res.json(order);
    } catch (error) {
        console.error("ADMIN GET GUEST ORDER DETAIL ERROR:", error);
        res.status(500).json({ errors: [{ msg: 'Lỗi máy chủ' }] });
    }
};

/**
 * @route   PUT /api/admin/orders/guest/:id/status
 * @desc    Admin cập nhật trạng thái đơn hàng của khách
 * @access  Private (Admin)
 */
exports.updateGuestOrderStatus = async (req, res) => {
    try {
        const order = await db.GuestOrder.findByPk(req.params.id);
        if (!order) return res.status(404).json({ errors: [{ msg: 'Không tìm thấy đơn hàng' }] });

        await order.update({ Status: req.body.Status });
        res.json({ message: 'Cập nhật trạng thái thành công' });
    } catch (error) {
        console.error('ADMIN UPDATE GUEST STATUS ERROR:', error);
        res.status(500).json({ errors: [{ msg: 'Lỗi máy chủ' }] });
    }
};