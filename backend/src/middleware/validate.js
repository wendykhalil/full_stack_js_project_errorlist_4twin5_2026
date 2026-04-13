const { validationResult } = require('express-validator');

// Run validation chains and return 400 with all errors if any fail
function validate(chains) {
  return async (req, res, next) => {
    for (const chain of chains) await chain.run(req);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation échouée',
        errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
      });
    }
    next();
  };
}

// Legacy middleware (kept for existing routes)
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = { validate, handleValidationErrors };
