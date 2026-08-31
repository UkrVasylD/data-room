const express = require('express');
const authMiddleware = require('../middleware/auth');
const dataRoomsController = require('../controllers/dataRoomsController');

const router = express.Router();
router.use(authMiddleware);

// Create DataRoom
router.post('/', dataRoomsController.create);

// Get all DataRooms for user
router.get('/', dataRoomsController.getAll);

// Get DataRoom by ID
router.get('/:id', dataRoomsController.getById);

// Update DataRoom name
router.patch('/:id', dataRoomsController.update);

// Delete DataRoom
router.delete('/:id', dataRoomsController.delete);

module.exports = router;
