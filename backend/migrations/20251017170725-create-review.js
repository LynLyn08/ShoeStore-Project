//backend/migrations/20251017170725-create-review.js
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Reviews', {
      ReviewID: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      UserID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'UserID' },
        onDelete: 'NO ACTION'
      },
      ProductID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Products', key: 'ProductID' },
        onDelete: 'NO ACTION'
      },
      Rating: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      Comment: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      CreatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('GETDATE')
      }
    });

    await queryInterface.addConstraint('Reviews', {
      fields: ['Rating'],
      type: 'check',
      where: { Rating: { [Sequelize.Op.between]: [1, 5] } },
      name: 'CK_Reviews_Rating'
    });

    await queryInterface.addConstraint('Reviews', {
      fields: ['UserID', 'ProductID'],
      type: 'unique',
      name: 'UQ_Reviews_User_Product'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Reviews');
  }
};