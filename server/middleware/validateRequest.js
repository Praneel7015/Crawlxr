const { body, validationResult } = require("express-validator");

const validateCrawlRequest = [
  body("url")
    .isString()
    .withMessage("url must be a string")
    .bail()
    .trim()
    .isLength({ min: 5, max: 2048 })
    .withMessage("url length must be between 5 and 2048")
    .bail()
    .isURL({ protocols: ["http", "https"], require_protocol: true })
    .withMessage("url must be a valid http/https URL")
];

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  return next();
}

module.exports = {
  validateCrawlRequest,
  handleValidation
};
