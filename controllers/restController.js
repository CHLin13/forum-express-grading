const db = require('../models')
const Restaurant = db.Restaurant
const Category = db.Category

const restController = {
  getRestaurants: (req, res) => {
    const whereQuery = {}
    let categoryId = ''
    if (req.query.categoryId) {
      categoryId = Number(req.query.categoryId)
      whereQuery.CategoryId = categoryId
    }
    Restaurant.findAll({ include: [Category], where: whereQuery })
      .then(result => {
        Category.findAll({ raw: true, nest: true })
          .then(categories => {
            const data = result.map(r => ({
              ...r.dataValues,
              description: r.description.substring(0, 50),
              categoryName: r.Category.name
            }))
            res.render('restaurants', { restaurants: data, categories, categoryId })
          })
      })
  },

  getRestaurant: (req, res) => {
    return Restaurant.findByPk(req.params.id, { include: [Category] })
      .then(restaurant => res.render('restaurant', { restaurant: restaurant.toJSON() }))
  }
}

module.exports = restController