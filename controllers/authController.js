const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('../utils/asyncHandler');

const loginUser = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400);
    throw new Error('Please provide username and password');
  }

  const user = await User.findOne({ username }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  res.json({
    success: true,
    token: generateToken(user._id, user.role, user.username),
    user: {
      id: user._id,
      username: user.username,
      role: user.role
    }
  });
});

const registerUser = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400);
    throw new Error('Please provide username and password');
  }

  const userExists = await User.findOne({ username });
  if (userExists) {
    res.status(400);
    throw new Error('Username is already taken');
  }

  const user = await User.create({
    username,
    password,
    role: 'user'
  });

  res.status(201).json({
    success: true,
    token: generateToken(user._id, user.role, user.username),
    user: {
      id: user._id,
      username: user.username,
      role: user.role
    }
  });
});

const getProfile = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

const loginAdmin = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400);
    throw new Error('Please provide username and password');
  }

  const user = await User.findOne({ username }).select('+password');
  if (!user || user.role !== 'admin' || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error('Invalid admin credentials');
  }

  res.json({
    success: true,
    token: generateToken(user._id, user.role, user.username),
    user: {
      id: user._id,
      username: user.username,
      role: user.role
    }
  });
});

const getTotalUsers = asyncHandler(async (req, res) => {
  const count = await User.countDocuments({ role: 'user' });
  res.json({ success: true, count });
});

module.exports = {
  loginUser,
  loginAdmin,
  registerUser,
  getProfile,
  getTotalUsers
};
