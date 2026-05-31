const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
  },
  cloudinaryUrl: {
    type: String,
    required: true,
  },
  cloudinaryId: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number,
  },
  fileType: {
    type: String,
    required: true,
  },
  chunksCount: {
    type: Number,
    default: 0,
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Document', DocumentSchema);
