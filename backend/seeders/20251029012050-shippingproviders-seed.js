'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
const shippingProviders = [
  {
    Code: 'GHN',
    Name: 'Giao Hàng Nhanh (GHN)',
    IsActive: true,
    Fee: 30000.00,  // THÊM: Phí 30k
    ConfigJson: JSON.stringify({ apiKey: 'placeholder_ghn', shopId: 'placeholder_shop' }),
    CreatedAt: new Date(),
    UpdatedAt: null
  },
  {
    Code: 'GHTK',
    Name: 'Giao Hàng Tiết Kiệm (GHTK)',
    IsActive: true,
    Fee: 25000.00,  // THÊM: Phí 25k
    ConfigJson: JSON.stringify({ token: 'placeholder_ghtk', pickupAddress: 'Hà Nội' }),
    CreatedAt: new Date(),
    UpdatedAt: null
  },
  {
    Code: 'VTP',
    Name: 'Viettel Post',
    IsActive: true,
    Fee: 35000.00,  // THÊM: Phí 35k
    ConfigJson: JSON.stringify({ clientId: 'placeholder_vtp', apiUrl: 'https://api.viettelpost.com.vn' }),
    CreatedAt: new Date(),
    UpdatedAt: null
  },
  {
    Code: 'JNT',
    Name: 'J&T Express',
    IsActive: false,
    Fee: 28000.00,  // THÊM: Phí 28k (dù inactive)
    ConfigJson: null,
    CreatedAt: new Date(),
    UpdatedAt: null
  }
];
  // Bulk insert: Thêm 'Fee' vào fields
  await queryInterface.bulkInsert('ShippingProviders', shippingProviders, {
    fields: ['Code', 'Name', 'IsActive', 'Fee', 'ConfigJson', 'CreatedAt', 'UpdatedAt']  // THÊM 'Fee'
  });
  },

  down: async (queryInterface, Sequelize) => {
    // Xóa tất cả
    await queryInterface.bulkDelete('ShippingProviders', null, {});
  }
};