const multer = require('multer');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Files are held in memory only long enough to hand them to Cloudinary —
// nothing is ever written to disk or to the database itself.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB per file
});

function uploadBuffer(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    stream.end(buffer);
  });
}

// Images use Cloudinary's image delivery. PDFs and other files use raw
// delivery so the original file remains available to the browser.
async function uploadFilesToCloudinary(files = []) {
  return Promise.all(
    files.map(async (f) => {
      const isImage = f.mimetype.startsWith('image/');
      const result = await uploadBuffer(f.buffer, {
        folder: 'study-tracker/sessions',
        resource_type: isImage ? 'image' : 'raw',
      });
      return {
        cloudinaryPublicId: result.public_id,
        secureUrl: result.secure_url,
        resourceType: result.resource_type,
        fileType: f.mimetype,
        originalFilename: f.originalname,
      };
    })
  );
}

module.exports = { upload, cloudinary, uploadFilesToCloudinary };
