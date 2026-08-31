const express = require('express');
const authMiddleware = require('../middleware/auth');
const foldersController = require('../controllers/foldersController');

const router = express.Router();
router.use(authMiddleware);

// Create Folder
router.post('/', foldersController.create);

// Get Folder contents
router.get('/:id', foldersController.getById);

// Update Folder name
router.patch('/:id', foldersController.update);

// Delete Folder
router.delete('/:id', foldersController.delete);

module.exports = router;
