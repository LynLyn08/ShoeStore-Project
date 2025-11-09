'use strict';
const db = require('../models');
const { Op, Sequelize } = require('sequelize');
const { endOfDay } = require('date-fns');
const dotenv = require("dotenv");
dotenv.config();
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

// =======================================================
// ===           CONTROLLERS CHO USER (PUBLIC)         ===
// =======================================================

exports.getProductReviews = async (req, res) => {
    try {
        const productId = req.params.productId;
        const page = Math.max(1, parseInt(req.query.page || '1', 10));
        const limit = Math.max(1, parseInt(req.query.limit || '5', 10));
        const offset = (page - 1) * limit;

        const { count, rows } = await db.Review.findAndCountAll({
            where: { ProductID: productId },
            include: [
                {
                    model: db.User,
                    as: 'user',
                    attributes: ['FullName', 'AvatarURL']
                },
                {
                    model: db.ReviewMedia,
                    as: 'media',
                    attributes: ['MediaURL', 'IsVideo']
                }
            ],
            limit,
            offset,
            order: [['CreatedAt', 'DESC']],
            distinct: true
        });

        const processedReviews = rows.map(review => {
            const plainReview = review.get({ plain: true });
            if (plainReview.user && plainReview.user.AvatarURL) {
                if(!plainReview.user.AvatarURL.startsWith('http')) {
                     plainReview.user.AvatarURL = `${BASE_URL}${plainReview.user.AvatarURL}`;
                }
            }
            if (plainReview.media) {
                plainReview.media = plainReview.media.map(m => ({
                    ...m,
                    MediaURL: `${BASE_URL}${m.MediaURL}`
                }));
            }
            return plainReview;
        });

        const stats = await db.Review.findAll({
            where: { ProductID: productId },
            attributes: [
                'Rating',
                [Sequelize.fn('COUNT', Sequelize.col('Rating')), 'count']
            ],
            group: ['Rating']
        });

        const totalReviews = stats.reduce((acc, stat) => acc + parseInt(stat.get('count'), 10), 0);
        const totalRating = stats.reduce((acc, stat) => acc + (stat.Rating * parseInt(stat.get('count'), 10)), 0);
        const averageRating = totalReviews > 0 ? (totalRating / totalReviews) : 0;

        const ratingSummary = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };
        stats.forEach(stat => {
            ratingSummary[stat.Rating] = parseInt(stat.get('count'), 10);
        });

        res.json({
            reviews: processedReviews,
            total: count,
            page,
            limit,
            statistics: {
                totalReviews,
                averageRating: parseFloat(averageRating.toFixed(1)),
                ratingSummary
            }
        });

    } catch (error) {
        console.error('GET PRODUCT REVIEWS ERROR:', error);
        res.status(500).json({ errors: [{ msg: 'Lỗi máy chủ' }] });
    }
};

/**
 * @route   POST /api/products/:productId/reviews
 * @desc    User tạo một đánh giá mới (kèm media)
 * @access  Private
 */
exports.createReview = async (req, res) => {
    const t = await db.sequelize.transaction();
    try {
        const userId = req.user.id;
        const productId = req.params.productId;
        const { rating, comment } = req.body;

        // === SỬA LỖI TRUY VẤN (TƯƠNG TỰ checkReviewEligibility) ===
        const eligibleItem = await db.OrderItem.findOne({
            include: [
                {
                    model: db.ProductVariant,
                    as: 'variant',
                    where: { ProductID: productId },
                    attributes: [],
                    required: true
                },
                {
                    model: db.Order,
                    as: 'order',
                    where: {
                        UserID: userId,
                        Status: 'Delivered'
                    },
                    attributes: [],
                    required: true
                }
            ]
        });

        if (!eligibleItem) {
            return res.status(403).json({ errors: [{ msg: 'Bạn chỉ có thể đánh giá sản phẩm đã mua và nhận hàng thành công.' }] });
        }
        // === KẾT THÚC SỬA LỖI TRUY VẤN ===

        const newReview = await db.Review.create({
            UserID: userId,
            ProductID: productId,
            Rating: rating,
            Comment: comment
        }, { transaction: t });

        if (req.files && req.files.length > 0) {
            const mediaData = req.files.map(file => ({
                ReviewID: newReview.ReviewID,
                MediaURL: `/uploads/${file.filename}`,
                IsVideo: file.mimetype.startsWith('video/')
            }));
            await db.ReviewMedia.bulkCreate(mediaData, { transaction: t });
        }

        await t.commit();
        
        const finalReview = await db.Review.findByPk(newReview.ReviewID, {
             include: [
                { model: db.User, as: 'user', attributes: ['FullName', 'AvatarURL'] },
                { model: db.ReviewMedia, as: 'media', attributes: ['MediaURL', 'IsVideo'] }
            ]
        });
        
        res.status(201).json(finalReview);

    } catch (error) {
        await t.rollback();
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ errors: [{ msg: 'Bạn đã đánh giá sản phẩm này rồi.' }] });
        }
        console.error('CREATE REVIEW ERROR:', error);
        res.status(500).json({ errors: [{ msg: 'Lỗi máy chủ' }] });
    }
};

/**
 * @route   GET /api/products/:productId/check-review
 * @desc    Kiểm tra xem user có quyền đánh giá sản phẩm này không
 * @access  Private
 */
exports.checkReviewEligibility = async (req, res) => {
    try {
        const userId = req.user.id;
        const productId = req.params.productId; // Đây là 'undefined'

        // Thêm kiểm tra
        if (!productId || productId === 'undefined') {
             return res.status(400).json({ errors: [{ msg: 'ProductID không hợp lệ.' }] });
        }

        // 1. Kiểm tra xem đã mua chưa
        const purchasedItem = await db.OrderItem.findOne({
            include: [
                {
                    model: db.ProductVariant,
                    as: 'variant',
                    where: { ProductID: productId },
                    attributes: [],
                    required: true
                },
                {
                    model: db.Order,
                    as: 'order',
                    where: {
                        UserID: userId,
                        Status: 'Delivered'
                    },
                    attributes: [],
                    required: true
                }
            ]
        });

        // 2. Kiểm tra xem đã review chưa
        const reviewed = await db.Review.findOne({
            where: { UserID: userId, ProductID: productId }
        });

        res.json({
            hasPurchased: !!purchasedItem,
            hasReviewed: !!reviewed,
            canReview: !!purchasedItem && !reviewed
        });

    } catch (error) {
        console.error('CHECK REVIEW ELIGIBILITY ERROR:', error);
        res.status(500).json({ errors: [{ msg: 'Lỗi máy chủ' }] });
    }
};
// =======================================================
// ===           CONTROLLERS CHO ADMIN                 ===
// =======================================================

exports.getAllReviewsAdmin = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page || '1', 10));
        const limit = Math.max(1, parseInt(req.query.limit || '10', 10));
        const offset = (page - 1) * limit;
        const { keyword, rating, startDate, endDate } = req.query;

        const whereClause = {};
        
        if (rating && rating !== 'all' && !isNaN(parseInt(rating))) {
            whereClause.Rating = parseInt(rating);
        }
        
        if (startDate && endDate) {
            whereClause.CreatedAt = { [Op.between]: [new Date(startDate), endOfDay(new Date(endDate))] };
        } else if (startDate) {
            whereClause.CreatedAt = { [Op.gte]: new Date(startDate) };
        } else if (endDate) {
            whereClause.CreatedAt = { [Op.lte]: endOfDay(new Date(endDate)) };
        }
        
        if (keyword) {
            whereClause[Op.or] = [
                { Comment: { [Op.like]: `%${keyword}%` } },
                { '$user.FullName$': { [Op.like]: `%${keyword}%` } },
                { '$product.Name$': { [Op.like]: `%${keyword}%` } }
            ];
        }

        const { count, rows } = await db.Review.findAndCountAll({
            where: whereClause,
            include: [
                // SỬA: Thêm 'required: true' để đảm bảo JOIN hoạt động cho Op.or
                { model: db.User, as: 'user', attributes: ['UserID', 'FullName', 'Email', 'AvatarURL'], required: true },
                { model: db.Product, as: 'product', attributes: ['ProductID', 'Name'], required: true },
                // Media là tùy chọn, không cần required
                { model: db.ReviewMedia, as: 'media', attributes: ['MediaURL', 'IsVideo'], required: false }
            ],
            limit,
            offset,
            order: [['CreatedAt', 'DESC']],
            distinct: true
        });

        const processedReviews = rows.map(review => {
            const plainReview = review.get({ plain: true });
            if (plainReview.user && plainReview.user.AvatarURL) {
                 if(!plainReview.user.AvatarURL.startsWith('http')) {
                    plainReview.user.AvatarURL = `${BASE_URL}${plainReview.user.AvatarURL}`;
                 }
            }
            if (plainReview.media) {
                plainReview.media = plainReview.media.map(m => ({
                    ...m,
                    MediaURL: `${BASE_URL}${m.MediaURL}`
                }));
            }
            return plainReview;
        });

        res.json({ reviews: processedReviews, total: count, page, limit });

    } catch (error) {
        console.error('ADMIN REVIEWS LIST ERROR:', error);
        res.status(500).json({ errors: [{ msg: 'Lỗi máy chủ' }] });
    }
};

exports.getReviewByIdAdmin = async (req, res) => {
    try {
        const review = await db.Review.findByPk(req.params.id, {
            include: [
                { model: db.User, as: 'user', attributes: ['UserID', 'FullName', 'Email', 'AvatarURL'] },
                { model: db.Product, as: 'product', attributes: ['ProductID', 'Name'] },
                { model: db.ReviewMedia, as: 'media', attributes: ['MediaURL', 'IsVideo'] }
            ]
        });

        if (!review) {
            return res.status(404).json({ errors: [{ msg: 'Không tìm thấy đánh giá' }] });
        }
        
        const plainReview = review.get({ plain: true });
        if (plainReview.user && plainReview.user.AvatarURL) {
             if(!plainReview.user.AvatarURL.startsWith('http')) {
                plainReview.user.AvatarURL = `${BASE_URL}${plainReview.user.AvatarURL}`;
             }
        }
        if (plainReview.media) {
            plainReview.media = plainReview.media.map(m => ({
                ...m,
                MediaURL: `${BASE_URL}${m.MediaURL}`
            }));
        }

        res.json(plainReview);
    } catch (error) {
        console.error('ADMIN GET REVIEW DETAIL ERROR:', error);
        res.status(500).json({ errors: [{ msg: 'Lỗi máy chủ' }] });
    }
};

exports.deleteReview = async (req, res) => {
    try {
        const review = await db.Review.findByPk(req.params.id);
        if (!review) {
             return res.status(404).json({ errors: [{ msg: 'Không tìm thấy đánh giá để xóa' }] });
        }
        
        await db.ReviewMedia.destroy({ where: { ReviewID: req.params.id } });
        
        await review.destroy();
        
        res.json({ message: 'Xóa đánh giá thành công' });
    } catch (error) {
        console.error('ADMIN DELETE REVIEW ERROR:', error);
        res.status(500).json({ errors: [{ msg: 'Lỗi máy chủ' }] });
    }
};