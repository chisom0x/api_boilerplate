const User = require('./../Models/authModel')
const jwt = require('jsonwebtoken')
const catchAsync = require('./../Utils/catchAsync');
let { Email, signupOtp, resendOtp } = require('./../Utils/emailConfig');
const AppError = require('./../utils/appError');
const crypto = require('crypto')
const { promisify } = require('util');

// use this endpoint to test if the server is running fine 
exports.demo = (req, res) => {
    res.send('HELLO WORLD')
}

// signing a token
const signToken = id =>{
    return jwt.sign({id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
      })
}

// creatingthe token and sending it
const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id)
    //log the token to the terminal to see if it is properly created
    //console.log(token)
    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
          ),
          httpOnly: true
    }
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

    res.cookie('jwt', token, cookieOptions)

    // this makes the password hidden in the response
    user.password = undefined;
    user.confirmPassword = undefined;


    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    })
}

exports.signUp = catchAsync(async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Check if the email already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return next(new AppError('Email Already Exists!', 409));
    }

    // Check if the password and confirmPassword match
    if (password !== confirmPassword) {
      return next(new AppError('Passwords do not match!', 409));
    }

    const newUser = await User.create({
      name,
      email,
      password,
      confirmPassword,
      verifiedEmail: false,
    });

    // Send a response with a token
    createSendToken(newUser, 201, res);
  } catch (error) {
    console.error(error);
    return next(new AppError('Error signing up, Try again Later!', 500));
  }
})

exports.login = catchAsync(async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if email and password exist
    if (!email || !password) {
      return next(new AppError('The email you provided does not exist', 400));
    }
    // Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(new AppError('Incorrect email or password', 401));
    }

    createSendToken(user, 200, res);
  } catch (error) {
    console.error(error);
    return next(new AppError('Error logging in, Try again Later!', 500));
  }
  })

 

exports.logout = (req, res) => {
  try {
    // Clear the JWT cookie by setting it to an expired value
    res.cookie('jwt', 'loggedout', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });

    // Optionally, clear other cookies related to the session if any
    // res.clearCookie('otherCookieName');

    // Return a success response
    res.status(200).json({ status: 'success', message: 'Logout successful' });
  } catch (err) {
    // Handle any potential errors, e.g., cookie setting error
    res.status(500).json({ status: 'error', message: 'Logout failed' });
  }
};

// Send OTP to user's email
exports.sendOtp = catchAsync(async (req, res, next) => {
  try {
    const cookie = req.cookies.jwt;
    const decoded = await promisify(jwt.verify)(
      cookie,
      process.env.JWT_SECRET
    );

    const currentUser = await User.findById(decoded.id);

    // Send the OTP email
    await new Email(currentUser.email).sendSignupOtp();

    res.status(200).json({ message: 'OTP Sent To Your Email Address!' });
  } catch (error) {
    console.error(error);
    return next(new AppError('Error Sending OTP!, Try again Later!', 500));
  }
})


// Resend OTP to user's email
exports.resendOtp = async (req, res, next) => {
  try {
    // Clear the previous OTP
    signupOtp = undefined;

    const cookie = req.cookies.jwt;
    const decoded = await promisify(jwt.verify)(
      cookie,
      process.env.JWT_SECRET
    );

    const currentUser = await User.findById(decoded.id);

    // Send the OTP email
    await new Email(currentUser.email).resendSignupOtp();

    res.status(200).json({ message: 'Email sent' });
  } catch (error) {
    console.error(error);
    return next(new AppError('Error Sending OTP!, Try again Later!', 500));
  }
};

// User email verification route
exports.verifyEmail = async (req, res, next) => {
  try {
    const cookie = req.cookies.jwt;
    const decoded = await promisify(jwt.verify)(
      cookie,
      process.env.JWT_SECRET
    );
    const user = await User.findById(decoded.id);

    const userOtp = req.body;
    // CHECK IF THE OTP THE USER ENTERED IS SAME AS THE FIRST OR SECOND OTP SENT
    if (userOtp['userOtp'] == signupOtp || userOtp['userOtp'] == resendOtp) {
      user.verifiedEmail = true;
      await user.save();
      res.status(200).json({ message: 'Email verified!' });
    } else {
      res.status(409).json({ message: 'Invalid OTP!' });
    }
  } catch (error) {
    console.error(error);
    return next(new AppError('Error verifying OTP!', 500));
  }
};

// User forgot password route
exports.forgotpassword = async (req, res, next) => {
  try {
    // Check if the user exists
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return next(new AppError('The email you entered does not exist!', 404));
    }

    // Generate a random token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Generate reset password URL
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/auth/reset-password/${resetToken}`;

    // Send URL to email
    await new Email(user.email, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Password reset URL sent to your email!',
    });
  } catch (error) {
    console.error(error);
    return next(new AppError('Error sending email, Try again Later!', 500));
  }
};

// User reset password route
exports.resetpassword = async (req, res, next) => {
  try {
    // Hash the token provided in the request URL to match the stored hashed token
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    // Find a user with a matching hashed token and a valid expiration time
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    // Check if a user with a matching token was not found
    if (!user) {
      return next(new AppError('Token is invalid or expired', 400));
    }

    // Update the user's password and clear the password reset token and expiration
    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    createSendToken(user, 200, res);
  } catch (error) {
    console.error(error);
    return next(new AppError('Error resetting your password, Try again Later!', 500));
  }
};




