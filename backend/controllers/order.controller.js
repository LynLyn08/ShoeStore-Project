// backend/controllers/order.controller.js (đầy đủ, chỉ sửa exports.placeOrder)

'use strict';
const dotenv = require("dotenv");
dotenv.config();
const db = require('../models');
const { Op, Sequelize } = require('sequelize');
const OrderService = require('../services/order.service');
const { createPaymentUrl } = require('../utils/vnpay.util');
// =======================================================
// ===               CONTROLLERS CHO USER              ===
// =======================================================

/**
 * @route   POST /api/user/orders/place
 * @desc    Người dùng đặt hàng
 * @access  Private
 */
exports.placeOrder = async (req, res) => {
    const userId = req.user.id;
    try {
        let orderData = { ...req.body, userId };

        // --- Phần này giữ nguyên ---
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
        const totalAmount = req.body.totalAmount || 0;
        orderData.TotalAmount = totalAmount;
        // --- Hết phần giữ nguyên ---

        // BƯỚC 1: Luôn tạo đơn hàng trong DB trước
        const newOrder = await OrderService.placeOrderTransaction(orderData, false);

        // BƯỚC 2: KIỂM TRA PHƯƠNG THỨC THANH TOÁN
        if (orderData.paymentMethod === 'VNPAY') {
            // Nếu là VNPAY, tạo URL thanh toán và trả về cho frontend
            const ipAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
            
            const paymentUrl = createPaymentUrl(
                ipAddr,
                newOrder.TotalAmount,
                newOrder.OrderID,
                process.env.VNPAY_RETURN_URL,
                `Thanh toan don hang ${newOrder.OrderID}`
            );

            // Trả về một mã code đặc biệt để frontend biết cần chuyển hướng
            return res.status(200).json({
                success: true,
                code: '01', 
                message: 'Vui lòng thanh toán để hoàn tất đơn hàng.',
                paymentUrl: paymentUrl
            });
        }

        // Nếu là COD hoặc phương thức khác (không phải VNPAY)
        res.status(201).json({
            success: true,
            code: '00', // Mã cho biết đặt hàng thành công ngay
            message: 'Đặt hàng thành công!',
            orderId: newOrder.OrderID
        });

    } catch (error) {
        console.error("USER place order error:", error);
        res.status(500).json({ success: false, message: error.message || "Lỗi khi đặt hàng." });
    }
};
/**
 * @route   GET /api/profile/orders
 * @desc    Lấy danh sách đơn hàng của người dùng (cho trang profile)
 * @access  Private
 */
exports.getUserOrders = async (req, res) => {
    try {
        const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
        const userId = req.user.id;
        const { q } = req.query;

        const whereClause = { UserID: userId };
        if (q) {
            whereClause[Op.or] = [
                { OrderID: { [Op.like]: `%${q}%` } },
                { Status: { [Op.like]: `%${q}%` } },
                { TrackingCode: { [Op.like]: `%${q}%` } },
                { '$shippingAddress.FullName$': { [Op.like]: `%${q}%` } },
                { '$shippingAddress.Phone$': { [Op.like]: `%${q}%` } },
            ];
        }

        const orders = await db.Order.findAll({
            where: whereClause,
            attributes: [
                'OrderID', 'TotalAmount', 'Status', 'OrderDate', 'TrackingCode', 'ShippingProvider',
                [Sequelize.col('shippingAddress.FullName'), 'RecipientName'],
                [Sequelize.col('shippingAddress.Phone'), 'ShippingPhone'],
                [Sequelize.literal(
                    `shippingAddress.Street + ', ' + shippingAddress.City + ', ' + ISNULL(shippingAddress.State + ', ', '') + shippingAddress.Country`
                ), 'Address'],
                [Sequelize.literal(`(SELECT COUNT(*) FROM OrderItems AS oi WHERE oi.OrderID = "Order"."OrderID")`), 'ItemsCount'],
                [Sequelize.literal(`(
                    SELECT TOP 1 p.Name
                    FROM OrderItems oi
                    JOIN ProductVariants pv ON pv.VariantID = oi.VariantID
                    JOIN Products p ON p.ProductID = pv.ProductID
                    WHERE oi.OrderID = "Order"."OrderID"
                    ORDER BY oi.OrderItemID ASC
                )`), 'FirstItemName'],
                 [Sequelize.literal(`(
                    SELECT TOP 1 pi.ImageURL
                    FROM OrderItems oi
                    JOIN ProductVariants pv ON pv.VariantID = oi.VariantID
                    JOIN ProductImages pi ON pi.ProductID = pv.ProductID
                    WHERE oi.OrderID = "Order"."OrderID"
                    ORDER BY pi.IsDefault DESC, pi.ImageID ASC
                )`), 'FirstItemImage'],
            ],
            include: [{
                model: db.Address,
                as: 'shippingAddress',
                attributes: ['FullName', 'Phone', 'Street', 'City', 'State', 'Country'] // Chỉ dùng để join
            }, {
                // THÊM: Include ShippingProvider để fallback Name nếu ShippingProvider NULL
                model: db.ShippingProvider,
                as: 'shippingProvider',
                attributes: ['Name'],
                required: false  // Left join nếu ID NULL
            }],
            order: [['OrderDate', 'DESC']],
            raw: true
        });

        //  Fallback Name từ include nếu ShippingProvider NULL
        const processedOrders = orders.map(order => ({
            ...order,
            ShippingProvider: order.ShippingProvider || order['shippingProvider.Name'] || 'Chưa chọn',
            FirstItemImage: order.FirstItemImage 
                ? `${BASE_URL}${order.FirstItemImage}` 
                : null
        }));

        res.json(processedOrders);
    } catch (error) {
        console.error('GET user orders error:', error);
        res.status(500).json({ message: 'Lỗi khi tải danh sách đơn hàng.' });
    }
};
/**
 * @route   GET /api/profile/orders/:id
 * @desc    Lấy chi tiết một đơn hàng của người dùng
 * @access  Private
 */
/**
 * @route   GET /api/profile/orders/:id
 * @desc    Lấy chi tiết một đơn hàng của người dùng
 * @access  Private
 */
/**
 * @route   GET /api/profile/orders/:id
 * @desc    Lấy chi tiết một đơn hàng của người dùng 
 * @access  Private
 */
/**
 * @route   GET /api/profile/orders/:id
 * @desc    Lấy chi tiết một đơn hàng của người dùng 
 * @access  Private
 */
exports.getUserOrderDetail = async (req, res) => {
   
    try {
        const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

       
        const productImageSubquery = `COALESCE(
            (SELECT TOP 1 pi.ImageURL FROM ProductImages pi WHERE pi.VariantID = [items->variant].VariantID ORDER BY pi.IsDefault DESC, pi.ImageID),
            (SELECT TOP 1 pi2.ImageURL FROM ProductImages pi2 WHERE pi2.ProductID = [items->variant].ProductID AND pi2.VariantID IS NULL ORDER BY pi2.IsDefault DESC, pi2.ImageID),
            NULL
        )`;

        const order = await db.Order.findOne({
            where: {
                OrderID: req.params.id,
                UserID: req.user.id
            },
            include: [
                {
                    model: db.Address,
                    as: 'shippingAddress'
                },
                {
                    model: db.OrderItem,
                    as: 'items',
                    include: [{
                        model: db.ProductVariant,
                        as: 'variant',
                        attributes: [
                            'VariantID',
                            'ProductID',
                            'Size',
                            'Color',
                            [Sequelize.literal(productImageSubquery), 'VariantImageURL']
                        ],
                        include: {
                            model: db.Product,
                            as: 'product',
                            // === ĐẢM BẢO 'ProductID' CÓ Ở ĐÂY ===
                            attributes: ['Name', 'ProductID'] 
                        }
                    }]
                }
            ]
        });

        if (!order) {
            return res.status(404).json({ message: "Không tìm thấy đơn hàng hoặc bạn không có quyền truy cập." });
        }

        // 3. LÀM PHẲNG DỮ LIỆU ĐỊA CHỈ
        if (order.shippingAddress) {
            order.dataValues.RecipientName = order.shippingAddress.FullName;
            order.dataValues.ShippingPhone = order.shippingAddress.Phone;
            order.dataValues.Address = [
                order.shippingAddress.Street,
                order.shippingAddress.City,
                order.shippingAddress.State,
                order.shippingAddress.Country
            ].filter(Boolean).join(', ');
        }

        // 4. VÒNG LẶP ĐƠN GIẢN
        for (const item of order.items) {
            const variant = item.variant;

            item.dataValues.ImageURL = variant.dataValues.VariantImageURL
                ? `${BASE_URL}${variant.dataValues.VariantImageURL}`
                : null; 

            if (variant) {
                item.dataValues.Size = variant.Size;
                item.dataValues.Color = variant.Color;
                item.dataValues.ProductName = variant.product.Name;
                // (Mặc dù chúng ta không làm phẳng ProductID,
                // nó vẫn tồn tại trong item.variant.product.ProductID
                // nhờ câu include ở trên)
            }
        }

        // 5. Trả về dữ liệu
        res.json({ Order: order, Items: order.items });

    } catch (error) {
        console.error('Order detail GET error:', error);
        return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

/**
 * @route   PUT /api/profile/orders/:id/cancel
 * @desc    Người dùng tự hủy đơn hàng
 * @access  Private
 */
exports.cancelUserOrder = async (req, res) => {
    try {
        const order = await db.Order.findOne({ 
            where: { OrderID: req.params.id, UserID: req.user.id } 
        });
        
        if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
        if (order.Status !== 'Pending') return res.status(400).json({ message: 'Chỉ có thể hủy đơn hàng ở trạng thái "Pending".' });
        
        await order.update({ Status: 'Cancelled' });
        res.json({ message: 'Hủy đơn hàng thành công.' });
    } catch (error) {
        console.error('Order cancel PUT error:', error);
        res.status(500).json({ message: 'Lỗi máy chủ.' });
    }
};


// =======================================================
// ===               CONTROLLERS CHO ADMIN               ===
// =======================================================

/**
 * @route   GET /api/admin/orders?customerType=user
 * @desc    Admin lấy danh sách đơn hàng của user
 * @access  Private (Admin)
 */
exports.getAllUserOrdersAdmin = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page || '1', 10));
        const limit = Math.max(1, parseInt(req.query.limit || '10', 10));
        const offset = (page - 1) * limit;
        const { keyword, status } = req.query;

        const whereClause = {};
        if (status) whereClause.Status = status;

        const includeWhereUser = {};
        if (keyword) {
            whereClause[Op.or] = [
                { OrderID: !isNaN(parseInt(keyword)) ? parseInt(keyword) : null },
            ];
            includeWhereUser[Op.or] = [
                { Username: { [Op.like]: `%${keyword}%` } },
                { Email: { [Op.like]: `%${keyword}%` } }
            ];
        }

        const { count, rows } = await db.Order.findAndCountAll({
            where: whereClause,
            include: [{
                model: db.User,
                as: 'user',
                attributes: ['Username', 'Email'],
                where: Object.keys(includeWhereUser).length ? includeWhereUser : null,
            }, {
                // THÊM: Include ShippingProvider
                model: db.ShippingProvider,
                as: 'shippingProvider',
                attributes: ['Name'],
                required: false
            }],
            limit,
            offset,
            order: [['OrderDate', 'DESC']],
            distinct: true
        });

        // SỬA: Fallback Name trong rows
        const processedRows = rows.map(order => ({
            ...order.toJSON(),
            ShippingProvider: order.ShippingProvider || order.shippingProvider?.Name || 'Chưa chọn'
        }));

        res.json({ orders: processedRows, total: count, page, limit });
    } catch (error) {
        console.error("ADMIN GET USER ORDERS ERROR:", error);
        res.status(500).json({ errors: [{ msg: 'Lỗi máy chủ' }] });
    }
};
/**
 * @route   GET /api/admin/orders/order/:id
 * @desc    Admin lấy chi tiết một đơn hàng của user
 * @access  Private (Admin)
 */
exports.getUserOrderDetailAdmin = async (req, res) => {
     try {
        const order = await db.Order.findByPk(req.params.id, {
            include: [
                { model: db.User, as: 'user', attributes: ['Username', 'Email'] },
                { model: db.Address, as: 'shippingAddress' },
                { 
                    model: db.OrderItem, 
                    as: 'items',
                    include: [{
                        model: db.ProductVariant,
                        as: 'variant',
                        include: { model: db.Product, as: 'product', attributes: ['Name'] }
                    }]
                }
            ]
        });
        if (!order) return res.status(404).json({ errors: [{ msg: 'Không tìm thấy đơn hàng' }] });
        res.json(order);
    } catch (error) {
        console.error("ADMIN GET ORDER DETAIL ERROR:", error);
        res.status(500).json({ errors: [{ msg: 'Lỗi máy chủ' }] });
    }
};

/**
 * @route   PUT /api/admin/orders/order/:id/status
 * @desc    Admin cập nhật trạng thái đơn hàng của user
 * @access  Private (Admin)
 */
exports.updateOrderStatus = async (req, res) => {
    try {
        const order = await db.Order.findByPk(req.params.id);
        if (!order) return res.status(404).json({ errors: [{ msg: 'Không tìm thấy đơn hàng' }] });

        await order.update({ Status: req.body.Status });
        res.json({ message: 'Cập nhật trạng thái thành công' });
    } catch (error) {
        console.error('ADMIN UPDATE STATUS ERROR:', error);
        res.status(500).json({ errors: [{ msg: 'Lỗi máy chủ' }] });
    }
};

/**
 * @route   PUT /api/admin/orders/order/:id/tracking
 * @desc    Admin cập nhật thông tin vận đơn
 * @access  Private (Admin)
 */
exports.updateTrackingInfo = async (req, res) => {
    try {
        const order = await db.Order.findByPk(req.params.id);
        if (!order) return res.status(404).json({ errors: [{ msg: 'Không tìm thấy đơn hàng' }] });

        await order.update(req.body); // { TrackingCode, ShippingProvider }
        res.json({ message: 'Cập nhật tracking thành công' });
    } catch (error) {
        console.error('ADMIN UPDATE TRACKING ERROR:', error);
        res.status(500).json({ errors: [{ msg: 'Lỗi máy chủ' }] });
    }
};