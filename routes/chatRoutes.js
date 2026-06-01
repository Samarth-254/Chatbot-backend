const express = require('express');
const router = express.Router();
const { queryChatbot, getChatHistory, clearChatHistory, getUserChatHistory } = require('../controllers/chatController');
const { authenticate, authorize, optionalAuthenticate } = require('../middleware/authMiddleware');

router.post('/query', optionalAuthenticate, queryChatbot);
router.get('/user-history', authenticate, getUserChatHistory);
router.get('/history', authenticate, authorize('admin'), getChatHistory);
router.delete('/history', authenticate, authorize('admin'), clearChatHistory);

module.exports = router;
