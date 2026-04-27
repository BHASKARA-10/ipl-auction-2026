import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import { MonitorPlay, Smartphone, Settings, Users, IndianRupee, Globe, DoorOpen, Badge } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  
  const [adminName, setAdminName] = useState(currentUser?.name || '');
  const [budget, setBudget] = useState(100);
  const [maxSquad, setMaxSquad] = useState(25);
  const [maxForeign, setMaxForeign] = useState(8);
  
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState(currentUser?.name || '');
  const [joinTeamName, setJoinTeamName] = useState('');
  const [takenTeams, setTakenTeams] = useState([]);

  useEffect(() => {
    socket.on('roomStatus', (status) => {
      setTakenTeams(status.takenTeams || []);
    });
    return () => socket.off('roomStatus');
  }, []);

  const handleJoinCodeChange = (e) => {
    const code = e.target.value.toUpperCase();
    setJoinCode(code);
    if (code.length === 6) {
      socket.emit('checkRoom', code);
    } else {
      setTakenTeams([]);
    }
  };

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (adminName) {
      const rules = { budget: Number(budget) * 100, maxSquad: Number(maxSquad), maxForeign: Number(maxForeign) };
      socket.emit('createRoom', { adminName, rules });
      socket.once('roomCreated', ({ roomId, roomState }) => {
        navigate(`/room/${roomId}/lobby`, { state: { role: 'admin', room: roomState } });
      });
    }
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (joinCode && joinName && joinTeamName) {
      socket.emit('joinRoom', { roomId: joinCode.toUpperCase(), userName: joinName, teamName: joinTeamName });
      socket.once('joinedRoom', ({ roomId, roomState }) => {
        navigate(`/room/${roomId}/lobby`, { state: { role: 'team', user: roomState.users[socket.id], room: roomState } });
      });
      socket.once('error', (msg) => {
        alert(msg);
      });
    }
  };

  return (
    <div className="home-page">
      <h1 className="title-glow">IPL AUCTION 2026</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem', fontSize: '1.25rem' }}>
        The ultimate real-time multiplayer bidding experience.
      </p>

      <div className="join-options">
        {/* Admin Section */}
        <div className="glass-panel">
          <h2 style={{ marginBottom: '0.5rem', color: 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MonitorPlay size={28} /> Auctioneer (Host)
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Host the auction on a big screen and control the flow.
          </p>
          <form onSubmit={handleCreateRoom}>
            <div className="form-group">
              <label>Your Name</label>
              <input 
                type="text" 
                className="form-control" 
                value={adminName} 
                onChange={(e) => setAdminName(e.target.value)} 
                required 
              />
            </div>
            <div className="form-group">
              <label><IndianRupee size={14} style={{verticalAlign: 'middle'}}/> Purse per Team (Crores)</label>
              <input 
                type="number" 
                className="form-control" 
                value={budget} 
                onChange={(e) => setBudget(e.target.value)} 
                min="10"
                step="5"
                required 
              />
              <small style={{ color: 'var(--text-secondary)' }}>e.g. 100 = 100 Crores</small>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                <label><Users size={14} style={{verticalAlign: 'middle'}}/> Max Squad Size</label>
                <input 
                    type="number" 
                    className="form-control" 
                    value={maxSquad} 
                    onChange={(e) => setMaxSquad(e.target.value)} 
                    required 
                />
                </div>
                <div className="form-group">
                <label><Globe size={14} style={{verticalAlign: 'middle'}}/> Max Overseas</label>
                <input 
                    type="number" 
                    className="form-control" 
                    value={maxForeign} 
                    onChange={(e) => setMaxForeign(e.target.value)} 
                    required 
                />
                </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
              Create Auction Room
            </button>
          </form>
        </div>

        {/* Team Section */}
        <div className="glass-panel">
          <h2 style={{ marginBottom: '0.5rem', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Smartphone size={28} /> Join as Team
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Join from your phone to bid on players.
          </p>
          <form onSubmit={handleJoinRoom}>
            <div className="form-group">
              <label>Room Code</label>
              <input 
                type="text" 
                className="form-control" 
                value={joinCode} 
                onChange={handleJoinCodeChange} 
                style={{ textTransform: 'uppercase', letterSpacing: '2px', fontSize: '1.5rem', textAlign: 'center' }}
                required 
              />
              {joinCode.length === 6 && takenTeams.length > 0 && (
                <small style={{ color: 'var(--accent-red)' }}>{takenTeams.length} teams already joined</small>
              )}
            </div>
            <div className="form-group">
              <label>Manager Name</label>
              <input 
                type="text" 
                className="form-control" 
                value={joinName} 
                onChange={(e) => setJoinName(e.target.value)} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Team Name</label>
              <select 
                className="form-control" 
                value={joinTeamName} 
                onChange={(e) => setJoinTeamName(e.target.value)} 
                required 
              >
                <option value="">Select a Team</option>
                {!takenTeams.includes("CSK") && <option value="CSK">Chennai Super Kings (CSK)</option>}
                {!takenTeams.includes("MI") && <option value="MI">Mumbai Indians (MI)</option>}
                {!takenTeams.includes("RCB") && <option value="RCB">Royal Challengers Bengaluru (RCB)</option>}
                {!takenTeams.includes("KKR") && <option value="KKR">Kolkata Knight Riders (KKR)</option>}
                {!takenTeams.includes("DC") && <option value="DC">Delhi Capitals (DC)</option>}
                {!takenTeams.includes("RR") && <option value="RR">Rajasthan Royals (RR)</option>}
                {!takenTeams.includes("PBKS") && <option value="PBKS">Punjab Kings (PBKS)</option>}
                {!takenTeams.includes("SRH") && <option value="SRH">Sunrisers Hyderabad (SRH)</option>}
                {!takenTeams.includes("LSG") && <option value="LSG">Lucknow Super Giants (LSG)</option>}
                {!takenTeams.includes("GT") && <option value="GT">Gujarat Titans (GT)</option>}
              </select>
            </div>
            <button type="submit" className="btn btn-gold" style={{ width: '100%', marginTop: '1rem' }}>
              Enter Auction
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
