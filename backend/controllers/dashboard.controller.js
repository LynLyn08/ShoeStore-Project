'use strict';
const db = require('../models');
const { Op, Sequelize } = require('sequelize');
const { startOfDay, startOfWeek, startOfMonth, subDays } = require('date-fns');

// --- Helper Functions to define date ranges ---
const successfulOrderStatus = ['Confirmed', 'Shipped', 'Delivered'];
const today = new Date();
const todayStart = startOfDay(today);
const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
const monthStart = startOfMonth(today);
const last30DaysStart = subDays(today, 30);

/**
 * @route   GET /api/admin/home
 * @desc    Lấy dữ liệu TỔNG QUAN (KHÔNG BAO GỒM BẢNG)
 * @access  Private (Admin)
 */
exports.getDashboardStats = async (req, res) => {
    try {
        const [
            totals,
            revenueStats,
            orderStatus,
            misc,
            revenueChart,
            ordersChart
        ] = await Promise.all([
            // SỬA: Đếm TẤT CẢ user, product, VÀ TẤT CẢ order
            Promise.all([
                db.User.count(),
                db.Product.count(),
                db.Order.count(), // Đếm tất cả Order
                db.GuestOrder.count() // Đếm tất cả GuestOrder
            ]),
            // 2. Lấy thống kê doanh thu (Hàm này vẫn chỉ tính đơn thành công, LÀ ĐÚNG)
            getRevenueStats(),
            // 3. Lấy số đơn hàng theo trạng thái
            getOrderStatusCounts(),
            // 4. Lấy các thông số khác
            Promise.all([
                db.User.count({ where: { CreatedAt: { [Op.gte]: subDays(today, 7) } } }),
                db.Wishlist.count()
            ]),
            // 5. Lấy dữ liệu biểu đồ doanh thu 30 ngày
            getRevenueChartData(),
            // 6. Lấy dữ liệu biểu đồ đơn hàng 30 ngày
            getOrdersChartData()
        ]);

        // SỬA: Xử lý dữ liệu totals mới
        const [totalUsers, totalProducts, totalUserOrders, totalGuestOrders] = totals;
        const [newUsers, wishlistItems] = misc;
        
        res.json({
            status: 'success',
            data: {
                totals: {
                    totalUsers,
                    totalProducts,
                    // SỬA: Doanh thu lấy từ revenueStats (chỉ đơn thành công)
                    totalRevenue: revenueStats.totalRevenue,
                    // SỬA: Tổng đơn hàng là tổng của cả 2 loại (tất cả trạng thái)
                    totalOrders: (totalUserOrders || 0) + (totalGuestOrders || 0)
                },
                revenue: {
                    day: { revenue: revenueStats.revenueDay, orders: revenueStats.ordersDay },
                    week: { revenue: revenueStats.revenueWeek, orders: revenueStats.ordersWeek },
                    month: { revenue: revenueStats.revenueMonth, orders: revenueStats.ordersMonth },
                },
                orderStatus,
                misc: { newUsers, guestOrders: totalGuestOrders, wishlistItems }, // SỬA: dùng totalGuestOrders
                charts: {
                    revenue: revenueChart,
                    orders: ordersChart,
                    // SỬA: Xóa topProducts và lowStock khỏi fetch này
                },
            },
        });

    } catch (error) {
        console.error('ADMIN HOME ERROR:', error);
        res.status(500).json({ errors: [{ msg: 'Lỗi máy chủ' }] });
    }
};

// ===============================================
// === CÁC HÀM PHÂN TRANG MỚI CHO BẢNG        ===
// ===============================================

/**
 * @route   GET /api/admin/home/top-products
 * @desc    Lấy Top sản phẩm bán chạy (theo BIẾN THỂ) có phân trang
 * @access  Private (Admin)
 */
exports.getPaginatedTopProducts = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page || '1', 10));
        const limit = Math.max(1, parseInt(req.query.limit || '5', 10));
        const offset = (page - 1) * limit;

        // SỬA LỖI: Cập nhật subquery cho DefaultImage
        const query = `
            SELECT 
                p.ProductID, p.Name, pv.VariantID, pv.Size, pv.Color, 
                p.Price, p.DiscountPercent, p.DiscountedPrice, 
                SUM(qty) AS sold,
                (
                    COALESCE(
                        -- 1. Ưu tiên 1: Lấy ảnh của chính VariantID này (nếu có)
                        (SELECT TOP 1 i.ImageURL 
                         FROM ProductImages i 
                         WHERE i.VariantID = pv.VariantID 
                         ORDER BY i.IsDefault DESC, i.ImageID ASC),
                         
                        -- 2. Ưu tiên 2: Lấy ảnh của MỘT BIẾN THỂ KHÁC CÙNG MÀU
                        (SELECT TOP 1 i_color.ImageURL
                         FROM ProductImages i_color
                         JOIN ProductVariants pv_color ON i_color.VariantID = pv_color.VariantID
                         WHERE pv_color.ProductID = p.ProductID AND pv_color.Color = pv.Color
                         ORDER BY i_color.IsDefault DESC, i_color.ImageID ASC),
                         
                        -- 3. Ưu tiên 3: Lấy ảnh chung (Default) của sản phẩm
                        (SELECT TOP 1 i_prod_def.ImageURL 
                         FROM ProductImages i_prod_def 
                         WHERE i_prod_def.ProductID = p.ProductID AND i_prod_def.VariantID IS NULL 
                         ORDER BY i_prod_def.IsDefault DESC, i_prod_def.ImageID ASC),
                         
                        -- 4. Ưu tiên 4: Lấy BẤT KỲ ảnh nào của sản phẩm
                        (SELECT TOP 1 i_any.ImageURL 
                         FROM ProductImages i_any 
                         WHERE i_any.ProductID = p.ProductID 
                         ORDER BY i_any.ImageID ASC)
                    )
                ) AS DefaultImage
            FROM (
                SELECT oi.Quantity AS qty, oi.VariantID FROM OrderItems oi JOIN Orders o ON o.OrderID = oi.OrderID WHERE o.Status IN (:statuses)
                UNION ALL
                SELECT goi.Quantity AS qty, goi.VariantID FROM GuestOrderItems goi JOIN GuestOrders go ON go.GuestOrderID = goi.GuestOrderID WHERE go.Status IN (:statuses)
            ) AS allItems
            JOIN ProductVariants pv ON allItems.VariantID = pv.VariantID
            JOIN Products p ON pv.ProductID = p.ProductID
            GROUP BY p.ProductID, p.Name, pv.VariantID, pv.Size, pv.Color, p.Price, p.DiscountPercent, p.DiscountedPrice
            ORDER BY sold DESC
            OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
        `;

        // Câu truy vấn đếm tổng số (không đổi)
        const totalQuery = `
            SELECT COUNT(DISTINCT allItems.VariantID) AS totalItems
            FROM (
                SELECT oi.VariantID FROM OrderItems oi JOIN Orders o ON o.OrderID = oi.OrderID WHERE o.Status IN (:statuses)
                UNION ALL
                SELECT goi.VariantID FROM GuestOrderItems goi JOIN GuestOrders go ON go.GuestOrderID = goi.GuestOrderID WHERE go.Status IN (:statuses)
            ) AS allItems
        `;

        const [rows, totalResult] = await Promise.all([
            db.sequelize.query(query, {
                replacements: { statuses: successfulOrderStatus, offset, limit },
                type: Sequelize.QueryTypes.SELECT,
                raw: true
            }),
            db.sequelize.query(totalQuery, {
                replacements: { statuses: successfulOrderStatus },
                type: Sequelize.QueryTypes.SELECT,
                raw: true
            })
        ]);
        
        const total = totalResult[0]?.totalItems || 0;
        res.json({ data: rows, total, page, limit, totalPages: Math.ceil(total / limit) || 1 });

    } catch (error) {
        console.error('ADMIN TOP PRODUCTS ERROR:', error);
        res.status(500).json({ errors: [{ msg: 'Lỗi máy chủ' }] });
    }
};

/**
 * @route   GET /api/admin/home/low-stock
 * @desc    Lấy sản phẩm sắp hết hàng (theo BIẾN THỂ) có phân trang
 * @access  Private (Admin)
 */
exports.getPaginatedLowStock = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page || '1', 10));
        const limit = Math.max(1, parseInt(req.query.limit || '5', 10));
        const offset = (page - 1) * limit;

        const { count, rows } = await db.ProductVariant.findAndCountAll({
            where: { StockQuantity: { [Op.lt]: 5 } },
            include: [{ model: db.Product, as: 'product', attributes: ['Name'] }],
            order: [['StockQuantity', 'ASC']],
            limit,
            offset
        });
        
        res.json({ data: rows, total: count, page, limit, totalPages: Math.ceil(count / limit) || 1 });
    } catch (error) {
        console.error('ADMIN LOW STOCK ERROR:', error);
        res.status(500).json({ errors: [{ msg: 'Lỗi máy chủ' }] });
    }
};


// --- Các hàm truy vấn con (Không đổi) ---

async function getRevenueStats() {
    // ... (Hàm này giữ nguyên như trong File 4 của bạn)
    const [revDayO, ordDayO, revWeekO, ordWeekO, revMonthO, ordMonthO, totalRevO, totalOrdO] = await Promise.all([
        db.Order.sum('TotalAmount', { where: { Status: successfulOrderStatus, OrderDate: { [Op.gte]: todayStart } } }),
        db.Order.count({ where: { Status: successfulOrderStatus, OrderDate: { [Op.gte]: todayStart } } }),
        db.Order.sum('TotalAmount', { where: { Status: successfulOrderStatus, OrderDate: { [Op.gte]: weekStart } } }),
        db.Order.count({ where: { Status: successfulOrderStatus, OrderDate: { [Op.gte]: weekStart } } }),
        db.Order.sum('TotalAmount', { where: { Status: successfulOrderStatus, OrderDate: { [Op.gte]: monthStart } } }),
        db.Order.count({ where: { Status: successfulOrderStatus, OrderDate: { [Op.gte]: monthStart } } }),
        db.Order.sum('TotalAmount', { where: { Status: successfulOrderStatus } }),
        db.Order.count({ where: { Status: successfulOrderStatus } }),
    ]);

    const [revDayG, ordDayG, revWeekG, ordWeekG, revMonthG, ordMonthG, totalRevG, totalOrdG] = await Promise.all([
        db.GuestOrder.sum('TotalAmount', { where: { Status: successfulOrderStatus, OrderDate: { [Op.gte]: todayStart } } }),
        db.GuestOrder.count({ where: { Status: successfulOrderStatus, OrderDate: { [Op.gte]: todayStart } } }),
        db.GuestOrder.sum('TotalAmount', { where: { Status: successfulOrderStatus, OrderDate: { [Op.gte]: weekStart } } }),
        db.GuestOrder.count({ where: { Status: successfulOrderStatus, OrderDate: { [Op.gte]: weekStart } } }),
        db.GuestOrder.sum('TotalAmount', { where: { Status: successfulOrderStatus, OrderDate: { [Op.gte]: monthStart } } }),
        db.GuestOrder.count({ where: { Status: successfulOrderStatus, OrderDate: { [Op.gte]: monthStart } } }),
        db.GuestOrder.sum('TotalAmount', { where: { Status: successfulOrderStatus } }),
        db.GuestOrder.count({ where: { Status: successfulOrderStatus } }),
    ]);

    return {
        revenueDay: (revDayO || 0) + (revDayG || 0),
        ordersDay: (ordDayO || 0) + (ordDayG || 0),
        revenueWeek: (revWeekO || 0) + (revWeekG || 0),
        ordersWeek: (ordWeekO || 0) + (ordDayG || 0),
        revenueMonth: (revMonthO || 0) + (revMonthG || 0),
        ordersMonth: (ordMonthO || 0) + (ordMonthG || 0),
        totalRevenue: (totalRevO || 0) + (totalRevG || 0),
        totalOrders: (totalOrdO || 0) + (totalOrdG || 0), // Lưu ý: totalOrders ở đây là tổng đơn *thành công*
    };
}

async function getOrderStatusCounts() {
    const orderCounts = await db.Order.findAll({
        group: ['Status'],
        attributes: ['Status', [Sequelize.fn('COUNT', 'OrderID'), 'count']],
        raw: true
    });
    const guestOrderCounts = await db.GuestOrder.findAll({
        group: ['Status'],
        attributes: ['Status', [Sequelize.fn('COUNT', 'GuestOrderID'), 'count']],
        raw: true
    });

    const statusMap = {};
    [...orderCounts, ...guestOrderCounts].forEach(row => {
        statusMap[row.Status] = (statusMap[row.Status] || 0) + row.count;
    });
    return Object.entries(statusMap).map(([Status, count]) => ({ Status, count }));
}

async function getRevenueChartData() {
    return db.sequelize.query(`
        SELECT CAST(date AS DATE) as date, SUM(revenue) AS revenue FROM (
            SELECT OrderDate AS date, TotalAmount AS revenue FROM Orders WHERE Status IN (:statuses) AND OrderDate >= :startDate
            UNION ALL
            SELECT OrderDate AS date, TotalAmount AS revenue FROM GuestOrders WHERE Status IN (:statuses) AND OrderDate >= :startDate
        ) AS combined
        GROUP BY CAST(date AS DATE) ORDER BY date
    `, {
        replacements: { statuses: successfulOrderStatus, startDate: last30DaysStart },
        type: Sequelize.QueryTypes.SELECT,
        raw: true
    });
}

async function getOrdersChartData() {
    return db.sequelize.query(`
        SELECT CAST(date AS DATE) as date, COUNT(*) AS orders FROM (
            SELECT OrderDate AS date FROM Orders WHERE Status IN (:statuses) AND OrderDate >= :startDate
            UNION ALL
            SELECT OrderDate AS date FROM GuestOrders WHERE Status IN (:statuses) AND OrderDate >= :startDate
        ) AS combined
        GROUP BY CAST(date AS DATE) ORDER BY date
    `, {
        replacements: { statuses: successfulOrderStatus, startDate: last30DaysStart },
        type: Sequelize.QueryTypes.SELECT,
        raw: true
    });
}