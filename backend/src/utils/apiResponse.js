module.exports = (res, message, data = null, status = 200) => {
  res.status(status).json({
    success: status < 400,
    message,
    data
  });
};
