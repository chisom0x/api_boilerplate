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

router
.route('/request-otp')
.get(authController.sendOtp)

router
.route('/signup/resend-otp')
.get(authController.resendOtp)

router
.route('/signup/verify-email')
.post(authController.verifyEmail)

router
.route('/forgot-password')
.post(authController.forgotpassword)

router
.route('/reset-password/:token')
.patch(authController.resetpassword)






module.exports = router;