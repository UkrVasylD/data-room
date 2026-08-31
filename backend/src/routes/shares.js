const express = require('express');
const authMiddleware = require('../middleware/auth');
const sharesController = require('../controllers/sharesController');

const router = express.Router();

// Create share (public or permissioned)
router.post('/', authMiddleware, sharesController.create);

// Search user by email
router.get('/search/:email', authMiddleware, sharesController.searchUser);

// Get shares shared with current user
router.get('/shared-with/me', authMiddleware, sharesController.getSharedWithMe);

// Get shared item by token (public link) - БЕЗ AUTH!
router.get('/public/:token', sharesController.getPublic);

// Get shares for user (owned shares)
router.get('/', authMiddleware, sharesController.getAll);

// Revoke share
router.delete('/:id', authMiddleware, sharesController.delete);

module.exports = router;
