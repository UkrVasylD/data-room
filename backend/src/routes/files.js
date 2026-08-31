const express = require('express');
const multer = require('multer');
const authMiddleware = require('../middleware/auth');
const filesController = require('../controllers/filesController');

const router = express.Router();
router.use(authMiddleware);

// Setup multer for memory storage (we'll upload to Supabase)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload file to Supabase Storage
router.post('/upload', upload.single('file'), filesController.upload);

// Get file metadata with public URL
router.get('/:id', filesController.getById);

// Download file from Supabase
router.get('/:id/download', filesController.getDownload);

// Update file name
router.patch('/:id', filesController.update);

// Move file to another folder
router.patch('/:id/move', filesController.move);

// Delete file
router.delete('/:id', filesController.delete);

module.exports = router;
