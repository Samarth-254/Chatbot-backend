const mongoose = require('mongoose');

const DocumentChunkSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  chunkIndex: {
    type: Number,
    required: true,
  }
}, {
  timestamps: true
});

// Create text index for keyword searches
DocumentChunkSchema.index({ text: 'text' });

module.exports = mongoose.model('DocumentChunk', DocumentChunkSchema);
