const db = require('../models')
const Restaurant = db.Restaurant
const Category = db.Category

const restController = {
  getRestaurants: (req, res) => {
    Restaurant.findAll({ include: [Category] })
      .then(result => {
        console.log(result[0])
        const data = result.map(r => ({
          ...r.dataValues,
          description: r.description.substring(0, 50),
          categoryName: r.Category.name
        }))
        res.render('restaurants', { restaurants: data })
      })
  }
}

module.exports = restController