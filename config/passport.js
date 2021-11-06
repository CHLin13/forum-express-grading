const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcryptjs')
const db = require('../models')
const User = db.User

passport.use(new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
  User.findOne({ where: { email } })
    .then(user => {
      if (!user) {
        return done(null, false, { message: '帳號或密碼輸入錯誤' })
      }
      if (!bcrypt.compareSync(password, user.password)) {
        return done(null, false, { message: '帳號或密碼輸入錯誤' })
      }
      return done(null, user)
    })
}))

passport.serializeUser((user, done) => {
  return done(null, user.id)
})
passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then(user => {
      user = user.toJSON()
      return done(null, user)
    })
    .catch(err => done(err, null))
})

module.exports = passport