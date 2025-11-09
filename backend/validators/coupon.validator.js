const Joi = require('joi');

// Schema dùng cho Admin khi TẠO/SỬA Coupon
exports.couponSchema = Joi.object({
    Code: Joi.string().trim().min(3).max(50).required().messages({
        'string.empty': 'Mã coupon không được để trống.',
        'string.min': 'Mã coupon phải có ít nhất 3 ký tự.',
        'string.max': 'Mã coupon không được vượt quá 50 ký tự.',
        'any.required': 'Mã coupon là bắt buộc.'
    }),
    
    // SỬA MỚI: Dùng DiscountType và DiscountValue thay vì DiscountPercent
    DiscountType: Joi.string().valid('Percent', 'FixedAmount').required().messages({
        'any.only': 'Loại giảm giá không hợp lệ (chỉ chấp nhận Percent hoặc FixedAmount).',
        'any.required': 'Loại giảm giá là bắt buộc.'
    }),
    DiscountValue: Joi.number().min(1).required().messages({
        'number.base': 'Giá trị giảm phải là số.',
        'number.min': 'Giá trị giảm phải lớn hơn hoặc bằng 1.',
        'any.required': 'Giá trị giảm là bắt buộc.'
    }),

    MinPurchaseAmount: Joi.number().min(0).required().messages({
        'number.base': 'Giá trị đơn hàng tối thiểu phải là số.',
        'number.min': 'Giá trị đơn hàng tối thiểu không được âm.',
        'any.required': 'Giá trị đơn hàng tối thiểu là bắt buộc.'
    }),
    
    ExpiryDate: Joi.date().min('now').required().messages({
        'date.base': 'Ngày hết hạn không hợp lệ.',
        'date.min': 'Ngày hết hạn phải lớn hơn hoặc bằng ngày hiện tại.',
        'any.required': 'Ngày hết hạn là bắt buộc.'
    }),
    
    MaxUses: Joi.number().integer().min(0).default(0).messages({
        'number.base': 'Tổng lượt dùng phải là số nguyên.',
        'number.min': 'Tổng lượt dùng không được âm.'
    }),

    // THÊM MỚI: UsesPerUser và IsPublic
    UsesPerUser: Joi.number().integer().min(0).default(1).messages({
        'number.base': 'Lượt dùng/User phải là số nguyên.',
        'number.min': 'Lượt dùng/User không được âm.'
    }),
    IsPublic: Joi.boolean().default(true),
    // THÊM MỚI: Logic gửi email (tùy chọn)
    EmailTo: Joi.string().allow(null, '').optional()
});


// Schema dùng cho User khi VALIDATE Coupon ở Checkout
exports.checkCouponSchema = Joi.object({
    code: Joi.string().trim().required().messages({
        'string.empty': 'Vui lòng nhập mã coupon.',
        'any.required': 'Mã coupon là bắt buộc.'
    }),
    total: Joi.number().min(0).required().messages({
        'number.base': 'Tổng đơn hàng không hợp lệ.',
        'number.min': 'Tổng đơn hàng không được âm.',
        'any.required': 'Tổng đơn hàng là bắt buộc.'
    })
});