'use strict';
const db = require('../models');
const { Op, Sequelize } = require('sequelize');
const { addDays } = require('date-fns');
const emailService = require('../services/email.service');

// =======================================================
// ===               CONTROLLERS CHO USER              ===
// =======================================================
/**
 * @route   GET /api/user/coupons
 * @desc    Lấy danh sách các coupon còn hiệu lực
 * @access  Public
 */
// controllers/coupon.controller.js - SỬA exports.listAvailableCoupons
/**
 * @route   GET /api/user/coupons
 * @desc    Lấy danh sách các coupon công khai còn hiệu lực (để chọn)
 * @access  Public
 */
exports.listAvailableCoupons = async (req, res) => {
    try {
        const now = new Date();  

        const coupons = await db.Coupon.findAll({
            where: {
                ExpiryDate: { [Op.gte]: now }, // Chưa hết hạn
                IsPublic: true,                // CHỈ LẤY CÁC MÃ CÔNG KHAI
                [Op.or]: [
                    { MaxUses: 0 }, // Hoặc không giới hạn lượt dùng
                    { UsedCount: { [Op.lt]: Sequelize.col('MaxUses') } } // Hoặc lượt dùng < max
                ]
            },
            order: [['ExpiryDate', 'ASC']]
        });
        
        res.json({ success: true, coupons });  
    } catch (error) {
        console.error("coupons list error:", error);  
        res.status(500).json({ success: false, message: "Không lấy được danh sách mã." });
    }
};

/**
 * @route   POST /api/user/coupons/validate
 * @desc    Kiểm tra một mã coupon có hợp lệ không
 * @access  Public (có thể kèm token nếu user login)
 */
exports.validateCoupon = async (req, res) => {
    try {
        const { code, total } = req.body;
        const userId = req.user?.id; // Lấy ID user nếu đã đăng nhập

        const coupon = await db.Coupon.findOne({ where: { Code: code } });

        // --- BƯỚC 1: KIỂM TRA TỒN TẠI & HẾT HẠN ---
        if (!coupon) {
            return res.json({ success: true, valid: false, message: "Mã không tồn tại." });
        }
        if (new Date(coupon.ExpiryDate) < new Date()) {
            return res.json({ success: true, valid: false, message: "Mã đã hết hạn." });
        }
        if (coupon.MaxUses > 0 && coupon.UsedCount >= coupon.MaxUses) {
            return res.json({ success: true, valid: false, message: "Mã đã hết lượt sử dụng tổng." });
        }
        
        // --- BƯỚC 2: KIỂM TRA ĐIỀU KIỆN ĐƠN HÀNG TỐI THIỂU ---
        const subtotal = Number(total || 0);
        const minAmount = Number(coupon.MinPurchaseAmount || 0);
        if (subtotal < minAmount) {
             return res.json({ success: true, valid: false, message: `Đơn hàng phải đạt tối thiểu ${minAmount.toLocaleString('vi-VN')}₫.` });
        }


        // --- BƯỚC 3: KIỂM TRA GIỚI HẠN SỬ DỤNG CÁ NHÂN (YÊU CẦU LOGIN) ---
        if (userId) {
            
            if (coupon.IsPublic) {
                // Trường hợp 3.1: Coupon Công khai (Dùng nhiều lần/user)
                if (coupon.UsesPerUser > 0) {
                    const userUsageCount = await db.UsageLog.count({
                        where: { CouponID: coupon.CouponID, UserID: userId }
                    });
                    if (userUsageCount >= coupon.UsesPerUser) {
                         return res.json({ success: true, valid: false, message: `Bạn đã dùng mã này ${coupon.UsesPerUser} lần (giới hạn tối đa).` });
                    }
                }

            } else {
                // Trường hợp 3.2: Voucher Riêng tư (Phải có trong Ví)
                const userVoucher = await db.UserVoucher.findOne({
                    where: { UserID: userId, CouponID: coupon.CouponID }
                });

                if (!userVoucher) {
                    return res.json({ success: true, valid: false, message: "Mã này không dành cho tài khoản của bạn." });
                }
                if (userVoucher.IsUsed) {
                    return res.json({ success: true, valid: false, message: "Voucher này đã được sử dụng." });
                }
            }
        } 
        
        // GUEST & PUBLIC: Nếu là khách (không có userId) và coupon là public, họ chỉ bị giới hạn bởi MaxUses tổng (đã check ở B1).

        // --- BƯỚC 4: TÍNH TOÁN VÀ TRẢ VỀ DISCOUNT ---
        let discount = 0;
        const discountValue = Number(coupon.DiscountValue);
        
        if (coupon.DiscountType === 'Percent') {
             // Giảm theo %
            discount = Math.round((subtotal * discountValue) / 100);
        } else if (coupon.DiscountType === 'FixedAmount') {
            // Giảm theo số tiền cố định, không vượt quá tổng đơn
            discount = Math.min(subtotal, discountValue);
        }
        
        // Trả về thông tin chiết khấu chi tiết
        return res.json({ 
            success: true, 
            valid: true, 
            discount: discount, 
            type: coupon.DiscountType,
            value: discountValue,
            minAmount: minAmount
        });

    } catch (error) {
        console.error("coupon validate error:", error);
        res.status(500).json({ success: false, valid: false, message: "Lỗi máy chủ khi xác thực mã." });
    }
};
/**
 * @route   GET /api/user/vouchers
 * @desc    Lấy danh sách các voucher riêng tư đã được gán cho user
 * @access  Private
 */
exports.getUserVouchers = async (req, res) => {
    try {
        const userId = req.user.id;
        const now = new Date();

        const userVouchers = await db.UserVoucher.findAll({
            where: { UserID: userId}, // <<< CHỈ LẤY VOUCHER CHƯA SỬ DỤNG
            attributes: ['IsUsed'],
            include: [{
                model: db.Coupon,
                as: 'coupon',
                where: {
                    IsPublic: false, // Chỉ lấy voucher riêng tư
                    ExpiryDate: { [Op.gte]: now }, // Chưa hết hạn
                    // Không cần check MaxUses/UsedCount tổng vì UserVoucher đã cá nhân hóa
                },
                attributes: [
                    'CouponID', 'Code', 'DiscountType', 'DiscountValue', 
                    'MinPurchaseAmount', 'ExpiryDate', 'MaxUses', 'UsedCount'
                ]
            }],
            // Loại bỏ các bản ghi UserVoucher mà Coupon đã bị xóa/không hợp lệ
            // Đảm bảo chỉ lấy những voucher có Coupon còn tồn tại
            required: true 
        });

        // Chỉ trả về các voucher hợp lệ và chưa được sử dụng
        const validVouchers = userVouchers
            .filter(uv => uv.coupon !== null)
            .map(uv => ({
                ...uv.coupon.toJSON(),
                IsUsedInWallet: uv.IsUsed // Đổi tên để tránh nhầm lẫn với IsUsedCount
            }));

        res.json({ success: true, vouchers: validVouchers });

    } catch (error) {
        console.error("user vouchers list error:", error);
        res.status(500).json({ success: false, message: "Không lấy được danh sách ví voucher." });
    }
};
// =======================================================
// ===               CONTROLLERS CHO ADMIN               ===
// =======================================================

/**
 * @route   GET /api/admin/coupons
 * @desc    Admin lấy danh sách coupon (phân trang, tìm kiếm, lọc)
 * @access  Private (Admin)
 */
exports.getAllCouponsAdmin = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page || '1', 10));
        const limit = Math.max(1, parseInt(req.query.limit || '10', 10));
        const offset = (page - 1) * limit;
        const { keyword, isNearExpiry } = req.query;

        const whereClause = {};
        if (keyword) {
            whereClause.Code = { [Op.like]: `%${keyword}%` };
        }
        if (isNearExpiry === 'true') {
            whereClause.ExpiryDate = { [Op.between]: [new Date(), addDays(new Date(), 7)] };
        }
        
        const { count, rows } = await db.Coupon.findAndCountAll({
            where: whereClause,
            limit,
            offset,
            order: [['CouponID', 'ASC']]
        });
        res.json({ coupons: rows, total: count, page, limit });
    } catch (error) {
        console.error('ADMIN COUPONS LIST ERROR:', error);
        res.status(500).json({ errors: [{ msg: 'Lỗi máy chủ' }] });
    }
};

/**
 * @route   POST /api/admin/coupons
 * @desc    Admin tạo coupon mới
 * @access  Private (Admin)
 */
exports.createCoupon = async (req, res) => {
    try {
        // SỬA: Lấy thêm IsPublic và UsesPerUser từ body
        const { Code, IsPublic, UsesPerUser } = req.body;
        
        const existing = await db.Coupon.findOne({ where: { Code } });
        if (existing) {
            return res.status(409).json({ errors: [{ msg: 'Mã coupon đã tồn tại' }] });
        }
        
        // SỬA: Truyền req.body (đã chứa các trường mới) vào create
        const newCoupon = await db.Coupon.create(req.body);
        
        res.status(201).json({ message: 'Tạo coupon thành công', coupon: newCoupon });
    } catch (error) {
        console.error('ADMIN ADD COUPON ERROR:', error);
        res.status(500).json({ errors: [{ msg: 'Lỗi máy chủ' }] });
    }
};

/**
 * @route   PUT /api/admin/coupons/:id
 * @desc    Admin cập nhật coupon
 * @access  Private (Admin)
 */
exports.updateCoupon = async (req, res) => {
    try {
        const coupon = await db.Coupon.findByPk(req.params.id);
        if (!coupon) {
            return res.status(404).json({ errors: [{ msg: 'Không tìm thấy coupon' }] });
        }

        // SỬA: req.body sẽ chứa các trường mới và hàm update sẽ tự động map chúng
        await coupon.update(req.body);
        
        res.json({ message: 'Cập nhật coupon thành công', coupon });
    } catch (error) {
        console.error('ADMIN UPDATE COUPON ERROR:', error);
        res.status(500).json({ errors: [{ msg: 'Lỗi máy chủ' }] });
    }
};

/**
 * @route   DELETE /api/admin/coupons/:id
 * @desc    Admin xóa coupon
 * @access  Private (Admin)
 */
exports.deleteCoupon = async (req, res) => {
    try {
        const deletedRows = await db.Coupon.destroy({ where: { CouponID: req.params.id } });
        if (deletedRows === 0) {
            return res.status(404).json({ errors: [{ msg: 'Không tìm thấy coupon' }] });
        }
        res.json({ message: 'Xóa coupon thành công' });
    } catch (error) {
        // Xử lý lỗi khóa ngoại nếu coupon đã được sử dụng
        if (error instanceof Sequelize.ForeignKeyConstraintError) {
            return res.status(409).json({ errors: [{ msg: 'Không thể xóa coupon đã được sử dụng.' }] });
        }
        console.error('ADMIN DELETE COUPON ERROR:', error);
        res.status(500).json({ errors: [{ msg: 'Lỗi máy chủ' }] });
    }
};

/**
 * @route   GET /api/admin/coupons/emails
 * @desc    Lấy danh sách email khách hàng
 * @access  Private (Admin)
 */
exports.getCustomerEmails = async (req, res) => {
    try {
        const userEmails = await db.User.findAll({ attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('Email')), 'Email']] });
        const guestEmails = await db.GuestOrder.findAll({ attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('Email')), 'Email']] });

        const allEmails = new Set([
            ...userEmails.map(u => u.Email),
            ...guestEmails.map(g => g.Email)
        ]);
        
        res.json({ emails: Array.from(allEmails) });
    } catch (error) {
        console.error('ADMIN FETCH EMAILS ERROR:', error);
        res.status(500).json({ errors: [{ msg: 'Lỗi máy chủ' }] });
    }
};
/**
 * @route   POST /api/admin/coupons/send-email
 * @desc    Gửi email thông báo coupon cho khách hàng
 * @access  Private (Admin)
 */
exports.sendCouponToCustomers = async (req, res) => {
    const { couponId, emailTo } = req.body; 
    try {
        const coupon = await db.Coupon.findByPk(couponId);
        if (!coupon) return res.status(404).json({ message: 'Không tìm thấy coupon để gửi.' });

        // KHÔI PHỤC LOGIC TÌM KIẾM EMAIL
        let emailsToSend = [];
        let usersToAssign = []; // Chỉ user có tài khoản mới được gán voucher

        if (emailTo === 'all') {
            const userEmails = await db.User.findAll({ attributes: ['Email', 'UserID'] });
            const guestEmails = await db.GuestOrder.findAll({ attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('Email')), 'Email']] });
            
            const allEmailSet = new Set();
            userEmails.forEach(u => {
                allEmailSet.add(u.Email);
                usersToAssign.push({ UserID: u.UserID, Email: u.Email }); // <<< Chỉ User mới vào đây
            });
            guestEmails.forEach(g => allEmailSet.add(g.Email));
            emailsToSend = Array.from(allEmailSet);

        } else if (emailTo) {
            emailsToSend = [emailTo];
            // Tìm xem email này có phải là User không
            const user = await db.User.findOne({ where: { Email: emailTo }, attributes: ['UserID', 'Email'] });
            if (user) usersToAssign.push({ UserID: user.UserID, Email: user.Email }); // <<< Chỉ User mới vào đây
        }
        
        if(emailsToSend.length === 0) {
            return res.status(400).json({ message: 'Không có email nào để gửi.' });
        }

        // GÁN VOUCHER (Nếu là Riêng tư)
        if (!coupon.IsPublic) { 
            // Nếu coupon là riêng tư, chỉ gán cho user
            const vouchersToUpsert = usersToAssign.map(user => ({
                UserID: user.UserID,
                CouponID: coupon.CouponID,
                IsUsed: false 
            }));
            
            if (vouchersToUpsert.length > 0) {
                 for (const uv of vouchersToUpsert) {
                     await db.UserVoucher.upsert(uv); 
                 }
            }
            
            // SỬA LOGIC: Nếu là riêng tư, chỉ gửi email cho những user đã được gán
            emailsToSend = usersToAssign.map(u => u.Email); 
            
            if(emailsToSend.length === 0) {
                return res.json({ message: 'Coupon là riêng tư. Không có tài khoản User nào (Khách không được gán) khớp với email để gửi.' });
            }
        }
        
        // GỌI SERVICE ĐÚNG (Public sẽ gửi cho all, Private chỉ gửi cho usersToAssign)
        await emailService.sendCouponEmail(emailsToSend, coupon);
        
        let message = `Đã gửi email coupon tới ${emailsToSend.length} địa chỉ.`;
        if (!coupon.IsPublic) {
            message += ` ${usersToAssign.length} ví voucher của User đã được cập nhật.`
        }
        
        return res.json({ message });

    } catch(error) {
        console.error('ADMIN SEND COUPON EMAIL ERROR:', error);
        return res.status(500).json({ errors: [{ msg: error.message || 'Lỗi khi gửi email' }] });
    }
};
/**
 * @route   GET /api/admin/coupons/:id/usage
 * @desc    Lấy danh sách ai đã dùng 1 coupon
 * @access  Private (Admin)
 */
exports.getCouponUsage = async (req, res) => {
    try {
        const couponId = req.params.id;
        const logs = await db.UsageLog.findAll({
            where: { CouponID: couponId },
            include: [
                { 
                    model: db.User, 
                    as: 'user', 
                    attributes: ['UserID', 'Username', 'Email'] 
                },
                { 
                    model: db.GuestOrder, 
                    as: 'guestOrder', 
                    attributes: ['GuestOrderID', 'FullName', 'Email'] 
                }
            ],
            order: [['UsedAt', 'DESC']]
        });
        
        // Xử lý để gộp thông tin User/Guest
        const usageDetails = logs.map(log => ({
            UsageID: log.UsageID,
            UsedAt: log.UsedAt,
            Customer: log.user 
                ? `[User] ${log.user.Username} (${log.user.Email})` 
                : `[Guest] ${log.guestOrder.FullName} (${log.guestOrder.Email})`,
            OrderID: log.OrderID || log.GuestOrderID
        }));

        res.json({ usage: usageDetails });

    } catch (error) {
        console.error('ADMIN GET COUPON USAGE ERROR:', error);
        res.status(500).json({ errors: [{ msg: 'Lỗi máy chủ' }] });
    }
};

/**
 * @route   GET /api/admin/coupons/:id/assignments
 * @desc    Lấy danh sách ai đã được gán 1 voucher (cho mã private)
 * @access  Private (Admin)
 */
exports.getCouponAssignments = async (req, res) => {
    try {
        const couponId = req.params.id;
        
        const assignments = await db.UserVoucher.findAll({
            where: { CouponID: couponId },
            include: [
                { 
                    model: db.User, 
                    as: 'user', 
                    attributes: ['UserID', 'Username', 'Email'] 
                }
            ],
            attributes: ['IsUsed', 'createdAt'] // Lấy trạng thái đã dùng hay chưa
        });

        res.json({ assignments: assignments });

    } catch (error) {
        console.error('ADMIN GET COUPON ASSIGNMENTS ERROR:', error);
        res.status(500).json({ errors: [{ msg: 'Lỗi máy chủ' }] });
    }
};