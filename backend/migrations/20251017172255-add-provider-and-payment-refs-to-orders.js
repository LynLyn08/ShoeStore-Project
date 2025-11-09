//backend/migrations/20251017172255-add-provider-and-payment-refs-to-orders.js
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    // Thêm cột vào bảng Orders
    await queryInterface.addColumn('Orders', 'PaymentMethodID', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'PaymentMethods', key: 'MethodID' },
      onDelete: 'SET NULL'
    });
    await queryInterface.addColumn('Orders', 'ShippingProviderID', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'ShippingProviders', key: 'ProviderID' },
      onDelete: 'SET NULL'
    });

    // Thêm cột vào bảng GuestOrders
    await queryInterface.addColumn('GuestOrders', 'PaymentMethodID', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'PaymentMethods', key: 'MethodID' },
      onDelete: 'SET NULL'
    });
    await queryInterface.addColumn('GuestOrders', 'ShippingProviderID', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'ShippingProviders', key: 'ProviderID' },
      onDelete: 'SET NULL'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Orders', 'PaymentMethodID');
    await queryInterface.removeColumn('Orders', 'ShippingProviderID');
    await queryInterface.removeColumn('GuestOrders', 'PaymentMethodID');
    await queryInterface.removeColumn('GuestOrders', 'ShippingProviderID');
  }
};