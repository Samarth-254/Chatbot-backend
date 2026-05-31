const mongoose = require('mongoose');

const ChatHistorySchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    required: true,
  },
  source: {
    type: String,
    enum: ['qa', 'documents', 'fallback'],
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  sessionId: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ChatHistory', ChatHistorySchema);
