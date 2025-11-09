// backend/migrations/20251017164738-create-user.js
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      UserID: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      Username: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      Email: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      Password: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      Role: {
        type: Sequelize.ENUM('user', 'admin'),
        allowNull: false,
        defaultValue: 'user'
      },
      FullName: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      Phone: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      Address: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      TwoFactorSecret: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      TwoFactorEnabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      CreatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('GETDATE')
      },
      AvatarURL: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      ResetToken: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      ResetTokenExpiry: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Thêm chỉ mục (index) cho cột Email
    await queryInterface.addIndex('Users', ['Email'], {
      name: 'IDX_Users_Email'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Users');
  }
};