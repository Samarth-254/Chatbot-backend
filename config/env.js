const dotenv = require('dotenv');
dotenv.config();

const requiredEnvs = ['JWT_SECRET'];

const missingEnvs = requiredEnvs.filter(envVar => !process.env[envVar]);

if (missingEnvs.length > 0) {
  console.error(`ERROR: Missing required environment variables: ${missingEnvs.join(', ')}`);
  process.exit(1);
}

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/chatbot_db',
  JWT_SECRET: process.env.JWT_SECRET,
  FRONTEND_URL: process.env.FRONTEND_URL || '*',
  ADMIN_USERNAME: process.env.ADMIN_USERNAME,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  GROQ_API_KEY: process.env.GROQ_API_KEY
};