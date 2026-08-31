const crypto = require('crypto');
const prisma = require('../utils/prisma');

module.exports = {
  // Create share (public or permissioned)
  create: async (req, res) => {
    try {
      const { type, dataRoomId, folderId, fileId, emails, userIds, expiresAt } = req.body;

      const token = type === 'public' ? crypto.randomBytes(32).toString('hex') : null;

      const share = await prisma.share.create({
        data: {
          type,
          token,
          dataRoomId: dataRoomId || null,
          folderId: folderId || null,
          fileId: fileId || null,
          ownerId: req.user.id,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        },
      });

      // Add permissioned users
      let usersToAdd = userIds || [];
      
      if (emails && emails.length > 0) {
        const foundUsers = await prisma.user.findMany({
          where: {
            email: { in: emails },
          },
          select: { id: true },
        });
        
        usersToAdd = [...usersToAdd, ...foundUsers.map(u => u.id)];
      }

      // Remove duplicates
      usersToAdd = [...new Set(usersToAdd)];

      if (usersToAdd.length > 0) {
        await prisma.sharedAccess.createMany({
          data: usersToAdd.map(userId => ({ shareId: share.id, userId })),
        });
      }

      // Return share with shared users
      const shareWithUsers = await prisma.share.findUnique({
        where: { id: share.id },
        include: { sharedWith: { include: { user: { select: { id: true, email: true, name: true } } } } },
      });

      res.status(201).json(shareWithUsers);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Search user by email
  searchUser: async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { email: req.params.email },
        select: { id: true, email: true, name: true },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get shares shared with current user
  getSharedWithMe: async (req, res) => {
    try {
      const shares = await prisma.sharedAccess.findMany({
        where: { userId: req.user.id },
        include: { 
          share: {
            include: { 
              owner: { select: { id: true, email: true, name: true } },
              dataRoom: { select: { id: true, name: true } },
              folder: { select: { id: true, name: true } },
              file: { select: { id: true, name: true } },
            },
          },
        },
      });
      res.json(shares);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get shared item by token (public link) - БЕЗ AUTH!
  getPublic: async (req, res) => {
    try {
      const share = await prisma.share.findUnique({
        where: { token: req.params.token },
        include: {
          dataRoom: { include: { folders: true, files: true } },
          folder: { include: { children: true, files: true } },
          file: true,
        },
      });

      if (!share) {
        return res.status(404).json({ error: 'Share not found' });
      }

      if (share.expiresAt && share.expiresAt < new Date()) {
        return res.status(403).json({ error: 'Share expired' });
      }

      res.json(share);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get shares for user (owned shares)
  getAll: async (req, res) => {
    try {
      const shares = await prisma.share.findMany({
        where: { ownerId: req.user.id },
        include: { 
          sharedWith: { include: { user: { select: { id: true, email: true, name: true } } } },
          dataRoom: { select: { id: true, name: true } },
          folder: { select: { id: true, name: true } },
          file: { select: { id: true, name: true } },
        },
      });
      res.json(shares);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Revoke share
  delete: async (req, res) => {
    try {
      await prisma.share.deleteMany({
        where: { id: req.params.id, ownerId: req.user.id },
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};
