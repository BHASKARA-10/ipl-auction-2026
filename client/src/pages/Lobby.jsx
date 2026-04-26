import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { socket } from '../socket';
import { Users, Play, Copy, Check } from 'lucide-react';

export default function Lobby() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [roomState, setRoomState] = useState(location.state?.room || null);
  const role = location.state?.role || 'team';
  const currentUser = location.state?.user || null;
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (!roomState) {
      navigate('/');
      return;
    }

    const handleRoomUpdate = (updatedRoom) => {
      setRoomState(updatedRoom);
      if (updatedRoom.auctionState === 'bidding' || updatedRoom.auctionState === 'sold' || updatedRoom.auctionState === 'unsold') {
        navigate(`/room/${roomId}/auction`, { state: { role, user: currentUser, room: updatedRoom } });
      }
    };

    socket.on('roomUpdated', handleRoomUpdate);

    return () => {
      socket.off('roomUpdated', handleRoomUpdate);
    };
  }, [roomId, roomState, navigate, role, currentUser]);

  if (!roomState) return <div>Loading...</div>;

  const users = Object.values(roomState.users);
  const isAdmin = role === 'admin';

  const handleStartAuction = () => {
    // Start with Batter by default
    socket.emit('nextPlayer', { roomId, category: 'Batter' });
  };

  return (
    <div className="lobby-page">
      <div className="glass-panel header-row">
        <div>
          <h2>Auction Lobby</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            {isAdmin ? "Wait for teams to join before starting." : "Waiting for auctioneer to start..."}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>ROOM CODE</div>
          <div className="room-code-display" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem 1rem' }}>
            {roomId}
            <button onClick={copyCode} style={{ background: 'var(--accent-gold)', border: 'none', borderRadius: '8px', padding: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Copy Code">
                {copied ? <Check size={20} color="black" /> : <Copy size={20} color="black" />}
            </button>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={24} /> Registered Teams ({users.length})
          </h3>
          {isAdmin && (
            <button className="btn btn-primary" onClick={handleStartAuction} disabled={users.length === 0}>
              <Play size={20} /> {users.length === 0 ? 'Waiting for Teams...' : 'Start Auction'}
            </button>
          )}
        </div>

        <div className="users-grid">
          {users.map(user => (
            <div key={user.id} className="user-card">
              <div className="user-avatar">
                {user.teamName.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>{user.teamName}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Manager: {user.name}
                </div>
              </div>
            </div>
          ))}
          {users.length === 0 && <div style={{ color: 'var(--text-secondary)' }}>No teams joined yet. Share the room code!</div>}
        </div>
      </div>
    </div>
  );
}
