const QA = require('../models/QA');
const asyncHandler = require('../utils/asyncHandler');

const getQAs = asyncHandler(async (req, res) => {
  const { search } = req.query;
  let query = {};

  if (search) {
    query = {
      $or: [
        { question: { $regex: search, $options: 'i' } },
        { answer: { $regex: search, $options: 'i' } }
      ]
    };
  }

  const qas = await QA.find(query).sort({ createdAt: -1 });
  res.json({ success: true, count: qas.length, data: qas });
});

const createQA = asyncHandler(async (req, res) => {
  const { question, answer } = req.body;

  if (!question || !answer) {
    res.status(400);
    throw new Error('Please provide both question and answer');
  }

  const qa = await QA.create({ question, answer });
  res.status(201).json({ success: true, data: qa });
});

const updateQA = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { question, answer } = req.body;

  let qa = await QA.findById(id);

  if (!qa) {
    res.status(404);
    throw new Error('Q&A pair not found');
  }

  if (question) qa.question = question;
  if (answer) qa.answer = answer;

  await qa.save();
  res.json({ success: true, data: qa });
});

const deleteQA = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const qa = await QA.findById(id);

  if (!qa) {
    res.status(404);
    throw new Error('Q&A pair not found');
  }

  await QA.findByIdAndDelete(id);
  res.json({ success: true, message: 'Q&A pair removed' });
});

module.exports = {
  getQAs,
  createQA,
  updateQA,
  deleteQA
};
