const mongoose = require('mongoose');

const QASchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true,
  },
  answer: {
    type: String,
    required: true,
    trim: true,
  },
  normalizedQuestion: {
    type: String,
    index: true,
  }
}, {
  timestamps: true
});

// Text normalization helper
const normalizeText = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')    // Collapse multiple spaces
    .trim();
};

// Auto-normalize question before save
QASchema.pre('save', function (next) {
  this.normalizedQuestion = normalizeText(this.question);
  next();
});

module.exports = mongoose.model('QA', QASchema);
module.exports.normalizeText = normalizeText; // export helper for reuse in controllers
