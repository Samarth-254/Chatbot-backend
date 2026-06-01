const cloudinary = require('cloudinary').v2;
const env = require('./env');

const isConfigured = !!(
  env.CLOUDINARY_CLOUD_NAME &&
  env.CLOUDINARY_API_KEY &&
  env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
  console.log('Cloudinary configured successfully.');
} else {
  console.warn('WARNING: Cloudinary credentials are not fully configured. File uploads to Cloudinary will fail unless configured in .env.');
}

module.exports = {
  cloudinary,
  isConfigured
};
