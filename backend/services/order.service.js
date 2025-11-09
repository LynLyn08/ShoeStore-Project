'use strict';

const db = require('../models');
const { Op } = require('sequelize'); // <<< THÊM Op

/**
 * Service xử lý toàn bộ quy trình đặt hàng trong một transaction.
 * @param {object} orderData - Dữ liệu đơn hàng.
 * @param {boolean} isGuest - Cờ xác định đây là đơn của khách hay user.
 * @returns {object} - Đơn hàng vừa được tạo.
 */
exports.placeOrderTransaction = async (orderData, isGuest = false) => {
    const t = await db.sequelize.transaction();
    try {
        // === SỬA TÊN BIẾN ĐỂ RÕ NGHĨA ===
        // Giả định totalAmount từ controller là SUBtotal (tiền hàng)
        const subtotal = Number(orderData.totalAmount) || 0;
        const shippingFee = Number(orderData.shippingFee) || 0;
        const userId = isGuest ? null : orderData.userId;
        
        // 1. Khóa và kiểm tra tồn kho (Giữ nguyên)
        for (const item of orderData.items) {
            const variant = await db.ProductVariant.findByPk(item.variantId, {
                lock: t.LOCK.UPDATE,
                transaction: t
            });
            if (!variant) throw new Error(`Sản phẩm với ID ${item.variantId} không tồn tại.`);
            if (variant.StockQuantity < item.quantity) {
                throw new Error(`Sản phẩm ${variant.SKU} không đủ số lượng tồn kho.`);
            }
        }

        // === LOGIC MỚI: XÁC THỰC COUPON VÀ TÍNH TOÁN ===
        let finalDiscount = 0;
        let finalTotalAmount = subtotal + shippingFee; // Tạm tính
        let validatedCoupon = null; // Biến lưu coupon hợp lệ

        if (orderData.couponCode) {
            const coupon = await db.Coupon.findOne({
                where: { Code: orderData.couponCode },
                lock: t.LOCK.UPDATE, // Khóa coupon lại để tránh race condition
                transaction: t
            });

            if (!coupon) {
                throw new Error('Mã giảm giá không tồn tại.');
            }

            // 2a. Kiểm tra chung
            if (new Date(coupon.ExpiryDate) < new Date()) {
                throw new Error('Mã giảm giá đã hết hạn.');
            }
            if (coupon.MaxUses > 0 && coupon.UsedCount >= coupon.MaxUses) {
                throw new Error('Mã giảm giá đã hết lượt sử dụng.');
            }
            if (subtotal < Number(coupon.MinPurchaseAmount)) {
                throw new Error(`Đơn hàng phải đạt tối thiểu ${Number(coupon.MinPurchaseAmount).toLocaleString('vi-VN')}₫ để dùng mã này.`);
            }

            // 2b. Kiểm tra riêng tư (Private) / giới hạn user
            if (!coupon.IsPublic) {
                if (isGuest) throw new Error('Mã này chỉ dành cho thành viên đã đăng nhập.');
                
                const userVoucher = await db.UserVoucher.findOne({
                    where: { UserID: userId, CouponID: coupon.CouponID },
                    transaction: t
                });
                if (!userVoucher) throw new Error('Mã này không có trong ví voucher của bạn.');
                if (userVoucher.IsUsed) throw new Error('Bạn đã sử dụng voucher này rồi.');

            } else if (coupon.UsesPerUser > 0 && !isGuest) {
                // Check public code user limit
                const userUsageCount = await db.UsageLog.count({
                    where: { CouponID: coupon.CouponID, UserID: userId },
                    transaction: t
                });
                if (userUsageCount >= coupon.UsesPerUser) {
                    throw new Error(`Bạn đã dùng mã này ${coupon.UsesPerUser} lần (tối đa).`);
                }
            }
            
            // 2c. Mọi thứ hợp lệ -> Tính toán giảm giá
            const discountValue = Number(coupon.DiscountValue);
            if (coupon.DiscountType === 'Percent') {
                finalDiscount = Math.round((subtotal * discountValue) / 100);
            } else if (coupon.DiscountType === 'FixedAmount') {
                finalDiscount = Math.min(subtotal, discountValue); // Không giảm quá tiền hàng
            }
            
            validatedCoupon = coupon; // Lưu lại coupon để ghi log
        }
        
        // Cập nhật tổng tiền cuối cùng
        finalTotalAmount = (subtotal + shippingFee) - finalDiscount;
        // === HẾT LOGIC MỚI ===


        // 3. Tạo đơn hàng (Order hoặc GuestOrder)
        let newOrder;
        const commonOrderData = {
            Subtotal: subtotal, // <<< THÊM: Lưu tiền hàng
            ShippingFee: shippingFee,
            DiscountAmount: finalDiscount, // <<< THÊM: Lưu số tiền giảm
            TotalAmount: finalTotalAmount, // <<< SỬA: Dùng tổng tiền đã tính toán lại
            CouponCode: validatedCoupon ? orderData.couponCode : null, // Chỉ lưu nếu hợp lệ
            PaymentMethod: orderData.paymentMethod,
            ShippingProvider: orderData.ShippingProvider,
            ShippingProviderID: orderData.ShippingProviderID,
            Status: 'Pending',
        };

        if (isGuest) {
            newOrder = await db.GuestOrder.create({
                ...commonOrderData,
                ...orderData.shipping, // { Email, FullName, Phone, Address }
            }, { transaction: t });
        } else {
            newOrder = await db.Order.create({
                ...commonOrderData,
                UserID: userId,
                ShippingAddressID: orderData.shippingAddressId,
            }, { transaction: t });
        }
        
        // 4. Tạo các OrderItems / GuestOrderItems (Giữ nguyên)
        const orderIdField = isGuest ? 'GuestOrderID' : 'OrderID';
        const orderItemsData = orderData.items.map(item => ({
            [orderIdField]: newOrder[orderIdField],
            VariantID: item.variantId,
            Quantity: item.quantity,
            Price: item.price
        }));
        
        const OrderItemModel = isGuest ? db.GuestOrderItem : db.OrderItem;
        await OrderItemModel.bulkCreate(orderItemsData, { transaction: t });

        // 5. Trừ tồn kho (Giữ nguyên)
        for (const item of orderData.items) {
            await db.ProductVariant.decrement('StockQuantity', {
                by: item.quantity,
                where: { VariantID: item.variantId },
                transaction: t
            });
        }
        
        // 6. Xóa sản phẩm khỏi giỏ hàng (Giữ nguyên)
        if (orderData.source !== 'buy-now') {
            const cartWhere = isGuest ? { SessionID: orderData.sessionId } : { UserID: userId };
            const cart = await db.Cart.findOne({ where: cartWhere, transaction: t });
            if (cart) {
                await db.CartItem.destroy({
                    where: {
                        CartID: cart.CartID,
                        VariantID: { [db.Sequelize.Op.in]: orderData.items.map(i => i.variantId) }
                    },
                    transaction: t
                });
            }
        }

        // 7. Ghi log sử dụng coupon (SỬA: Dùng validatedCoupon)
        if (validatedCoupon) {
            // 7a. Ghi log sử dụng
            await db.UsageLog.create({
                CouponID: validatedCoupon.CouponID,
                UserID: isGuest ? null : userId,
                OrderID: isGuest ? null : newOrder.OrderID,
                GuestOrderID: isGuest ? newOrder.GuestOrderID : null,
            }, { transaction: t });
            
            // 7b. Tăng UsedCount tổng
            // (Chúng ta dùng increment thay vì set để an toàn hơn)
            await validatedCoupon.increment('UsedCount', { by: 1, transaction: t });
            
            // 7c. KHÓA VOUCHER RIÊNG TƯ
            if (!validatedCoupon.IsPublic && !isGuest) {
                await db.UserVoucher.update({
                    IsUsed: true
                }, {
                    where: {
                        UserID: userId,
                        CouponID: validatedCoupon.CouponID
                    },
                    transaction: t
                });
            }
        }
        
        // Hoàn tất
        await t.commit();
        return newOrder;

    } catch (error) {
        await t.rollback();
        throw error; // Ném lỗi ra để controller bắt và xử lý
    }
};