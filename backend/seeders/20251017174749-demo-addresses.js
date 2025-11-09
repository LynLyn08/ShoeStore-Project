//backend/seeders/20251017174749-demo-addresses.js
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Tìm User có username là 'user1' để lấy UserID
    const users = await queryInterface.sequelize.query(
      `SELECT UserID FROM Users WHERE Username = 'user1'`, {
        type: queryInterface.sequelize.QueryTypes.SELECT
      }
    );

    if (users.length === 0) {
      console.log("Không tìm thấy user 'user1', bỏ qua seeding addresses.");
      return;
    }

    const user1Id = users[0].UserID;

    await queryInterface.bulkInsert('Addresses', [{
      UserID: user1Id,
      FullName: 'Trần Thị Người Dùng',
      Phone: '0912345678',
      Street: '456 Đường Nguyễn Huệ',
      City: 'TP.HCM',
      Country: 'Việt Nam',
      IsDefault: true,
      CreatedAt: new Date(),
      UpdatedAt: new Date()
    }, {
      UserID: user1Id,
      FullName: 'Trần Thị Người Dùng',
      Phone: '0912345678',
      Street: '789 Đường Trần Phú',
      City: 'Đà Nẵng',
      Country: 'Việt Nam',
      IsDefault: false,
      CreatedAt: new Date(),
      UpdatedAt: new Date()
    }], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Addresses', null, {});
  }
};