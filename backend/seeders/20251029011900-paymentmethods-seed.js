'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const paymentMethods = [
      {
        Code: 'COD',
        Name: 'Thanh toán khi nhận hàng (COD)',
        Type: 'OFFLINE',
        Provider: null,
        IsActive: true,
        ConfigJson: null,  // Không cần config cho COD
        CreatedAt: new Date(),
        UpdatedAt: null
      },
      {
        Code: 'VNPAY',
        Name: 'VNPAY QR / Thẻ',
        Type: 'ONLINE',
        Provider: 'VNPAY',
        IsActive: true,
        ConfigJson: JSON.stringify({ 
          apiKey: 'placeholder_vnpay', 
          merchantId: 'placeholder_merchant' 
        }),  // Config mẫu, thay bằng thực sau
        CreatedAt: new Date(),
        UpdatedAt: null
      },
      {
        Code: 'MOMO',
        Name: 'Momo Wallet',
        Type: 'ONLINE',
        Provider: 'MOMO',
        IsActive: true,
        ConfigJson: JSON.stringify({ 
          partnerCode: 'placeholder_momo', 
          accessKey: 'placeholder_access' 
        }),
        CreatedAt: new Date(),
        UpdatedAt: null
      },
      {
        Code: 'ZALOPAY',
        Name: 'ZaloPay',
        Type: 'ONLINE',
        Provider: 'ZALOPAY',
        IsActive: true,
        ConfigJson: JSON.stringify({ 
          appId: 'placeholder_zalo', 
          key1: 'placeholder_key1' 
        }),
        CreatedAt: new Date(),
        UpdatedAt: null
      }
    ];

    // Bulk insert với Sequelize literal cho timestamps
    await queryInterface.bulkInsert('PaymentMethods', paymentMethods, {
      fields: ['Code', 'Name', 'Type', 'Provider', 'IsActive', 'ConfigJson', 'CreatedAt', 'UpdatedAt']
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Xóa tất cả (hoặc filter cụ thể nếu cần)
    await queryInterface.bulkDelete('PaymentMethods', null, {});
  }
};