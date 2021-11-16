const db = require('../models')
const Restaurant = db.Restaurant
const Category = db.Category
const User = db.User
const Comment = db.Comment

const pageLimit = 10

const restController = {
  getRestaurants: (req, res) => {
    let offset = 0
    const whereQuery = {}
    let categoryId = ''
    if (req.query.page) {
      offset = (req.query.page - 1) * pageLimit
    }
    if (req.query.categoryId) {
      categoryId = Number(req.query.categoryId)
      whereQuery.CategoryId = categoryId
    }
    Restaurant.findAndCountAll({ include: [Category], where: whereQuery, offset, limit: pageLimit })
      .then(result => {
        Category.findAll({ raw: true, nest: true })
          .then(categories => {
            const page = Number(req.query.page) || 1
            const pages = Math.ceil(result.count / pageLimit)
            const totalPage = Array.from({ length: pages }).map((item, index) => index + 1)
            const prev = page - 1 < 1 ? 1 : page - 1
            const next = page + 1 > pages ? pages : page + 1
            const data = result.rows.map(r => ({
              ...r.dataValues,
              description: r.description.substring(0, 50),
              categoryName: r.Category.name,
              isFavorited: req.user.FavoritedRestaurants.map(d => d.id).includes(r.id)
            }))
            res.render('restaurants', { restaurants: data, categories, categoryId, page, totalPage, prev, next })
          })
      })
  },

  getRestaurant: (req, res) => {
    return Restaurant.findByPk(req.params.id, {
      include: [
        Category,
        { model: Comment, include: [User] },
        { model: User, as: 'FavoritedUsers' }
      ]
    })
      .then(restaurant => {
        restaurant.increment('viewCounts', { by: 1 })
        const isFavorited = restaurant.FavoritedUsers.map(d => d.id).includes(req.user.id)
        res.render('restaurant', { restaurant: restaurant.toJSON(), isFavorited })
      })
  },

  getFeeds: (req, res) => {
    return Promise.all([
      Restaurant.findAll({
        raw: true,
        nest: true,
        include: [Category],
        order: [['createdAt', 'DESC']],
        limit: 10
      }),
      Comment.findAll({
        raw: true,
        nest: true,
        include: [User, Restaurant],
        order: [['createdAt', 'DESC']],
        limit: 10
      })
    ])
      .then(([restaurants, comments]) => {
        return res.render('feeds', { restaurants, comments })
      })
  },

  getDashBoard: (req, res) => {
    return Restaurant.findByPk(req.params.id, { raw: true, nest: true, include: [Category] })
      .then(restaurant => {
        Comment.findAndCountAll({ raw: true, nest: true, where: { RestaurantId: req.params.id } })
          .then(comments => {
            res.render('dashboard', { restaurant, comments })
          })
      })
  }
}

module.exports = restController