const prisma = require('../utils/prisma');

/**
 * Check if user has access to a file (owner or shared with them)
 */
async function hasFileAccess(fileId, userId) {
  const file = await prisma.file.findUnique({
    where: { id: fileId },
    include: { folder: true, dataRoom: true }
  });

  if (!file) return false;

  // Owner can access
  if (file.ownerId === userId) return true;

  // Check if file is shared with user
  const sharedAccess = await prisma.sharedAccess.findFirst({
    where: {
      userId,
      share: {
        fileId: fileId,
      },
    },
  });

  if (sharedAccess) return true;

  // Check if parent folder is shared with user
  if (file.folderId) {
    const folderSharedAccess = await prisma.sharedAccess.findFirst({
      where: {
        userId,
        share: {
          folderId: file.folderId,
        },
      },
    });
    if (folderSharedAccess) return true;
  }

  // Check if data room is shared with user
  if (file.dataRoomId) {
    const dataRoomSharedAccess = await prisma.sharedAccess.findFirst({
      where: {
        userId,
        share: {
          dataRoomId: file.dataRoomId,
        },
      },
    });
    if (dataRoomSharedAccess) return true;
  }

  return false;
}

/**
 * Check if user has access to a folder (owner or shared with them)
 */
async function hasFolderAccess(folderId, userId) {
  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    include: { dataRoom: true }
  });

  if (!folder) return false;

  // Owner can access
  if (folder.ownerId === userId) return true;

  // Check if folder is shared with user
  const sharedAccess = await prisma.sharedAccess.findFirst({
    where: {
      userId,
      share: {
        folderId: folderId,
      },
    },
  });

  if (sharedAccess) return true;

  // Check if parent data room is shared with user
  if (folder.dataRoomId) {
    const dataRoomSharedAccess = await prisma.sharedAccess.findFirst({
      where: {
        userId,
        share: {
          dataRoomId: folder.dataRoomId,
        },
      },
    });
    if (dataRoomSharedAccess) return true;
  }

  return false;
}

/**
 * Check if user has access to a data room (owner or shared with them)
 */
async function hasDataRoomAccess(dataRoomId, userId) {
  const dataRoom = await prisma.dataRoom.findUnique({
    where: { id: dataRoomId }
  });

  if (!dataRoom) return false;

  // Owner can access
  if (dataRoom.ownerId === userId) return true;

  // Check if data room is shared with user
  const sharedAccess = await prisma.sharedAccess.findFirst({
    where: {
      userId,
      share: {
        dataRoomId: dataRoomId,
      },
    },
  });

  return !!sharedAccess;
}

module.exports = {
  hasFileAccess,
  hasFolderAccess,
  hasDataRoomAccess,
};
