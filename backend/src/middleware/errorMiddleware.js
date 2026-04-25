function errorHandler(err, req, res, next) {
  // Use the error's statusCode if available, otherwise use the response statusCode if it's not 200, otherwise default to 500
  const status = err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);
  res.status(status).json({
    message: err.message || 'Server error',
    ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {}),
  });
}

module.exports = { errorHandler };
