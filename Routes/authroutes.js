const express = require('express')
const router = express.Router()
const authController = require('../Controllers/authController')

router
.route('/')
.get(authController.demo)

router
.route('/signup')
.post(authController.signUp)

router
.route('/login')
.post(authController.login)

router
.route('/logout')
.post(authController.logout)




module.exports = router;