const express = require('express');
const router = express.Router();
const { queryChatbot, getChatHistory, clearChatHistory, getUserChatHistory } = require('../controllers/chatController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');

router.post('/query', optionalProtect, queryChatbot);
router.get('/user-history', protect, getUserChatHistory);
router.get('/history', protect, getChatHistory);
router.delete('/history', protect, clearChatHistory);

module.exports = router;
