// backend/migrations/20251017165157-create-address.js
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Addresses', {
      AddressID: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      UserID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users', // Tên bảng tham chiếu
          key: 'UserID'
        },
        onDelete: 'CASCADE' // Quan trọng: Nếu User bị xóa, địa chỉ cũng bị xóa
      },
      FullName: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      Phone: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      Street: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      City: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      State: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      Country: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: 'Việt Nam'
      },
      Email: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      Note: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      IsDefault: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      CreatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('GETDATE')
      },
      UpdatedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Tạo các index
    await queryInterface.addIndex('Addresses', ['UserID'], {
      name: 'IDX_Addresses_UserID'
    });

    // Tạo UNIQUE INDEX có điều kiện (WHERE IsDefault = 1)
    // Lưu ý: Cú pháp này có thể cần dialectOptions cụ thể trong config nếu không chạy
    await queryInterface.addIndex('Addresses', ['UserID'], {
      name: 'UQ_Addresses_DefaultPerUser',
      unique: true,
      where: {
        IsDefault: true
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Addresses');
  }
};