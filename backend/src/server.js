const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '.env.local' });

const authRoutes = require('./routes/auth');
const dataRoomRoutes = require('./routes/dataRooms');
const folderRoutes = require('./routes/folders');
const fileRoutes = require('./routes/files');
const shareRoutes = require('./routes/shares');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/data-rooms', dataRoomRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/shares', shareRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal Server Error' 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
