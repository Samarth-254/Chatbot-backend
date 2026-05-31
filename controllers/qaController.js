const QA = require('../models/QA');

const getQAs = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Get QAs error:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving Q&A pairs' });
  }
};

const createQA = async (req, res) => {
  const { question, answer } = req.body;

  try {
    if (!question || !answer) {
      return res.status(400).json({ success: false, message: 'Please provide both question and answer' });
    }

    const qa = await QA.create({ question, answer });
    res.status(201).json({ success: true, data: qa });
  } catch (error) {
    console.error('Create QA error:', error.message);
    res.status(500).json({ success: false, message: 'Server error creating Q&A pair' });
  }
};

const updateQA = async (req, res) => {
  const { id } = req.params;
  const { question, answer } = req.body;

  try {
    let qa = await QA.findById(id);

    if (!qa) {
      return res.status(404).json({ success: false, message: 'Q&A pair not found' });
    }

    if (question) qa.question = question;
    if (answer) qa.answer = answer;

    await qa.save();
    res.json({ success: true, data: qa });
  } catch (error) {
    console.error('Update QA error:', error.message);
    res.status(500).json({ success: false, message: 'Server error updating Q&A pair' });
  }
};

const deleteQA = async (req, res) => {
  const { id } = req.params;

  try {
    const qa = await QA.findById(id);

    if (!qa) {
      return res.status(404).json({ success: false, message: 'Q&A pair not found' });
    }

    await QA.findByIdAndDelete(id);
    res.json({ success: true, message: 'Q&A pair removed' });
  } catch (error) {
    console.error('Delete QA error:', error.message);
    res.status(500).json({ success: false, message: 'Server error deleting Q&A pair' });
  }
};

module.exports = {
  getQAs,
  createQA,
  updateQA,
  deleteQA
};
