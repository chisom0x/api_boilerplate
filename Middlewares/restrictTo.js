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