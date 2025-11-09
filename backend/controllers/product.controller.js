'use strict';
const db = require('../models');
const { Op, Sequelize } = require('sequelize');
const ProductService = require('../services/product.service');
const fs = require('fs');
const path = require('path');
// --- Helper Functions (dùng cho User-facing API) ---

/** Ánh xạ query 'category' sang điều kiện 'LIKE' cho Sequelize */
const mapCategoryToLike = (cat) => {
    switch ((cat || '').toLowerCase()) {
        case 'sport': return 'Giày Thể Thao%';
        case 'office': return 'Giày Công Sở%';
        case 'sandal': return 'Giày Sandal%';
        case 'sneaker': return 'Sneaker%';
        default: return null;
    }
};

/** Ánh xạ query 'sort' sang mảng 'order' của Sequelize */
const mapSortToOrder = (sort) => {
    switch ((sort || '').toLowerCase()) {
        case 'name_asc': return [['Name', 'ASC']];
        case 'name_desc': return [['Name', 'DESC']];
        case 'price_asc': return [[Sequelize.col('DiscountedPrice'), 'ASC']];
        case 'price_desc': return [[Sequelize.col('DiscountedPrice'), 'DESC']];
        default: return [['CreatedAt', 'DESC']];
    }
};

// =======================================================
// ===               CONTROLLERS CHO USER              ===
// =======================================================

/**
 * @route   GET /api/products
 * @desc    Lấy danh sách sản phẩm với filter, sort, pagination
 * @access  Public
 */
exports.getAllProducts = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page || '1', 10), 1);
        const limit = Math.max(parseInt(req.query.limit || '12', 10), 1);
        const offset = (page - 1) * limit;

        const { keyword, category, targetGroup, sort } = req.query;

        const whereProduct = {};
        if (keyword) {
            whereProduct[Op.or] = [
                { Name: { [Op.like]: `%${keyword}%` } },
                { Description: { [Op.like]: `%${keyword}%` } },
            ];
        }

        const whereCategory = {};
        const categoryLike = mapCategoryToLike(category);
        if (categoryLike) {
            whereCategory.Name = { [Op.like]: categoryLike };
        }
        if (targetGroup) {
            whereCategory.TargetGroup = targetGroup;
        }

        const order = mapSortToOrder(sort);        
        const defaultImageSubquery = `(
            COALESCE(
                (SELECT TOP 1 i.ImageURL FROM ProductImages i WHERE i.ProductID = [Product].[ProductID] AND i.IsDefault = 1 AND i.VariantID IS NOT NULL ORDER BY i.ImageID),
                (SELECT TOP 1 i2.ImageURL FROM ProductImages i2 WHERE i2.ProductID = [Product].[ProductID] AND i2.IsDefault = 1 AND (i2.VariantID IS NULL OR i2.VariantID = 0) ORDER BY i2.ImageID),
                (SELECT TOP 1 i3.ImageURL FROM ProductImages i3 WHERE i3.ProductID = [Product].[ProductID] ORDER BY i3.IsDefault DESC, i3.ImageID)
            )
        )`;

        const { count, rows } = await db.Product.findAndCountAll({
            attributes: {
                include: [
                    [Sequelize.literal(defaultImageSubquery), 'DefaultImage'],
                    'DiscountedPrice'
                ]
            },
            include: [{
                model: db.Category,
                as: 'category',
                attributes: ['Name', 'TargetGroup'], 
                where: whereCategory,
                required: Object.keys(whereCategory).length > 0 // Chỉ join khi có điều kiện lọc category
            }],
            where: whereProduct,
            order,
            limit,
            offset,
            distinct: true
        });

        res.json({ products: rows, total: count, page, limit });
    } catch (error) {
        console.error('LIST PRODUCTS ERROR:', error);
        res.status(500).send('Lỗi khi lấy danh sách sản phẩm.');
    }
};

/**
 * @route   GET /api/products/:id
 * @desc    Lấy chi tiết sản phẩm và các biến thể
 * @access  Public
 */
exports.getProductById = async (req, res) => {
    try {
        const productId = parseInt(req.params.id, 10);
        if (isNaN(productId)) return res.status(400).send('ID sản phẩm không hợp lệ.');

        const product = await db.Product.findOne({
            where: { ProductID: productId },
            include: [
                { model: db.Category, as: 'category', attributes: ['CategoryID', 'Name', 'TargetGroup'] },
                {
                    model: db.ProductVariant,
                    as: 'variants',
                    where: { IsActive: true },
                    required: false,
                    include: [{
                        model: db.ProductImage,
                        as: 'images',
                        attributes: ['ImageURL', 'IsDefault'],
                        required: false
                    }]
                }
            ]
        });

        if (!product) return res.status(404).send('Không tìm thấy sản phẩm.');
        
        const plainProduct = product.get({ plain: true });
        
        const response = {
            product: {
                ...plainProduct,
                CategoryName: plainProduct.category?.Name,
                TargetGroup: plainProduct.category?.TargetGroup,
                variants: undefined,
                category: undefined
            },
            variants: plainProduct.variants.map(v => ({
                ...v,
                ImageURL: v.images.find(img => img.IsDefault)?.ImageURL || v.images[0]?.ImageURL || null,
                Price: plainProduct.DiscountedPrice,
                images: undefined
            }))
        };
        
        res.json(response);
    } catch (error) {
        console.error('PRODUCT DETAIL ERROR:', error);
        res.status(500).send('Lỗi khi lấy chi tiết sản phẩm.');
    }
};

/**
 * @route   GET /api/products/:id/reviews
 * @desc    Lấy đánh giá của sản phẩm
 * @access  Public
 */

/**
 * @route   GET /api/products/:id/variants
 * @desc    Lấy các biến thể của sản phẩm (active only)
 * @access  Public
 */
exports.getProductVariants = async (req, res) => {
    try {
        console.log('=== DEBUG VARIANTS === ProductID:', req.params.id);  // Giữ log để debug
        const productId = parseInt(req.params.id, 10);
        if (isNaN(productId)) {
            console.log('Invalid ID');
            return res.status(400).send('ID sản phẩm không hợp lệ.');
        }

        const variants = await db.ProductVariant.findAll({
            where: { ProductID: productId, IsActive: true },
            include: [
                {
                    model: db.ProductImage,
                    as: 'images',
                    attributes: ['ImageURL', 'IsDefault'],
                    required: false
                },
                {
                    model: db.Product,  // <<< THÊM: Join với Product để lấy Price và DiscountPercent
                    as: 'product',      // Giả sử alias là 'product' (kiểm tra models/index.js nếu khác)
                    attributes: ['Price', 'DiscountPercent'],  // Chỉ lấy fields cần
                    required: true      // Bắt buộc có product
                }
            ],
            order: [['Color', 'ASC'], ['Size', 'ASC']]
        });

        console.log('Queried variants:', variants.length, 'items');

        // Map để lấy image và tính DiscountedPrice
        const variantsWithImage = variants.map(v => {
            const plain = v.get({ plain: true });
            const product = v.product.get({ plain: true });  // Lấy plain từ joined Product
            const discountedPrice = product.Price * (1 - (product.DiscountPercent || 0) / 100);  // Tính giá giảm

            const imageUrl = v.images?.find(img => img.IsDefault)?.ImageURL || v.images?.[0]?.ImageURL || null;
            console.log('Mapped variant:', plain.VariantID, 'Image:', imageUrl, 'Price:', discountedPrice);  // Log để verify

            return {
                ...plain,
                ImageURL: imageUrl,
                Price: discountedPrice,  // <<< THÊM: Set Price (number, để frontend format)
                images: undefined,
                product: undefined  // Không expose full product
            };
        });

        console.log('Final response:', variantsWithImage);
        res.json(variantsWithImage);
    } catch (error) {
        console.error('PRODUCT VARIANTS ERROR:', error);
        res.status(500).send('Lỗi khi lấy biến thể sản phẩm.');
    }
};
// =======================================================
// ===              CONTROLLERS CHO ADMIN              ===
// =======================================================

/**
 * @route   GET /api/admin/products
 * @desc    Admin lấy danh sách sản phẩm (có filter, sort)
 * @access  Private (Admin)
 */
exports.getAllProductsAdmin = async (req, res) => {
    // Hàm này từ lượt trước đã đúng logic, giữ nguyên
    try {
        const page = Math.max(1, parseInt(req.query.page || '1', 10));
        const limit = Math.max(1, parseInt(req.query.limit || '10', 10));
        const offset = (page - 1) * limit;
        const { keyword, categoryId, sortPrice } = req.query;

        const whereClause = {};
        if (keyword) {
            whereClause[Op.or] = [
                { Name: { [Op.like]: `%${keyword}%` } },
                { Description: { [Op.like]: `%${keyword}%` } }
            ];
        }
        if (categoryId) {
            whereClause.CategoryID = categoryId;
        }

        // CHỈNH SỬA: Sắp xếp theo DiscountedPrice
        const order = sortPrice
            ? [[Sequelize.literal('DiscountedPrice'), sortPrice.toUpperCase()]]
            : [['ProductID', 'ASC']];


        const { count, rows } = await db.Product.findAndCountAll({
            where: whereClause,
            include: [{ 
                model: db.Category, 
                as: 'category', 
                attributes: [['Name', 'CategoryName']] // Lấy CategoryName
            }],
            limit,
            offset,
            order,
            distinct: true,
             // Thêm các thuộc tính bạn cần hiển thị (giống file 2)
            attributes: ['ProductID', 'Name', 'Price', 'DiscountPercent', 'DiscountedPrice', 'Description', 'CategoryID']
        });

        res.json({ products: rows, total: count, page, limit });
    } catch (error) {
        console.error('ADMIN PRODUCTS LIST ERROR:', error);
        res.status(500).json({ errors: [{ msg: 'Lỗi máy chủ' }] });
    }
};

// --- Helper: Chuẩn hóa tên (Giống hệt file 2) ---
const vietnameseNormalize = (text) => {
  if (!text) return '';
  text = text.toLowerCase();
  text = text.replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
    .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
    .replace(/[ìíịỉĩ]/g, 'i')
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
    .replace(/[ùúụủũưừứựửữ]/g, 'u')
    .replace(/[ỳýỵỷỹ]/g, 'y')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, '');
  return text;
};

/**
 * @route   GET /api/admin/products/:id
 * @desc    Admin lấy chi tiết một sản phẩm (Logic từ file 2)
 * @access  Private (Admin)
 */
exports.getProductByIdAdmin = async (req, res) => {
    try {
        const product = await db.Product.findByPk(req.params.id, {
            include: [
                { model: db.Category, as: 'category', attributes: ['Name'] },
                { 
                    model: db.ProductVariant, 
                    as: 'variants', 
                    where: { IsActive: true }, // Chỉ lấy variant active
                    required: false 
                },
                { model: db.ProductImage, as: 'images' } // Lấy tất cả ảnh
            ]
        });

        if (!product) return res.status(404).json({ errors: [{ msg: 'Không tìm thấy sản phẩm' }] });

        const plainProduct = product.get({ plain: true });
        
        // Xử lý ảnh (Giống hệt logic file 2)
        const colorImages = {};
        const generalImages = [];

        (plainProduct.images || []).forEach(img => {
            if (img.VariantID) {
                // Đây là ảnh theo màu
                const matchingVariant = (plainProduct.variants || []).find(v => v.VariantID === img.VariantID);
                if (matchingVariant && !colorImages[matchingVariant.Color]) {
                    // Chỉ lấy ảnh đầu tiên cho mỗi màu
                    colorImages[matchingVariant.Color] = img.ImageURL;
                }
            } else {
                // Đây là ảnh chung
                generalImages.push(img);
            }
        });
        
        // Tạo response giống hệt file 2
        res.json({
            product: {
                ...plainProduct,
                CategoryName: plainProduct.category?.Name, // Thêm CategoryName
                variants: undefined, // Xóa đi để response gọn
                images: undefined,
                category: undefined
            },
            variants: plainProduct.variants, // Chỉ trả về variant
            images: generalImages, // Chỉ trả về ảnh chung
            colorImages: colorImages // Trả về ảnh theo màu
        });

    } catch (error) {
        console.error('ADMIN PRODUCT DETAIL ERROR:', error);
        res.status(500).json({ errors: [{ msg: 'Lỗi máy chủ' }] });
    }
};

/**
 * @route   POST /api/admin/products
 * @desc    Admin tạo sản phẩm mới (Logic từ file 2)
 * @access  Private (Admin)
 */
exports.createProduct = async (req, res) => {
    try {
        // 1. Lấy data (giống file 1, bản "cũ")
        const { name, price, discountPercent, description, categoryId, variants } = req.body;
        
        // 2. Chuẩn bị data cho service
        const productData = {
            Name: name,
            Price: parseFloat(price),
            DiscountPercent: parseInt(discountPercent) || 0,
            Description: description || null,
            CategoryID: parseInt(categoryId)
        };
        const variantsData = variants || [];
        // 3. Gọi Service (từ file 1)
        const newProduct = await ProductService.createProductWithDetails(
            productData, 
            variantsData, 
            req.files // Truyền files vào
        );
        
        res.status(201).json({ message: 'Thêm sản phẩm thành công', productId: newProduct.ProductID });

    } catch (error) {
        await (await db.sequelize.transaction()).rollback(); // Rollback nếu service có lỗi
        console.error('ADMIN ADD PRODUCT ERROR:', error);
        
        // Xóa file đã upload nếu lỗi
        if (req.files) {
            req.files.forEach(file => {
                const imagePath = path.join(__dirname, '../../', 'uploads', file.filename);
                if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
            });
        }
        if (error.statusCode === 409) {
            return res.status(409).json({ errors: [{ msg: error.message }] });
        }
        res.status(500).json({ errors: [{ msg: error.message || 'Lỗi máy chủ' }] });
    }
};

/**
 * @route   PUT /api/admin/products/:id
 * @desc    Admin cập nhật sản phẩm (Logic từ file 2)
 * @access  Private (Admin)
 */
exports.updateProduct = async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const { 
        name, price, discountPercent, description, categoryId, 
        variants, existingImages, existingColorImages 
    } = req.body;
    
    const transaction = await db.sequelize.transaction();

    try {
        // 1. Cập nhật thông tin Product
        await db.Product.update({
            Name: name,
            Price: parseFloat(price),
            DiscountPercent: parseInt(discountPercent) || 0,
            Description: description || null,
            CategoryID: parseInt(categoryId)
        }, { where: { ProductID: id }, transaction });

        // 2. Lấy ảnh cũ để xóa file
        const oldImages = await db.ProductImage.findAll({
            where: { ProductID: id },
            attributes: ['ImageURL'],
            raw: true
        });

        // Xóa hết ảnh cũ trong DB (sẽ tạo lại ở bước 5)
        await db.ProductImage.destroy({ where: { ProductID: id }, transaction });

        // 3. Xử lý Biến thể (Upsert)
        const parsedVariants = variants || [];
        if (parsedVariants.length === 0) {
            throw new Error('Phải có ít nhất một biến thể');
        }

        const oldVariants = await db.ProductVariant.findAll({
            where: { ProductID: id },
            raw: true
        });
        const oldVariantMap = new Map(oldVariants.map(v => [`${v.Size}-${vietnameseNormalize(v.Color)}`, v.VariantID]));
        const colorToVariants = new Map(); // Map cho ảnh
        const activeVariantIds = [];

        for (const variant of parsedVariants) {
            const key = `${variant.size}-${vietnameseNormalize(variant.color)}`;
            const sku = `${id}-${variant.size}-${variant.color.replace(/\s/g, '')}-${Date.now()}`;
            let variantId;

            if (oldVariantMap.has(key)) {
                // Cập nhật variant cũ
                variantId = oldVariantMap.get(key);
                await db.ProductVariant.update({
                    StockQuantity: parseInt(variant.stockQuantity),
                    SKU: sku,
                    IsActive: true // Kích hoạt lại
                }, { where: { VariantID: variantId }, transaction });
                
                oldVariantMap.delete(key); // Xóa khỏi map để biết cái nào cần deactivate
            } else {
                // Tạo variant mới
                const newVariant = await db.ProductVariant.create({
                    ProductID: id,
                    Size: variant.size,
                    Color: variant.color,
                    StockQuantity: parseInt(variant.stockQuantity),
                    SKU: sku,
                    IsActive: true
                }, { transaction });
                variantId = newVariant.VariantID;
            }
            
            activeVariantIds.push(variantId);

            // Build map cho ảnh (Giống file 2)
            const colorKey = vietnameseNormalize(variant.color);
            if (!colorToVariants.has(colorKey)) {
                colorToVariants.set(colorKey, []);
            }
            colorToVariants.get(colorKey).push(variantId);
        }

        // 4. Deactivate các variant cũ không còn dùng
        const variantsToDeactivate = Array.from(oldVariantMap.values());
        if (variantsToDeactivate.length > 0) {
            await db.ProductVariant.update(
                { IsActive: 0 },
                { where: { VariantID: { [Op.in]: variantsToDeactivate } }, transaction }
            );
        }

        // 5. Thêm lại ảnh
        const keptImagePaths = []; // Theo dõi file để không xóa

        // 5a. Ảnh theo màu (existing)
        const parsedExistingColorImages = JSON.parse(existingColorImages || '{}');
        for (const [rawColor, imagePath] of Object.entries(parsedExistingColorImages)) {
            const normColor = vietnameseNormalize(rawColor);
            if (colorToVariants.has(normColor) && imagePath) {
                const repVariantId = colorToVariants.get(normColor)[0];
                await db.ProductImage.create({
                    ProductID: id,
                    VariantID: repVariantId,
                    ImageURL: imagePath,
                    IsDefault: true
                }, { transaction });
                keptImagePaths.push(imagePath);
            }
        }
        
        // 5b. Ảnh chung (existing)
        const parsedExistingImages = JSON.parse(existingImages || '[]');
        for (const imagePath of parsedExistingImages) {
             await db.ProductImage.create({
                ProductID: id,
                VariantID: null,
                ImageURL: imagePath,
                IsDefault: false // (Cần logic set 1 cái là true)
            }, { transaction });
            keptImagePaths.push(imagePath);
        }

        // 5c. Ảnh mới (từ req.files)
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const imageUrl = `/uploads/${file.filename}`;
                keptImagePaths.push(imageUrl); // File mới nên cũng giữ lại

                if (file.fieldname.startsWith('colorImage_')) {
                    const rawColor = file.fieldname.replace('colorImage_', '');
                    const normColor = vietnameseNormalize(rawColor);
                    if (colorToVariants.has(normColor)) {
                        const repVariantId = colorToVariants.get(normColor)[0];
                        await db.ProductImage.create({
                            ProductID: id,
                            VariantID: repVariantId,
                            ImageURL: imageUrl,
                            IsDefault: true
                        }, { transaction });
                    }
                } else if (file.fieldname === 'images') {
                    await db.ProductImage.create({
                        ProductID: id,
                        VariantID: null,
                        ImageURL: imageUrl,
                        IsDefault: false
                    }, { transaction });
                }
            }
        }

        // 6. Xóa file ảnh cũ không còn dùng
        for (const oldImg of oldImages) {
            if (!keptImagePaths.includes(oldImg.ImageURL)) {
                const imagePath = path.join(__dirname, '../../', oldImg.ImageURL.startsWith('/') ? oldImg.ImageURL : `uploads/${oldImg.ImageURL}`);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            }
        }

        await transaction.commit();
        res.json({ message: 'Cập nhật sản phẩm thành công' });

    } catch (error) {
        await transaction.rollback();
        console.error('ADMIN UPDATE PRODUCT ERROR:', error);
        // Xóa file mới upload nếu lỗi
        if (req.files) {
            req.files.forEach(file => {
                const imagePath = path.join(__dirname, '../../', 'uploads', file.filename);
                if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
            });
        }
        res.status(500).json({ errors: [{ msg: error.message || 'Lỗi máy chủ' }] });
    }
};

/**
 * @route   DELETE /api/admin/products/:id
 * @desc    Admin xóa một sản phẩm (Logic từ file 2)
 * @access  Private (Admin)
 */
exports.deleteProduct = async (req, res) => {
    try {
        // SỬA: Chỉ cần gọi service (từ file 1)
        await ProductService.deleteProductAndDependencies(req.params.id);
        res.json({ message: 'Xóa sản phẩm thành công' });
    } catch (error) {
        console.error('ADMIN DELETE PRODUCT ERROR:', error);
        // Service (file 1) đã ném lỗi này
        if (error.message.includes('đơn hàng hoặc giỏ hàng')) {
            return res.status(409).json({ errors: [{ msg: error.message }] });
        }
        res.status(500).json({ errors: [{ msg: error.message || 'Lỗi máy chủ' }] });
    }
};