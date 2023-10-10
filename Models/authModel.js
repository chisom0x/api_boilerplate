const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const crypto = require('crypto')


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'please input your name']
    },
    email: {
        type: String,
        required: [true, 'please input your email address']
    },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user'
      },
    password: {
        type: String,
        required: [true, 'please input your password']
    },
    confirmPassword: {
        type: String,
        required: [true, 'please input your password']
    },
    verifiedEmail: {
      type: Boolean
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
});


userSchema.pre('save', async function(next) {
    // Hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
  
    // Delete passwordConfirm field
    this.passwordConfirm = undefined;
    next();
  });

userSchema.methods.correctPassword = async function(
    candidatePassword,
    userPassword
  ) {
    return await bcrypt.compare(candidatePassword, userPassword);
  };

 // This method is for generating, hashing and storing password reset tokens
 userSchema.methods.createPasswordResetToken = function() {
  // generate a reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
  
  // hash the token and store it in the user's data
    this.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
  

    console.log({ resetToken }, this.passwordResetToken);
  
  // set the reset password token to expire in 10 minutes
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  // return the original(unhashed) token - this will be used for sending password reset emails
    return resetToken;
  };


const User = mongoose.model('User', userSchema)
module.exports = User