const path = require('path');
const fs = require('fs');
const { cloudinary, isConfigured } = require('../config/cloudinary');
const Document = require('../models/Document');
const DocumentChunk = require('../models/DocumentChunk');
const { extractText } = require('../utils/extractor');
const { chunkText } = require('../utils/chunker');

const uploadToCloudinary = (fileBuffer, originalName) => {
  return new Promise((resolve, reject) => {
    const ext = path.extname(originalName).toLowerCase();
    const fileNameClean = path.parse(originalName).name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'chatbot_knowledge',
        resource_type: 'raw',
        public_id: `${fileNameClean}_${Date.now()}${ext}`,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { originalname, buffer, size } = req.file;
    const fileExtension = path.extname(originalname).toLowerCase();
    
    let fileUrl = '';
    let cloudId = '';

    if (isConfigured) {
      try {
        console.log('Uploading file to Cloudinary...');
        const cloudResult = await uploadToCloudinary(buffer, originalname);
        fileUrl = cloudResult.secure_url;
        cloudId = cloudResult.public_id;
        console.log('Cloudinary upload success:', fileUrl);
      } catch (err) {
        console.error('Cloudinary upload failed, falling back to local storage:', err.message);
      }
    }

    if (!fileUrl) {
      console.log('Using local fallback storage...');
      const uploadDir = path.join(__dirname, '..', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const fileNameClean = `${Date.now()}_${originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const localPath = path.join(uploadDir, fileNameClean);
      fs.writeFileSync(localPath, buffer);
      
      fileUrl = `/uploads/${fileNameClean}`;
      cloudId = `local_${fileNameClean}`;
    }

    console.log('Extracting text from file...');
    const extractedText = await extractText(buffer, fileExtension);
    console.log('Text extraction complete. Character length:', extractedText.length);

    if (!extractedText.trim()) {
      return res.status(400).json({ success: false, message: 'Extracted text is empty. Document might be scanned or image-based.' });
    }

    console.log('Chunking text into chunks of 500 characters...');
    const chunks = chunkText(extractedText, 500, 100);
    console.log(`Created ${chunks.length} chunks.`);

    const document = new Document({
      filename: originalname,
      cloudinaryUrl: fileUrl,
      cloudinaryId: cloudId,
      fileSize: size,
      fileType: fileExtension.substring(1), 
      chunksCount: chunks.length
    });

    const savedDoc = await document.save();

    const chunkDocs = chunks.map((text, idx) => ({
      documentId: savedDoc._id,
      text,
      chunkIndex: idx
    }));

    if (chunkDocs.length > 0) {
      await DocumentChunk.insertMany(chunkDocs);
    }

    res.status(201).json({
      success: true,
      message: 'Document uploaded and processed successfully',
      data: savedDoc
    });

  } catch (error) {
    console.error('Document upload and processing error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error processing document' });
  }
};

const getDocuments = async (req, res) => {
  try {
    const docs = await Document.find().sort({ createdAt: -1 });
    res.json({ success: true, count: docs.length, data: docs });
  } catch (error) {
    console.error('Get documents error:', error.message);
    res.status(500).json({ success: false, message: 'Error fetching documents' });
  }
};

const deleteDocument = async (req, res) => {
  const { id } = req.params;

  try {
    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    if (document.cloudinaryId && !document.cloudinaryId.startsWith('local_') && isConfigured) {
      try {
        console.log(`Deleting ${document.cloudinaryId} from Cloudinary...`);
        await cloudinary.uploader.destroy(document.cloudinaryId, { resource_type: 'raw' });
      } catch (err) {
        console.error('Failed to delete from Cloudinary:', err.message);
      }
    } else if (document.cloudinaryId && document.cloudinaryId.startsWith('local_')) {
      const filename = document.cloudinaryId.replace('local_', '');
      const localFilePath = path.join(__dirname, '..', 'uploads', filename);
      if (fs.existsSync(localFilePath)) {
        try {
          fs.unlinkSync(localFilePath);
          console.log(`Deleted local file: ${localFilePath}`);
        } catch (err) {
          console.error('Failed to delete local file:', err.message);
        }
      }
    }
    await DocumentChunk.deleteMany({ documentId: id });
    await Document.findByIdAndDelete(id);

    res.json({ success: true, message: 'Document and its chunks deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error.message);
    res.status(500).json({ success: false, message: 'Error deleting document' });
  }
};

module.exports = {
  uploadDocument,
  getDocuments,
  deleteDocument
};
