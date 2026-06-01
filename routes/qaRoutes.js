const express = require('express');
const router = express.Router();
const { getQAs, createQA, updateQA, deleteQA } = require('../controllers/qaController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.use(authenticate, authorize('admin'));

router.route('/')
  .get(getQAs)
  .post(createQA);

router.route('/:id')
  .put(updateQA)
  .delete(deleteQA);

module.exports = router;
