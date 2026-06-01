const express = require('express');
const router = express.Router();
const { loginUser, loginAdmin, registerUser, getProfile, getTotalUsers } = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.post('/login', loginUser);
router.post('/admin-login', loginAdmin);
router.post('/register', registerUser);
router.get('/profile', authenticate, getProfile);
router.get('/users/count', authenticate, authorize('admin'), getTotalUsers);

module.exports = router;
