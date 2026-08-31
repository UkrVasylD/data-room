const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');
const prisma = require('../utils/prisma');
const { hasFileAccess } = require('../helpers/accessControl');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { realtime: { transport: WebSocket } }
);

module.exports = {
  upload: async (req, res) => {
    try {
      const { dataRoomId, folderId } = req.body;

      const dataRoom = await prisma.dataRoom.findUnique({
        where: { id: dataRoomId },
      });

      if (!dataRoom) {
        return res.status(404).json({ error: 'DataRoom not found' });
      }

      if (folderId && folderId !== '') {
        const folder = await prisma.folder.findUnique({
          where: { id: folderId },
        });

        if (!folder || folder.dataRoomId !== dataRoomId) {
          return res.status(404).json({ error: 'Folder not found in this DataRoom' });
        }
      }

      const timestamp = Date.now();
      const uniqueFilename = `${timestamp}-${req.file.originalname}`;
      const filePath = `${dataRoomId}/${uniqueFilename}`;

      const { data, error: uploadError } = await supabase.storage
        .from('files')
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
        });

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        return res.status(500).json({ error: 'Failed to upload file to storage' });
      }

      const { data: urlData } = supabase.storage
        .from('files')
        .getPublicUrl(filePath);

      const file = await prisma.file.create({
        data: {
          name: req.file.originalname,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          path: data.path,
          dataRoomId,
          folderId: folderId || null,
          ownerId: req.user.id,
        },
      });

      res.status(201).json({
        ...file,
        url: urlData.publicUrl,
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).json({ error: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const file = await prisma.file.findUnique({
        where: { id: req.params.id },
        include: { versions: true },
      });

      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      const hasAccess = await hasFileAccess(req.params.id, req.user.id);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const { data: urlData } = supabase.storage
        .from('files')
        .getPublicUrl(file.path);

      res.json({
        ...file,
        url: urlData.publicUrl,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getDownload: async (req, res) => {
    try {
      const file = await prisma.file.findUnique({
        where: { id: req.params.id },
      });

      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      const hasAccess = await hasFileAccess(req.params.id, req.user.id);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const { data: urlData } = supabase.storage
        .from('files')
        .getPublicUrl(file.path);

      res.json({ 
        url: urlData.publicUrl,
        name: file.originalName,
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      res.status(500).json({ error: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const { name } = req.body;
      const file = await prisma.file.updateMany({
        where: { id: req.params.id, ownerId: req.user.id },
        data: { name },
      });

      if (!file.count) {
        return res.status(404).json({ error: 'File not found' });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  move: async (req, res) => {
    try {
      const { folderId } = req.body;
      
      const file = await prisma.file.findUnique({
        where: { id: req.params.id },
        select: { id: true, ownerId: true, dataRoomId: true },
      });

      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      if (file.ownerId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      if (folderId && folderId !== '') {
        const folder = await prisma.folder.findUnique({
          where: { id: folderId },
          select: { dataRoomId: true },
        });

        if (!folder || folder.dataRoomId !== file.dataRoomId) {
          return res.status(404).json({ error: 'Target folder not found in this DataRoom' });
        }
      }

      await prisma.file.update({
        where: { id: req.params.id },
        data: { folderId: folderId || null },
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const file = await prisma.file.findUnique({
        where: { id: req.params.id },
      });

      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }
      
      if (file.ownerId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      const { error: deleteError } = await supabase.storage
        .from('files')
        .remove([file.path]);

      if (deleteError) {
        console.error('Supabase delete error:', deleteError);
      }

      await prisma.file.delete({
        where: { id: req.params.id },
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting file:', error);
      res.status(500).json({ error: error.message });
    }
  },
};
