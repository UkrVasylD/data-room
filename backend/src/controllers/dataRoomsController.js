const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');
const prisma = require('../utils/prisma');
const { hasDataRoomAccess } = require('../helpers/accessControl');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { realtime: { transport: WebSocket } }
);

const dataRoomsController = {
  create: async (req, res) => {
    try {
      const { name } = req.body;
      const dataRoom = await prisma.dataRoom.create({
        data: {
          name,
          ownerId: req.user.id,
        },
      });
      res.status(201).json(dataRoom);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getAll: async (req, res) => {
    try {
      const dataRooms = await prisma.dataRoom.findMany({
        where: { ownerId: req.user.id },
        include: { folders: true, files: true },
      });
      res.json(dataRooms);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const dataRoom = await prisma.dataRoom.findUnique({
        where: { id: req.params.id },
        include: { 
          folders: { 
            where: { parentId: null },
            select: { id: true, name: true, parentId: true }
          },
          files: { where: { folderId: null } }  
        },
      });
      
      if (!dataRoom) {
        return res.status(404).json({ error: 'DataRoom not found' });
      }

      const hasAccess = await hasDataRoomAccess(req.params.id, req.user.id);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const filesWithUrls = dataRoom.files.map((file) => {
        const { data: urlData } = supabase.storage
          .from('files')
          .getPublicUrl(file.path);
        
        return {
          ...file,
          url: urlData.publicUrl,
        };
      });

      res.json({
        ...dataRoom,
        files: filesWithUrls,
      });
    } catch (error) {
      console.error('Error fetching DataRoom by ID:', error);
      res.status(500).json({ error: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const { name } = req.body;
      const dataRoom = await prisma.dataRoom.updateMany({
        where: { id: req.params.id, ownerId: req.user.id },
        data: { name },
      });
      if (!dataRoom.count) {
        return res.status(404).json({ error: 'DataRoom not found' });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const dataRoom = await prisma.dataRoom.deleteMany({
        where: { id: req.params.id, ownerId: req.user.id },
      });
      if (!dataRoom.count) {
        return res.status(404).json({ error: 'DataRoom not found' });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = dataRoomsController;
