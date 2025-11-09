'use strict';
const db = require('../models');
const { Sequelize, Op } = require('sequelize');

// --- Helper mới để lấy chi tiết giỏ hàng (tái sử dụng) ---
const getCartDetails = async (cartId) => {
    const productImageSubquery = `COALESCE(
        (SELECT TOP 1 pi.ImageURL FROM ProductImages pi WHERE pi.VariantID = variant.VariantID ORDER BY pi.IsDefault DESC, pi.ImageID),
        (SELECT TOP 1 pi2.ImageURL FROM ProductImages pi2 WHERE pi2.ProductID = variant.ProductID ORDER BY pi2.IsDefault DESC, pi2.ImageID),
        '/placeholder.jpg'
    )`;

    const items = await db.CartItem.findAll({
        where: { CartID: cartId },
        attributes: ['CartItemID', 'VariantID', 'Quantity', 'Price'],
        include: [{
            model: db.ProductVariant,
            as: 'variant',
            attributes: [
                'ProductID', 'Size', 'Color', 'StockQuantity',
                [Sequelize.literal(productImageSubquery), 'ProductImage']
            ],
            include: [{
                model: db.Product,
                as: 'product',
                attributes: ['Name', 'Price', 'DiscountPercent']
            }]
        }],
        order: [['CartItemID', 'DESC']]
    });
    return items;
};

/**
 * @route   GET /api/cart
 * @desc    Lấy chi tiết giỏ hàng và các sản phẩm bên trong
 * @access  Private/Guest
 */
exports.getCart = async (req, res) => {
    try {
        const cart = req.cart; // req.cart đã được middleware cung cấp
        const items = await getCartDetails(cart.CartID);

        res.json({
            success: true,
            cartId: cart.CartID,
            items: items,
        });

    } catch (error) {
        console.error("GET /api/cart error:", error);
        res.status(500).json({ success: false, message: "Lỗi máy chủ." });
    }
};

/**
 * @route   POST /api/cart/add
 * @desc    Thêm sản phẩm vào giỏ hàng
 * @access  Private/Guest
 */
exports.addItem = async (req, res) => {
    try {
        const cart = req.cart;
        const { variantId, quantity } = req.body;

        const variant = await db.ProductVariant.findByPk(variantId, {
            include: { model: db.Product, as: 'product' }
        });

        if (!variant || !variant.IsActive) {
            return res.status(404).json({ success: false, message: "Sản phẩm không tồn tại hoặc đã ngừng kinh doanh." });
        }

        const newQuantity = (parseInt(quantity, 10) || 1);
        
        const existingItem = await db.CartItem.findOne({
            where: { CartID: cart.CartID, VariantID: variantId }
        });

        // SỬA: Tính discountedPrice đúng (không dùng field undefined)
        const discountedPrice = variant.product.Price * (1 - (variant.product.DiscountPercent || 0) / 100);

        if (existingItem) {
            const totalQuantity = existingItem.Quantity + newQuantity;
            if (variant.StockQuantity < totalQuantity) {
                return res.status(400).json({ success: false, message: `Số lượng tồn kho không đủ (còn ${variant.StockQuantity}, bạn đã có ${existingItem.Quantity} trong giỏ).` });
            }
            await existingItem.increment('Quantity', { by: newQuantity });
            // SỬA: Update Price nếu cần (nếu discount thay đổi, nhưng giữ nguyên để tránh over-write)
            await existingItem.update({ Price: discountedPrice });
        } else {
            if (variant.StockQuantity < newQuantity) {
                return res.status(400).json({ success: false, message: "Số lượng tồn kho không đủ." });
            }
            await db.CartItem.create({
                CartID: cart.CartID,
                VariantID: variantId,
                Quantity: newQuantity,
                Price: discountedPrice  // SỬA: Dùng computed value
            });
        }
        
        // Luôn trả về toàn bộ giỏ hàng đã cập nhật
        const items = await getCartDetails(cart.CartID);
        res.status(200).json({ success: true, items });

    } catch (error) {
        console.error("POST /api/cart/add error:", error);
        res.status(500).json({ success: false, message: "Không thêm được vào giỏ." });
    }
};

/**
 * @route   PATCH /api/cart/item/:cartItemId
 * @desc    Cập nhật số lượng của một item trong giỏ
 * @access  Private/Guest
 */
exports.updateItem = async (req, res) => {
    try {
        const cart = req.cart;
        const cartItemId = parseInt(req.params.cartItemId, 10);
        const { quantity } = req.body;

        if (isNaN(cartItemId) || quantity <= 0) {
            return res.status(400).json({ success: false, message: "Dữ liệu không hợp lệ." });
        }
        
        const item = await db.CartItem.findOne({
            where: { CartItemID: cartItemId, CartID: cart.CartID },
            include: { 
                model: db.ProductVariant, 
                as: 'variant',
                include: { model: db.Product, as: 'product' }  // SỬA: Include để tính price mới nếu cần
            }
        });

        if (!item) {
            return res.status(404).json({ success: false, message: "Sản phẩm không có trong giỏ hàng." });
        }

        if (item.variant.StockQuantity < quantity) {
             return res.status(400).json({ success: false, message: `Số lượng tồn kho không đủ (còn ${item.variant.StockQuantity}).` });
        }

        // SỬA: Tính lại price nếu discount thay đổi (optional, để consistency)
        const discountedPrice = item.variant.product.Price * (1 - (item.variant.product.DiscountPercent || 0) / 100);
        await item.update({ 
            Quantity: quantity,
            Price: discountedPrice  // Update price để khớp current discount
        });

        // Luôn trả về toàn bộ giỏ hàng đã cập nhật
        const items = await getCartDetails(cart.CartID);
        res.json({ success: true, items });

    } catch (error) {
        console.error("PATCH /api/cart/item error:", error);
        res.status(500).json({ success: false, message: "Lỗi cập nhật sản phẩm." });
    }
};

/**
 * @route   DELETE /api/cart/item/:cartItemId
 * @desc    Xóa một item khỏi giỏ hàng
 * @access  Private/Guest
 */
exports.removeItem = async (req, res) => {
    try {
        const cart = req.cart;
        const cartItemId = parseInt(req.params.cartItemId, 10);

        if (isNaN(cartItemId)) {
            return res.status(400).json({ success: false, message: "ID sản phẩm không hợp lệ." });
        }

        await db.CartItem.destroy({
            where: {
                CartItemID: cartItemId,
                CartID: cart.CartID
            }
        });

        // Luôn trả về toàn bộ giỏ hàng đã cập nhật
        const items = await getCartDetails(cart.CartID);
        res.json({ success: true, items });

    } catch (error) {
        console.error("DELETE /api/cart/item error:", error);
        res.status(500).json({ success: false, message: "Lỗi xóa sản phẩm." });
    }
};