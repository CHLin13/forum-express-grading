const bcrypt = require('bcryptjs')
const db = require('../models')
const helpers = require('../_helpers')
const User = db.User
const Comment = db.Comment
const Restaurant = db.Restaurant
const Favorite = db.Favorite
const Like = db.Like
const Followship = db.Followship

const imgur = require('imgur-node-api')
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID

const userController = {
  signUpPage: (req, res) => {
    res.render('signup')
  },

  signUP: (req, res) => {
    if (req.body.password !== req.body.passwordCheck) {
      req.flash('error_messages', '兩次密碼輸入不同！')
      return res.redirect('/signup')
    }
    User.findOne({ where: { email: req.body.email } })
      .then(user => {
        if (user) {
          req.flash('error_messages', '信箱重複！')
          return res.redirect('/signup')
        }
        User.create({
          name: req.body.name,
          email: req.body.email,
          password: bcrypt.hashSync(req.body.password, 10)
        })
      })
      .then(() => {
        req.flash('success_messages', '成功註冊帳號！')
        return res.redirect('/signin')
      })
  },

  signInPage: (req, res) => {
    res.render('signin')
  },

  signIn: (req, res) => {
    req.flash('success_messages', '成功登入！')
    res.redirect('/restaurants')
  },

  logout: (req, res) => {
    req.flash('success_messages', '登出成功！')
    req.logout()
    res.redirect('/signin')
  },

  getUser: (req, res) => {
    return User.findByPk(req.params.id, {
      include: [
        Comment,
        { model: Restaurant, as: 'FavoritedRestaurants' },
        { model: User, as: 'Followings' },
        { model: User, as: 'Followers' }
      ]
    })
      .then(user => {
        const edit = helpers.getUser(req).id === user.id
        const isFollowed = helpers.getUser(req).Followings.map(d => d.id).includes(user.id)
        const commentedRestaurantId = [...new Set(user.Comments.map(c => c.RestaurantId))]
        const favoritedRestaurantId = user.FavoritedRestaurants.map(FR => FR.id)
        const followingId = user.Followings.map(following => following.id)
        const followerId = user.Followers.map(follower => follower.id)
        user = {
          ...user.dataValues,
          CommentRestaurantCount: commentedRestaurantId.length,
          FavoritedRestaurantCount: user.FavoritedRestaurants.length,
          FollowingCount: user.Followings.length,
          FollowerCount: user.Followers.length,
        }
        Promise.all([
          Restaurant.findAll({ raw: true, nest: true, where: { id: commentedRestaurantId } }),
          Restaurant.findAll({ raw: true, nest: true, where: { id: favoritedRestaurantId } }),
          User.findAll({ raw: true, nest: true, where: { id: followingId } }),
          User.findAll({ raw: true, nest: true, where: { id: followerId } })
        ])
          .then(([commentRestaurants, favoritedRestaurants, followings, followers]) => {
            return res.render('profile', { user, commentRestaurants, favoritedRestaurants, followings, followers, edit, isFollowed })
          })
      })
  },

  editUser: (req, res) => {
    return User.findByPk(req.params.id)
      .then(user => res.render('edit', { user: user.toJSON() }))
  },

  putUser: (req, res) => {
    const { file } = req
    if (file) {
      imgur.setClientID(IMGUR_CLIENT_ID)
      imgur.upload(file.path, (err, img) => {
        return User.findByPk(req.params.id)
          .then(user => {
            user.update({
              name: req.body.name,
              email: req.body.email,
              image: file ? img.data.link : null
            })
              .then(() => {
                req.flash('success_messages', '使用者資料編輯成功')
                return res.redirect(`/users/${req.params.id}`)
              })
          })
      })
    } else {
      return User.findByPk(req.params.id)
        .then(user => {
          user.update({
            name: req.body.name,
            email: req.body.email,
            image: user.image
          })
            .then(() => {
              req.flash('success_messages', '使用者資料編輯成功')
              return res.redirect(`/users/${req.params.id}`)
            })
        })
    }

    // 判斷更新的Email是否有被註冊過
    // User.findOne({ raw: true, nest: true, where: { email: req.body.email } })
    //   .then(anotherUser => {
    //     User.findByPk(req.params.id)
    //       .then(user => {
    //         if (anotherUser && anotherUser.email !== user.email) {
    //           req.flash('error', '無法使用此Email')
    //           return res.redirect(`/users/${req.params.id}/edit`)
    //         } else {
    //           if (file) {
    //             imgur.setClientID(IMGUR_CLIENT_ID)
    //             imgur.upload(file.path, (err, img) => {
    //               user.update({
    //                 name: req.body.name,
    //                 email: req.body.email,
    //                 image: file ? img.data.link : null
    //               })
    //                 .then(() => {
    //                   req.flash('success_messages', '使用者資料編輯成功')
    //                   return res.redirect(`/users/${req.params.id}`)
    //                 })
    //             })
    //           } else {
    //             user.update({
    //               name: req.body.name,
    //               email: req.body.email,
    //               image: user.image
    //             })
    //               .then(() => {
    //                 req.flash('success_messages', '使用者資料編輯成功')
    //                 return res.redirect(`/users/${req.params.id}`)
    //               })
    //           }
    //         }
    //       })
    //   })
  },

  addFavorite: (req, res) => {
    return Favorite.create({
      UserId: req.user.id,
      RestaurantId: req.params.restaurantId
    })
      .then(() => res.redirect('back'))
  },

  removeFavorite: (req, res) => {
    return Favorite.destroy({
      where: {
        UserId: req.user.id,
        RestaurantId: req.params.restaurantId
      }
    })
      .then(() => res.redirect('back'))
  },

  addLike: (req, res) => {
    return Like.create({
      UserId: helpers.getUser(req).id,
      RestaurantId: req.params.restaurantId
    })
      .then(() => res.redirect('back'))
  },

  removeLike: (req, res) => {
    return Like.destroy({
      where: {
        UserId: helpers.getUser(req).id,
        RestaurantId: req.params.restaurantId
      }
    })
      .then(() => res.redirect('back'))
  },

  getTopUser: (req, res) => {
    return User.findAll({
      include: [
        { model: User, as: 'Followers' }
      ]
    })
      .then(users => {
        users = users.map(user => ({
          ...user.dataValues,
          FollowerCount: user.Followers.length,
          isFollowed: req.user.Followings.map(d => d.id).includes(user.id),
          user: req.user.id === user.id
        }))
        users = users.sort((a, b) => b.FollowerCount - a.FollowerCount)
        return res.render('topUser', { users })
      })
  },

  addFollowing: (req, res) => {
    return Followship.create({
      followerId: req.user.id,
      followingId: req.params.userId
    })
      .then(() => res.redirect('back'))
  },

  removeFollowing: (req, res) => {
    return Followship.destroy({
      where: {
        followerId: req.user.id,
        followingId: req.params.userId
      }
    })
      .then(() => res.redirect('back'))
  }
}

module.exports = userController