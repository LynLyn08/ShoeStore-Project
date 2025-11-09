//backend/migrations/20251017172356-create-review-media.js
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ReviewMedia', {
      MediaID: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      ReviewID: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Reviews', key: 'ReviewID' }, onDelete: 'CASCADE' },
      MediaURL: { type: Sequelize.STRING(500), allowNull: false },
      IsVideo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      CreatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('GETDATE') }
    });
    await queryInterface.addIndex('ReviewMedia', ['ReviewID'], { name: 'IDX_ReviewMedia_ReviewID' });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ReviewMedia');
  }
};