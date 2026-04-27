import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary, { hasCloudinaryConfig } from './cloudinary.js';

const storage = hasCloudinaryConfig
  ? new CloudinaryStorage({
      cloudinary,
      params: {
        folder: 'restaurant-menu',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
      },
    })
  : multer.memoryStorage();

const upload = multer({ storage });

export default upload;
