//backend/migrations/20251017170855-create-blog.js
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Blogs', {
      BlogID: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      Title: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      Content: {
        type: Sequelize.TEXT, // NVARCHAR(MAX)
        allowNull: false
      },
      Author: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      ImageURL: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      IsActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      CreatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('GETDATE')
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Blogs');
  }
};