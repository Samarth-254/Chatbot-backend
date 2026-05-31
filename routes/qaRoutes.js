const express = require('express');
const router = express.Router();
const { getQAs, createQA, updateQA, deleteQA } = require('../controllers/qaController');
const { protect } = require('../middleware/authMiddleware');
router.use(protect);

router.route('/')
  .get(getQAs)
  .post(createQA);

router.route('/:id')
  .put(updateQA)
  .delete(deleteQA);

module.exports = router;
