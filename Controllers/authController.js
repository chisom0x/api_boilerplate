const User = require('./../Models/authModel')
const jwt = require('jsonwebtoken')
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

exports.signUp = async (req, res) => {
   const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword
   })
   createSendToken(newUser, 201, res)
}

exports.login = async (req, res, next) => {
    const { email, password } = req.body;
  
    // 1) Check if email and password exist
    if (!email || !password) {
      return next(new res.json('Please provide email and password!'));
    }
    // 2) Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password');
  
    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(res.json('Incorrect email or password', 400));
    }
  
    // 3) If everything ok, send token to client
    createSendToken(user, 200, res);
  };

  
//the protect (Authorization) endpoint to check if user is loggged and give access to other endpoint that -
// require the user to be logged in 
exports.protect = async (req, res, next) => {
  let token;
  if(
    req.headers.authorization && 
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if(!token){
    return next(res.json({message: 'not logged in'}))
  }
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)
  const currentUser = await User.findById(decoded.id);
  if(!currentUser){
    return next(res.json({message: 'this user does not exist anymore'}))
  }
  req.user = currentUser;
  next();
}
// use this endpoint if you are using a role based authorization.
// note; the roles have to be in your data base model
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'user']. role='user'
    if (!roles.includes(req.user.role)) {
      return next(
        res.send('you do not have permission to perform this action')
      );
    }

    next();
  };
};

exports.logout= (req, res) => {
  // Clear the JWT cookie by setting it to an expired value
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  // Return a success response
  res.status(200).json({ status: 'success' });
};