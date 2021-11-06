const bcrypt = require('bcryptjs')
const db = require('../models')
const User = db.User


const userController = {
  signUpPage: (req, res) => {
    res.render('signup')
  },

  signUP: (req, res) => {
    User.create({
      name: req.body.name,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10)
    })
    .then(() => res.redirect('/signin'))
  },

  signInPage: (req, res) => {
    res.render('signin')
  }
}

module.exports = userController