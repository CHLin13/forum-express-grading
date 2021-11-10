'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Comments', ['good', 'tasty', 'bad', 'no good'].map((item, index) => ({
      id: index * 10 + 1,
      text: item,
      UserId: 5,
      RestaurantId: Math.floor(Math.random() * 50) + 1,
      createdAt: new Date(),
      updatedAt: new Date()
    })), {})
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Comments',null)
  }
};
