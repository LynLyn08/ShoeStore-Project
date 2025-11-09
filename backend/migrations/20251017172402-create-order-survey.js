//backend/migrations/20251017172402-create-order-survey.js
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    const surveyStatusEnum = ['poor', 'ok', 'good'];
    await queryInterface.createTable('OrderSurveys', {
      SurveyID: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      OrderID: { type: Sequelize.INTEGER, allowNull: false, unique: true, references: { model: 'Orders', key: 'OrderID' }, onDelete: 'CASCADE' },
      UserID: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Users', key: 'UserID' }, onDelete: 'NO ACTION' },
      DeliveryTime: { type: Sequelize.ENUM(...surveyStatusEnum), allowNull: true },
      Quality: { type: Sequelize.ENUM(...surveyStatusEnum), allowNull: true },
      Shipping: { type: Sequelize.ENUM(...surveyStatusEnum), allowNull: true },
      Support: { type: Sequelize.ENUM('no', 'yes'), allowNull: true },
      CreatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('GETDATE') }
    });
    await queryInterface.addIndex('OrderSurveys', ['OrderID'], { name: 'IDX_OrderSurveys_Order' });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('OrderSurveys');
  }
};