import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './DataRooms.css';

export default function DataRooms() {
  const [dataRooms, setDataRooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.id) {
      navigate('/login');
      return;
    }
    loadDataRooms();
  }, []);

  const loadDataRooms = async () => {
    try {
      const res = await api.get('/data-rooms');
      console.log('API Response:', res.data);
      setDataRooms(Array.isArray(res.data) ? res.data : res.data.dataRooms || []);
    } catch (err) {
      console.error('Error loading data rooms:', err);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    
    try {
      const res = await api.post('/data-rooms', { name: newRoomName });
      setDataRooms([...dataRooms, res.data]);
      setNewRoomName('');
    } catch (err) {
      console.error('Error creating room:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="data-rooms-container">
      <div className="header">
        <h1>📂 My Data Rooms</h1>
        <div className="header-actions">
          <button 
            onClick={() => navigate('/shared-with-me')} 
            className="shared-btn"
          >
            📤 Shared with Me
          </button>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </div>

      <form onSubmit={handleCreateRoom} className="create-room-form">
        <input
          type="text"
          placeholder="New Data Room Name"
          value={newRoomName}
          onChange={(e) => setNewRoomName(e.target.value)}
          required
        />
        <button type="submit">Create Room</button>
      </form>

      <div className="rooms-grid">
        {dataRooms.map((room) => (
          <div
            key={room.id}
            className="room-card"
            onClick={() => navigate(`/room/${room.id}`)}
          >
            <h3>{room.name}</h3>
            <p>{room.files?.length || 0} files</p>
            <p>{room.folders?.length || 0} folders</p>
          </div>
        ))}
      </div>
    </div>
  );
}
