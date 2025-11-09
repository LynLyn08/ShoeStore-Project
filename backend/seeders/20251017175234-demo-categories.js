// backend/seeders/20251017175234-demo-categories.js
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Categories', [{
      Name: 'Giày Thể Thao Nam',
      Description: 'Giày thể thao dành cho nam',
      TargetGroup: 'Men',
      IsActive: true,
      CreatedAt: new Date()
    }, {
      Name: 'Giày Thể Thao Nữ',
      Description: 'Giày thể thao dành cho nữ',
      TargetGroup: 'Women',
      IsActive: true,
      CreatedAt: new Date()
    }, {
      Name: 'Giày Công Sở Nam',
      Description: 'Giày công sở dành cho nam',
      TargetGroup: 'Men',
      IsActive: true,
      CreatedAt: new Date()
    }, {
      Name: 'Giày Công Sở Nữ',
      Description: 'Giày công sở dành cho nữ',
      TargetGroup: 'Women',
      IsActive: true,
      CreatedAt: new Date()
    }, {
      Name: 'Giày Sandal Nam',
      Description: 'Giày sandal dành cho nam',
      TargetGroup: 'Men',
      IsActive: true,
      CreatedAt: new Date()
    }, {
      Name: 'Giày Sandal Nữ',
      Description: 'Giày sandal dành cho nữ',
      TargetGroup: 'Women',
      IsActive: true,
      CreatedAt: new Date()
    }, {
      Name: 'Sneaker Unisex',
      Description: 'Sneaker dành cho cả nam và nữ',
      TargetGroup: 'Unisex',
      IsActive: true,
      CreatedAt: new Date()
    }], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Categories', null, {});
  }
};