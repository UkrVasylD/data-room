const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');
const prisma = require('../utils/prisma');
const { hasFolderAccess } = require('../helpers/accessControl');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { realtime: { transport: WebSocket } }
);

module.exports = {
  create: async (req, res) => {
    try {
      const { name, dataRoomId, parentId } = req.body;
      const folder = await prisma.folder.create({
        data: {
          name,
          dataRoomId,
          parentId: parentId || null,
          ownerId: req.user.id,
        },
      });
      res.status(201).json(folder);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const folder = await prisma.folder.findUnique({
        where: { id: req.params.id },
        include: {
          children: true,
          files: true,
        },
      });

      if (!folder) {
        return res.status(404).json({ error: 'Folder not found' });
      }

      const hasAccess = await hasFolderAccess(req.params.id, req.user.id);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const filesWithUrls = folder.files.map((file) => {
        const { data: urlData } = supabase.storage
          .from('files')
          .getPublicUrl(file.path);
        
        return {
          ...file,
          url: urlData.publicUrl,
        };
      });

      res.json({
        ...folder,
        files: filesWithUrls,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const { name } = req.body;
      const folder = await prisma.folder.updateMany({
        where: { id: req.params.id, ownerId: req.user.id },
        data: { name },
      });
      if (!folder.count) {
        return res.status(404).json({ error: 'Folder not found' });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      await prisma.folder.deleteMany({
        where: { id: req.params.id, ownerId: req.user.id },
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};
