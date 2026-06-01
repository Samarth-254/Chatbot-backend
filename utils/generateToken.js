const jwt = require('jsonwebtoken');
const env = require('../config/env');

const generateToken = (id, role, username) => {
  return jwt.sign({ id, role, username }, env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

module.exports = generateToken;