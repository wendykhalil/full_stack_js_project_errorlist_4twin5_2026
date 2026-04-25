function errorHandler(err, req, res, next) {
  // Determine status code
  let status = 500;
  if (err.statusCode) {
    status = err.statusCode;
  } else if (res.statusCode && res.statusCode !== 200) {
    status = res.statusCode;
  }
  
  res.status(status).json({
    message: err.message || 'Server error',
    ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {}),
  });
}

module.exports = { errorHandler };