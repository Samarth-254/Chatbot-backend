const express = require('express');
const router = express.Router();
const { loginUser, loginAdmin, registerUser, getProfile, getTotalUsers } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', loginUser);
router.post('/admin-login', loginAdmin);
router.post('/register', registerUser);
router.get('/profile', protect, getProfile);
router.get('/users/count', protect, getTotalUsers);

module.exports = router;
