// Create Token and saving in cookie

const sendToken = (user, statusCode, res, message) => {
  const token = user.getJWTToken();

  //option for cookie
  const options = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: true,
    sameSite: "none",
  };

  const userData = {
    _id: user.id,
    full_name: user.full_name,
    email: user.email,
    phoneNo: user.phoneNo,
    verified: user.verified,
  };

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    message,
    user: userData,
  });
};

module.exports = sendToken;
