//backend/seeders/20251017175733-demo-products-variants-images.js
'use strict';

/**
 * Helper function to generate variants for a list of products.
 * @param {Array} products - Array of product objects { ProductID, Name }.
 * @param {Array<string>} sizes - Array of sizes, e.g., ['39', '40'].
 * @param {Array<string>} colors - Array of colors, e.g., ['Đen', 'Trắng'].
 * @param {string} skuPrefix - The prefix for the SKU, e.g., 'SPORTM'.
 * @returns {Array} - A flat array of variant objects to be inserted.
 */
const generateVariants = (products, sizes, colors, skuPrefix) => {
  const variants = [];
  products.forEach((product, index) => {
    const counter = index + 1;
    sizes.forEach(size => {
      colors.forEach(color => {
        const colorCode = color === 'Đen' ? 'BLACK' : 'WHITE';
        variants.push({
          ProductID: product.ProductID,
          Size: size,
          Color: color,
          StockQuantity: 10, // Default stock
          SKU: `${skuPrefix}${counter}-${size}-${colorCode}`,
          IsActive: true,
        });
      });
    });
  });
  return variants;
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // --- Lấy Category IDs ---
      const categories = await queryInterface.sequelize.query(
        "SELECT CategoryID, Name FROM Categories", {
          type: queryInterface.sequelize.QueryTypes.SELECT,
          transaction
        }
      );
      const categoryMap = categories.reduce((map, cat) => {
        map[cat.Name] = cat.CategoryID;
        return map;
      }, {});

      // --- 1. Seed Products ---
      const allProducts = [
        // Sport Men (10 products)
        { Name: 'Giày Thể Thao Nam Model 001', Description: 'Giày thể thao nam phong cách hiện đại.', Price: 2500000, DiscountPercent: 5, CategoryID: categoryMap['Giày Thể Thao Nam'] },
        { Name: 'Giày Thể Thao Nam Model 002', Description: 'Giày thể thao nam thoải mái và bền bỉ.', Price: 2600000, DiscountPercent: 10, CategoryID: categoryMap['Giày Thể Thao Nam'] },
        { Name: 'Giày Thể Thao Nam Model 003', Description: 'Giày thể thao nam thời trang.', Price: 2700000, DiscountPercent: 0, CategoryID: categoryMap['Giày Thể Thao Nam'] },
        { Name: 'Giày Thể Thao Nam Model 004', Description: 'Giày thể thao nam năng động.', Price: 2400000, DiscountPercent: 8, CategoryID: categoryMap['Giày Thể Thao Nam'] },
        { Name: 'Giày Thể Thao Nam Model 005', Description: 'Giày thể thao nam chất lượng cao.', Price: 2800000, DiscountPercent: 15, CategoryID: categoryMap['Giày Thể Thao Nam'] },
        { Name: 'Giày Thể Thao Nam Model 006', Description: 'Giày thể thao nam phong cách thể thao.', Price: 2550000, DiscountPercent: 5, CategoryID: categoryMap['Giày Thể Thao Nam'] },
        { Name: 'Giày Thể Thao Nam Model 007', Description: 'Giày thể thao nam thiết kế độc đáo.', Price: 2650000, DiscountPercent: 10, CategoryID: categoryMap['Giày Thể Thao Nam'] },
        { Name: 'Giày Thể Thao Nam Model 008', Description: 'Giày thể thao nam tiện dụng.', Price: 2450000, DiscountPercent: 0, CategoryID: categoryMap['Giày Thể Thao Nam'] },
        { Name: 'Giày Thể Thao Nam Model 009', Description: 'Giày thể thao nam cao cấp.', Price: 2900000, DiscountPercent: 20, CategoryID: categoryMap['Giày Thể Thao Nam'] },
        { Name: 'Giày Thể Thao Nam Model 010', Description: 'Giày thể thao nam thời thượng.', Price: 2750000, DiscountPercent: 12, CategoryID: categoryMap['Giày Thể Thao Nam'] },
        
        // Sport Women (10 products)
        { Name: 'Giày Thể Thao Nữ Model 001', Description: 'Giày thể thao nữ phong cách hiện đại.', Price: 2500000, DiscountPercent: 5, CategoryID: categoryMap['Giày Thể Thao Nữ'] },
        { Name: 'Giày Thể Thao Nữ Model 002', Description: 'Giày thể thao nữ thoải mái và bền bỉ.', Price: 2600000, DiscountPercent: 10, CategoryID: categoryMap['Giày Thể Thao Nữ'] },
        { Name: 'Giày Thể Thao Nữ Model 003', Description: 'Giày thể thao nữ thời trang.', Price: 2700000, DiscountPercent: 0, CategoryID: categoryMap['Giày Thể Thao Nữ'] },
        { Name: 'Giày Thể Thao Nữ Model 004', Description: 'Giày thể thao nữ năng động.', Price: 2400000, DiscountPercent: 8, CategoryID: categoryMap['Giày Thể Thao Nữ'] },
        { Name: 'Giày Thể Thao Nữ Model 005', Description: 'Giày thể thao nữ chất lượng cao.', Price: 2800000, DiscountPercent: 15, CategoryID: categoryMap['Giày Thể Thao Nữ'] },
        { Name: 'Giày Thể Thao Nữ Model 006', Description: 'Giày thể thao nữ phong cách thể thao.', Price: 2550000, DiscountPercent: 5, CategoryID: categoryMap['Giày Thể Thao Nữ'] },
        { Name: 'Giày Thể Thao Nữ Model 007', Description: 'Giày thể thao nữ thiết kế độc đáo.', Price: 2650000, DiscountPercent: 10, CategoryID: categoryMap['Giày Thể Thao Nữ'] },
        { Name: 'Giày Thể Thao Nữ Model 008', Description: 'Giày thể thao nữ tiện dụng.', Price: 2450000, DiscountPercent: 0, CategoryID: categoryMap['Giày Thể Thao Nữ'] },
        { Name: 'Giày Thể Thao Nữ Model 009', Description: 'Giày thể thao nữ cao cấp.', Price: 2900000, DiscountPercent: 20, CategoryID: categoryMap['Giày Thể Thao Nữ'] },
        { Name: 'Giày Thể Thao Nữ Model 010', Description: 'Giày thể thao nữ thời thượng.', Price: 2750000, DiscountPercent: 12, CategoryID: categoryMap['Giày Thể Thao Nữ'] },

        // Office Men (10 products)
        { Name: 'Giày Công Sở Nam Model 001', Description: 'Giày công sở nam phong cách lịch lãm.', Price: 1500000, DiscountPercent: 5, CategoryID: categoryMap['Giày Công Sở Nam'] },
        { Name: 'Giày Công Sở Nam Model 002', Description: 'Giày công sở nam thoải mái và bền.', Price: 1600000, DiscountPercent: 10, CategoryID: categoryMap['Giày Công Sở Nam'] },
        { Name: 'Giày Công Sở Nam Model 003', Description: 'Giày công sở nam thời trang.', Price: 1700000, DiscountPercent: 0, CategoryID: categoryMap['Giày Công Sở Nam'] },
        { Name: 'Giày Công Sở Nam Model 004', Description: 'Giày công sở nam sang trọng.', Price: 1400000, DiscountPercent: 8, CategoryID: categoryMap['Giày Công Sở Nam'] },
        { Name: 'Giày Công Sở Nam Model 005', Description: 'Giày công sở nam chất lượng cao.', Price: 1800000, DiscountPercent: 15, CategoryID: categoryMap['Giày Công Sở Nam'] },
        { Name: 'Giày Công Sở Nam Model 006', Description: 'Giày công sở nam phong cách hiện đại.', Price: 1550000, DiscountPercent: 5, CategoryID: categoryMap['Giày Công Sở Nam'] },
        { Name: 'Giày Công Sở Nam Model 007', Description: 'Giày công sở nam thiết kế độc đáo.', Price: 1650000, DiscountPercent: 10, CategoryID: categoryMap['Giày Công Sở Nam'] },
        { Name: 'Giày Công Sở Nam Model 008', Description: 'Giày công sở nam tiện dụng.', Price: 1450000, DiscountPercent: 0, CategoryID: categoryMap['Giày Công Sở Nam'] },
        { Name: 'Giày Công Sở Nam Model 009', Description: 'Giày công sở nam cao cấp.', Price: 1900000, DiscountPercent: 20, CategoryID: categoryMap['Giày Công Sở Nam'] },
        { Name: 'Giày Công Sở Nam Model 010', Description: 'Giày công sở nam thời thượng.', Price: 1750000, DiscountPercent: 12, CategoryID: categoryMap['Giày Công Sở Nam'] },
        
        // Office Women (10 products)
        { Name: 'Giày Công Sở Nữ Model 001', Description: 'Giày công sở nữ phong cách thanh lịch.', Price: 1400000, DiscountPercent: 5, CategoryID: categoryMap['Giày Công Sở Nữ'] },
        { Name: 'Giày Công Sở Nữ Model 002', Description: 'Giày công sở nữ thoải mái và bền.', Price: 1500000, DiscountPercent: 10, CategoryID: categoryMap['Giày Công Sở Nữ'] },
        { Name: 'Giày Công Sở Nữ Model 003', Description: 'Giày công sở nữ thời trang.', Price: 1600000, DiscountPercent: 0, CategoryID: categoryMap['Giày Công Sở Nữ'] },
        { Name: 'Giày Công Sở Nữ Model 004', Description: 'Giày công sở nữ sang trọng.', Price: 1300000, DiscountPercent: 8, CategoryID: categoryMap['Giày Công Sở Nữ'] },
        { Name: 'Giày Công Sở Nữ Model 005', Description: 'Giày công sở nữ chất lượng cao.', Price: 1700000, DiscountPercent: 15, CategoryID: categoryMap['Giày Công Sở Nữ'] },
        { Name: 'Giày Công Sở Nữ Model 006', Description: 'Giày công sở nữ phong cách hiện đại.', Price: 1450000, DiscountPercent: 5, CategoryID: categoryMap['Giày Công Sở Nữ'] },
        { Name: 'Giày Công Sở Nữ Model 007', Description: 'Giày công sở nữ thiết kế độc đáo.', Price: 1550000, DiscountPercent: 10, CategoryID: categoryMap['Giày Công Sở Nữ'] },
        { Name: 'Giày Công Sở Nữ Model 008', Description: 'Giày công sở nữ tiện dụng.', Price: 1350000, DiscountPercent: 0, CategoryID: categoryMap['Giày Công Sở Nữ'] },
        { Name: 'Giày Công Sở Nữ Model 009', Description: 'Giày công sở nữ cao cấp.', Price: 1800000, DiscountPercent: 20, CategoryID: categoryMap['Giày Công Sở Nữ'] },
        { Name: 'Giày Công Sở Nữ Model 010', Description: 'Giày công sở nữ thời thượng.', Price: 1650000, DiscountPercent: 12, CategoryID: categoryMap['Giày Công Sở Nữ'] },
        
        // Sandal Men (10 products)
        { Name: 'Giày Sandal Nam Model 001', Description: 'Giày sandal nam phong cách năng động.', Price: 800000, DiscountPercent: 5, CategoryID: categoryMap['Giày Sandal Nam'] },
        { Name: 'Giày Sandal Nam Model 002', Description: 'Giày sandal nam thoải mái và bền.', Price: 850000, DiscountPercent: 10, CategoryID: categoryMap['Giày Sandal Nam'] },
        { Name: 'Giày Sandal Nam Model 003', Description: 'Giày sandal nam thời trang.', Price: 900000, DiscountPercent: 0, CategoryID: categoryMap['Giày Sandal Nam'] },
        { Name: 'Giày Sandal Nam Model 004', Description: 'Giày sandal nam tiện dụng.', Price: 750000, DiscountPercent: 8, CategoryID: categoryMap['Giày Sandal Nam'] },
        { Name: 'Giày Sandal Nam Model 005', Description: 'Giày sandal nam chất lượng cao.', Price: 950000, DiscountPercent: 15, CategoryID: categoryMap['Giày Sandal Nam'] },
        { Name: 'Giày Sandal Nam Model 006', Description: 'Giày sandal nam phong cách hiện đại.', Price: 820000, DiscountPercent: 5, CategoryID: categoryMap['Giày Sandal Nam'] },
        { Name: 'Giày Sandal Nam Model 007', Description: 'Giày sandal nam thiết kế độc đáo.', Price: 870000, DiscountPercent: 10, CategoryID: categoryMap['Giày Sandal Nam'] },
        { Name: 'Giày Sandal Nam Model 008', Description: 'Giày sandal nam thoải mái.', Price: 780000, DiscountPercent: 0, CategoryID: categoryMap['Giày Sandal Nam'] },
        { Name: 'Giày Sandal Nam Model 009', Description: 'Giày sandal nam cao cấp.', Price: 1000000, DiscountPercent: 20, CategoryID: categoryMap['Giày Sandal Nam'] },
        { Name: 'Giày Sandal Nam Model 010', Description: 'Giày sandal nam thời thượng.', Price: 920000, DiscountPercent: 12, CategoryID: categoryMap['Giày Sandal Nam'] },
        
        // Sandal Women (10 products)
        { Name: 'Giày Sandal Nữ Model 001', Description: 'Giày sandal nữ phong cách thanh lịch.', Price: 700000, DiscountPercent: 5, CategoryID: categoryMap['Giày Sandal Nữ'] },
        { Name: 'Giày Sandal Nữ Model 002', Description: 'Giày sandal nữ thoải mái và bền.', Price: 750000, DiscountPercent: 10, CategoryID: categoryMap['Giày Sandal Nữ'] },
        { Name: 'Giày Sandal Nữ Model 003', Description: 'Giày sandal nữ thời trang.', Price: 800000, DiscountPercent: 0, CategoryID: categoryMap['Giày Sandal Nữ'] },
        { Name: 'Giày Sandal Nữ Model 004', Description: 'Giày sandal nữ tiện dụng.', Price: 650000, DiscountPercent: 8, CategoryID: categoryMap['Giày Sandal Nữ'] },
        { Name: 'Giày Sandal Nữ Model 005', Description: 'Giày sandal nữ chất lượng cao.', Price: 850000, DiscountPercent: 15, CategoryID: categoryMap['Giày Sandal Nữ'] },
        { Name: 'Giày Sandal Nữ Model 006', Description: 'Giày sandal nữ phong cách hiện đại.', Price: 720000, DiscountPercent: 5, CategoryID: categoryMap['Giày Sandal Nữ'] },
        { Name: 'Giày Sandal Nữ Model 007', Description: 'Giày sandal nữ thiết kế độc đáo.', Price: 770000, DiscountPercent: 10, CategoryID: categoryMap['Giày Sandal Nữ'] },
        { Name: 'Giày Sandal Nữ Model 008', Description: 'Giày sandal nữ thoải mái.', Price: 680000, DiscountPercent: 0, CategoryID: categoryMap['Giày Sandal Nữ'] },
        { Name: 'Giày Sandal Nữ Model 009', Description: 'Giày sandal nữ cao cấp.', Price: 900000, DiscountPercent: 20, CategoryID: categoryMap['Giày Sandal Nữ'] },
        { Name: 'Giày Sandal Nữ Model 010', Description: 'Giày sandal nữ thời thượng.', Price: 820000, DiscountPercent: 12, CategoryID: categoryMap['Giày Sandal Nữ'] },

        // Sneaker Unisex (10 products)
        { Name: 'Sneaker Unisex Model 001', Description: 'Sneaker unisex phong cách năng động.', Price: 2000000, DiscountPercent: 5, CategoryID: categoryMap['Sneaker Unisex'] },
        { Name: 'Sneaker Unisex Model 002', Description: 'Sneaker unisex thoải mái và bền.', Price: 2100000, DiscountPercent: 10, CategoryID: categoryMap['Sneaker Unisex'] },
        { Name: 'Sneaker Unisex Model 003', Description: 'Sneaker unisex thời trang.', Price: 2200000, DiscountPercent: 0, CategoryID: categoryMap['Sneaker Unisex'] },
        { Name: 'Sneaker Unisex Model 004', Description: 'Sneaker unisex tiện dụng.', Price: 1900000, DiscountPercent: 8, CategoryID: categoryMap['Sneaker Unisex'] },
        { Name: 'Sneaker Unisex Model 005', Description: 'Sneaker unisex chất lượng cao.', Price: 2300000, DiscountPercent: 15, CategoryID: categoryMap['Sneaker Unisex'] },
        { Name: 'Sneaker Unisex Model 006', Description: 'Sneaker unisex phong cách hiện đại.', Price: 2050000, DiscountPercent: 5, CategoryID: categoryMap['Sneaker Unisex'] },
        { Name: 'Sneaker Unisex Model 007', Description: 'Sneaker unisex thiết kế độc đáo.', Price: 2150000, DiscountPercent: 10, CategoryID: categoryMap['Sneaker Unisex'] },
        { Name: 'Sneaker Unisex Model 008', Description: 'Sneaker unisex thoải mái.', Price: 1950000, DiscountPercent: 0, CategoryID: categoryMap['Sneaker Unisex'] },
        { Name: 'Sneaker Unisex Model 009', Description: 'Sneaker unisex cao cấp.', Price: 2400000, DiscountPercent: 20, CategoryID: categoryMap['Sneaker Unisex'] },
        { Name: 'Sneaker Unisex Model 010', Description: 'Sneaker unisex thời thượng.', Price: 2250000, DiscountPercent: 12, CategoryID: categoryMap['Sneaker Unisex'] },
      ];
      await queryInterface.bulkInsert('Products', allProducts.map(p => ({ ...p, CreatedAt: new Date() })), { transaction });

      // --- Lấy lại Product IDs vừa tạo---
      const insertedProducts = await queryInterface.sequelize.query(
        `SELECT p.ProductID, c.Name as CategoryName FROM Products p JOIN Categories c ON p.CategoryID = c.CategoryID`, {
          type: queryInterface.sequelize.QueryTypes.SELECT,
          transaction
        }
      );
      
      const sportMenProds = insertedProducts.filter(p => p.CategoryName === 'Giày Thể Thao Nam');
      const sportWomenProds = insertedProducts.filter(p => p.CategoryName === 'Giày Thể Thao Nữ');
      const officeMenProds = insertedProducts.filter(p => p.CategoryName === 'Giày Công Sở Nam');
      const officeWomenProds = insertedProducts.filter(p => p.CategoryName === 'Giày Công Sở Nữ');
      const sandalMenProds = insertedProducts.filter(p => p.CategoryName === 'Giày Sandal Nam');
      const sandalWomenProds = insertedProducts.filter(p => p.CategoryName === 'Giày Sandal Nữ');
      const sneakerUnisexProds = insertedProducts.filter(p => p.CategoryName === 'Sneaker Unisex');
      
      // --- 2. Seed ProductVariants ---
      const allVariants = [
        ...generateVariants(sportMenProds, ['39', '40', '41', '42', '43'], ['Đen', 'Trắng'], 'SPORTM'),
        ...generateVariants(sportWomenProds, ['36', '37', '38', '39', '40'], ['Đen', 'Trắng'], 'SPORTW'),
        ...generateVariants(officeMenProds, ['39', '40', '41', '42', '43'], ['Đen', 'Trắng'], 'OFFICEM'),
        ...generateVariants(officeWomenProds, ['36', '37', '38', '39', '40'], ['Đen', 'Trắng'], 'OFFICEW'),
        ...generateVariants(sandalMenProds, ['39', '40', '41', '42', '43'], ['Đen', 'Trắng'], 'SANDALM'),
        ...generateVariants(sandalWomenProds, ['36', '37', '38', '39', '40'], ['Đen', 'Trắng'], 'SANDALW'),
        ...generateVariants(sneakerUnisexProds, ['36', '37', '38', '39', '40', '41', '42', '43'], ['Đen', 'Trắng'], 'SNEAKERU'),
      ];
      await queryInterface.bulkInsert('ProductVariants', allVariants, { transaction });
      
      // --- Lấy lại Variant IDs vừa tạo ---
      const insertedVariants = await queryInterface.sequelize.query(
        "SELECT VariantID, ProductID, Size, Color FROM ProductVariants", {
          type: queryInterface.sequelize.QueryTypes.SELECT,
          transaction
        }
      );

      const getVariantId = (productId, size, color) => {
        const variant = insertedVariants.find(v => v.ProductID === productId && v.Size === size && v.Color === color);
        return variant ? variant.VariantID : null;
      };

      // --- 3. Seed ProductImages ---
      const allImages = [];
      const imageCategories = [
        { products: sportMenProds, path: 'SPORT/MEN', name: 'sport', size: '39' },
        { products: sportWomenProds, path: 'SPORT/WOMEN', name: 'sport', size: '36' },
        { products: officeMenProds, path: 'OFFICE/MEN', name: 'office', size: '39' },
        { products: officeWomenProds, path: 'OFFICE/WOMEN', name: 'office', size: '36' },
        { products: sandalMenProds, path: 'SANDAL/MEN', name: 'sandal', size: '39' },
        { products: sandalWomenProds, path: 'SANDAL/WOMEN', name: 'sandal', size: '36' },
        { products: sneakerUnisexProds, path: 'SNEAKER/UNISEX', name: 'sneaker', size: '36' },
      ];

      imageCategories.forEach(cat => {
        cat.products.forEach((product, index) => {
          const counter = index + 1;
          const variantIdBlack = getVariantId(product.ProductID, cat.size, 'Đen');
          const variantIdWhite = getVariantId(product.ProductID, cat.size, 'Trắng');

          if (variantIdBlack) {
            allImages.push({
              ProductID: product.ProductID,
              VariantID: variantIdBlack,
              ImageURL: `/uploads/${cat.path}/${cat.name}${counter}den.jpg`,
              IsDefault: true,
              CreatedAt: new Date()
            });
          }
          if (variantIdWhite) {
            allImages.push({
              ProductID: product.ProductID,
              VariantID: variantIdWhite,
              ImageURL: `/uploads/${cat.path}/${cat.name}${counter}trang.jpg`,
              IsDefault: false,
              CreatedAt: new Date()
            });
          }
        });
      });
      await queryInterface.bulkInsert('ProductImages', allImages, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error("Seeding products failed:", error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // Xóa theo thứ tự ngược lại để đảm bảo khóa ngoại
    await queryInterface.bulkDelete('ProductImages', null, {});
    await queryInterface.bulkDelete('ProductVariants', null, {});
    await queryInterface.bulkDelete('Products', null, {});
  }
};