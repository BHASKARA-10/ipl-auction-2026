import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { socket } from '../socket';
import { Gavel, Clock, Users, X, Check, Database, Trophy, Star, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuctionRoom() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [roomState, setRoomState] = useState(location.state?.room || null);
  const role = location.state?.role || 'team';
  const [currentUser, setCurrentUser] = useState(location.state?.user || null);
  const [timer, setTimer] = useState(15);
  const [selectedCategory, setSelectedCategory] = useState('Batter');
  const [showDatabase, setShowDatabase] = useState(false);
  const [viewingSquad, setViewingSquad] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [activeNote, setActiveNote] = useState('');

  useEffect(() => {
    if (!roomState) {
      navigate('/');
      return;
    }

    socket.on('roomUpdated', (updatedRoom) => {
      setRoomState(updatedRoom);
      if (role === 'team' && updatedRoom.users[socket.id]) {
        setCurrentUser(updatedRoom.users[socket.id]);
      }
    });

    socket.on('timerUpdate', (time) => {
      setTimer(time);
    });

    const handleConnect = () => {
        if (role === 'team' && currentUser) {
            socket.emit('joinRoom', { roomId, userName: currentUser.name, teamName: currentUser.teamName });
        } else if (role === 'admin') {
            socket.emit('adminRejoin', { roomId });
        }
    };
    socket.on('connect', handleConnect);

    socket.on('adminNote', (note) => {
      setActiveNote(note);
      setTimeout(() => setActiveNote(''), 8000);
    });

    return () => {
      socket.off('roomUpdated');
      socket.off('timerUpdate');
      socket.off('adminNote');
      socket.off('connect', handleConnect);
    };
  }, [navigate, roomState, role, currentUser, roomId]);

  if (!roomState) return <div>Loading...</div>;

  const player = roomState.currentPlayer;
  const isAdmin = role === 'admin';
  const usersList = Object.values(roomState.users);

  // --- Actions ---
  const handleBid = () => { socket.emit('placeBid', { roomId }); };
  const handleNextPlayer = () => { socket.emit('nextPlayer', { roomId, category: selectedCategory }); };
  const handleSell = () => { socket.emit('sellPlayer', { roomId }); };
  const handleUnsold = () => { socket.emit('unsoldPlayer', { roomId }); };
  const handleSendNote = () => {
      if (adminNoteInput.trim()) {
          socket.emit('sendAdminNote', { roomId, note: adminNoteInput.trim() });
          setAdminNoteInput('');
      }
  };

  const playTickSound = () => {
      try {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (!AudioContext) return;
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(1000, ctx.currentTime);
          gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
          osc.connect(gainNode);
          gainNode.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.1);
      } catch(e){}
  };

  useEffect(() => {
      if (roomState && roomState.auctionState === 'bidding' && timer <= 3 && timer > 0) {
          playTickSound();
      }
  }, [timer, roomState?.auctionState]);

  // --- Calculated Values ---
  const currentBidderName = roomState.currentBidder ? roomState.users[roomState.currentBidder]?.teamName : 'None';
  
  const getNextBidAmount = (current) => {
      if (!player) return 0;
      if (current === 0) return player.basePrice;
      if (current < 100) return current + 5;
      if (current < 200) return current + 10;
      return current + 20;
  };

  const nextBid = getNextBidAmount(roomState.currentBid);
  
  let canAfford = false;
  let squadFull = false;
  let foreignLimit = false;

  if (!isAdmin && currentUser) {
      canAfford = currentUser.budget >= nextBid;
      squadFull = currentUser.squad.length >= roomState.rules.maxSquad;
      if (player && player.nationality === 'Overseas') {
          foreignLimit = currentUser.foreignCount >= roomState.rules.maxForeign;
      }
  }

  const canBid = canAfford && !squadFull && !foreignLimit;

  // --- Components ---
  const renderPlayerCard = () => (
    <div className="glass-panel" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {player ? (
        <AnimatePresence mode="wait">
            <motion.div 
            key={player.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="player-card"
            style={{ alignItems: 'center' }}
            >
            <div className="player-image-container" style={{ flexShrink: 0 }}>
                <img src={player.image} alt={player.name} />
                {(roomState.auctionState === 'sold' || roomState.auctionState === 'unsold') && (
                <motion.div 
                    initial={{ scale: 3, opacity: 0, x: "-50%", y: "-50%", rotate: -15 }}
                    animate={{ scale: 1, opacity: 1, x: "-50%", y: "-50%", rotate: -15 }}
                    className="sold-stamp"
                    style={{ 
                    color: roomState.auctionState === 'sold' ? 'var(--accent-red)' : '#6b7280',
                    borderColor: roomState.auctionState === 'sold' ? 'var(--accent-red)' : '#6b7280'
                    }}
                >
                    {roomState.auctionState.toUpperCase()}
                </motion.div>
                )}
            </div>

            <div className="player-info" style={{ textAlign: 'left', flex: 1 }}>
                <div className="player-role">{player.role} • {player.nationality}</div>
                <h1 className="player-name" style={{ fontSize: '3rem' }}>{player.name}</h1>
                
                <div className="player-stats" style={{ gridTemplateColumns: '1fr', marginBottom: '2rem' }}>
                    <div className="stat-box" style={{ background: 'linear-gradient(45deg, rgba(236,72,153,0.2), transparent)', maxWidth: '300px' }}>
                        <div className="stat-label">Base Price</div>
                        <div className="stat-value" style={{ color: 'var(--accent-gold)' }}>₹{player.basePrice}L</div>
                    </div>
                </div>

                <div className="bidding-area glass-panel" style={{ background: 'rgba(0,0,0,0.4)', padding: isAdmin ? '1.5rem' : '1rem' }}>
                <div className={`timer ${timer <= 5 ? 'pulse' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                    <Clock size={isAdmin ? 32 : 24} /> 00:{timer.toString().padStart(2, '0')}
                </div>
                
                <div style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.875rem' }}>
                    Current Bid
                </div>
                <div className="current-bid" style={{ fontSize: '4rem' }}>
                    ₹{roomState.currentBid}L
                </div>
                <div className="highest-bidder">
                    Bidder: <strong style={{ color: 'white' }}>{currentBidderName}</strong>
                </div>

                {!isAdmin && roomState.auctionState === 'bidding' && (
                    <div className="bid-button-container" style={{ width: '100%' }}>
                    <button 
                        className="btn btn-gold btn-bid" 
                        onClick={handleBid}
                        disabled={!canBid}
                        style={{ 
                            width: '100%', 
                            padding: '1.5rem', 
                            fontSize: '2rem',
                            opacity: canBid ? 1 : 0.5, 
                            cursor: canBid ? 'pointer' : 'not-allowed' 
                        }}
                    >
                        <Gavel size={32} style={{ marginRight: '0.5rem' }} />
                        BID ₹{nextBid}L
                    </button>
                    {!canAfford && <div style={{ color: 'var(--accent-red)', marginTop: '0.5rem' }}>Insufficient Funds</div>}
                    {squadFull && <div style={{ color: 'var(--accent-red)', marginTop: '0.5rem' }}>Squad Full</div>}
                    {foreignLimit && <div style={{ color: 'var(--accent-red)', marginTop: '0.5rem' }}>Overseas Limit Reached</div>}
                    </div>
                )}
                </div>
            </div>
            </motion.div>
        </AnimatePresence>
        ) : (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <h1 className="title-glow">Waiting for Auctioneer...</h1>
        </div>
        )}
    </div>
  );

  return (
    <>
      <AnimatePresence>
        {activeNote && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            style={{
                position: 'fixed', top: 0, left: 0, right: 0,
                background: 'linear-gradient(45deg, var(--accent-red), var(--accent-pink))',
                padding: '0.75rem 2rem', zIndex: 9999,
                fontWeight: 'bold', fontSize: '1.25rem', color: 'white',
                boxShadow: '0 4px 20px rgba(236,72,153,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                textTransform: 'uppercase', letterSpacing: '1px'
            }}
          >
            <AlertCircle size={24} /> {activeNote}
          </motion.div>
        )}
      </AnimatePresence>
      <div className={`auction-layout ${isAdmin ? 'admin-layout' : 'mobile-layout'}`}>
      
      {/* Main Column */}
      <div className="main-stage">
        <div className="glass-panel header-row" style={{ padding: '1rem 2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', margin: 0 }}>IPL AUCTION</h2>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Room: {roomId} | Role: {isAdmin ? 'Auctioneer' : currentUser?.teamName}</div>
          </div>
          {!isAdmin && (
             <div style={{ textAlign: 'right', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <button className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', padding: '0.5rem 1rem', fontSize: '0.875rem' }} onClick={() => setShowDatabase(true)}>
                  <Database size={16} /> Players
                </button>
             </div>
          )}
          {isAdmin && (
             <div style={{ textAlign: 'right', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', background: 'rgba(0,0,0,0.5)', borderRadius: '8px', padding: '0.25rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <input 
                        type="text" 
                        placeholder="Broadcast Note..." 
                        value={adminNoteInput}
                        onChange={(e) => setAdminNoteInput(e.target.value)}
                        onKeyDown={(e) => { if(e.key === 'Enter') handleSendNote(); }}
                        style={{ background: 'transparent', border: 'none', color: 'white', padding: '0.5rem', outline: 'none', width: '200px' }}
                    />
                    <button onClick={handleSendNote} style={{ background: 'var(--accent-pink)', border: 'none', borderRadius: '4px', padding: '0 1rem', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>SEND</button>
                </div>
                <button className="btn" style={{ background: 'var(--accent-gold)', color: '#451a03' }} onClick={() => setShowLeaderboard(true)}>
                  <Trophy size={20} /> Winner Engine
                </button>
                <button className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }} onClick={() => setShowDatabase(true)}>
                  <Database size={20} /> View Database
                </button>
             </div>
          )}
        </div>

        {/* Horizontal Team Purses Bar */}
        <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', padding: '0.75rem 2rem', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.05)' }} className="hide-scrollbar">
           {Object.values(roomState.users).filter(u => u.teamName).map(teamUser => (
              <div 
                 key={teamUser.id} 
                 onClick={() => setViewingSquad(teamUser)}
                 style={{ 
                     cursor: 'pointer', 
                     background: teamUser.id === currentUser?.id ? 'var(--accent-gold)' : 'rgba(255,255,255,0.1)', 
                     color: teamUser.id === currentUser?.id ? 'black' : 'white', 
                     padding: '0.5rem 1rem', 
                     borderRadius: '50px', 
                     whiteSpace: 'nowrap', 
                     display: 'flex', 
                     alignItems: 'center', 
                     gap: '0.5rem', 
                     fontWeight: 'bold',
                     border: teamUser.id === currentUser?.id ? '2px solid white' : '1px solid rgba(255,255,255,0.2)',
                     transition: 'transform 0.2s'
                 }}
                 onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                 onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                 title={`View ${teamUser.teamName} Squad`}
              >
                 {teamUser.teamName}: ₹{teamUser.budget}L
              </div>
           ))}
        </div>

        {/* Admin Dashboard Controls */}
        {isAdmin && (
            <div className="glass-panel" style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem 2rem', flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 'bold' }}>Categories:</div>
                {['Batter', 'Bowler', 'All-Rounder', 'Wicket Keeper', 'Unsold'].map(cat => (
                    <button 
                        key={cat}
                        className={`btn ${selectedCategory === cat ? 'btn-primary' : ''}`}
                        style={{ background: selectedCategory !== cat ? 'rgba(255,255,255,0.1)' : '', padding: '0.5rem 1rem', fontSize: '1rem' }}
                        onClick={() => setSelectedCategory(cat)}
                    >
                        {cat} ({roomState.categories[cat]?.length || 0})
                    </button>
                ))}
                
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button className="btn btn-gold" onClick={handleNextPlayer}>
                        Next {selectedCategory}
                    </button>
                    {roomState.auctionState === 'bidding' && (
                        <>
                        <button className="btn" style={{ background: 'var(--accent-red)', color: 'white' }} onClick={handleUnsold}>
                            <X size={18} /> Unsold
                        </button>
                        <button className="btn" style={{ background: 'var(--accent-green)', color: 'white' }} onClick={handleSell}>
                            <Check size={18} /> Sell Now
                        </button>
                        </>
                    )}
                </div>
            </div>
        )}

        {renderPlayerCard()}
      </div>

      {/* Sidebar - Only visible to Admin or on Desktop */}
      {isAdmin && (
        <div className="sidebar" style={{ flex: 1 }}>
            <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={20} /> Teams ({usersList.length})
            </h3>
            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
                {usersList.map(user => (
                <div 
                    key={user.id} 
                    className="team-list-item" 
                    style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                    onClick={() => setViewingSquad(user)}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.4)'}
                >
                    <div>
                    <div style={{ fontWeight: 600 }}>{user.teamName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {user.squad.length}/{roomState.rules.maxSquad} Plyrs | {user.foreignCount}/{roomState.rules.maxForeign} OS
                    </div>
                    </div>
                    <div style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--accent-gold)' }}>
                    ₹{user.budget}L
                    </div>
                </div>
                ))}
            </div>
            </div>

            <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', maxHeight: '400px' }}>
            <h3 style={{ marginBottom: '1rem' }}>Activity Log</h3>
            <div className="logs-container" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.5rem' }}>
                <LogViewer roomId={roomId} />
            </div>
            </div>
        </div>
      )}

      {showDatabase && (
        <PlayerDatabaseModal 
            players={roomState.allPlayersStatus} 
            onClose={() => setShowDatabase(false)} 
        />
      )}

      {viewingSquad && (
          <TeamSquadModal 
              user={viewingSquad} 
              onClose={() => setViewingSquad(null)} 
              isCurrentUser={currentUser && currentUser.id === viewingSquad.id}
              roomId={roomId}
          />
      )}

      {showLeaderboard && (
          <LeaderboardModal 
              users={usersList} 
              onClose={() => setShowLeaderboard(false)} 
          />
      )}
    </div>
    </>
  );
}

function LeaderboardModal({ users, onClose }) {
    useEffect(() => {
        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js";
        script.onload = () => {
            if (window.confetti) {
                const duration = 3000;
                const end = Date.now() + duration;
                (function frame() {
                    window.confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#fbbf24', '#ec4899', '#06b6d4'] });
                    window.confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#fbbf24', '#ec4899', '#06b6d4'] });
                    if (Date.now() < end) requestAnimationFrame(frame);
                }());
            }
        };
        document.body.appendChild(script);
        return () => { if (document.body.contains(script)) document.body.removeChild(script); }
    }, []);

    const rankedUsers = [...users].map(u => ({
        ...u,
        totalRating: (u.playingXI || []).reduce((sum, p) => sum + (p.rating || 0), 0) + Math.floor(u.budget / 100)
    })).sort((a, b) => b.totalRating - a.totalRating);

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', border: '2px solid var(--accent-gold)' }}>
                <div style={{ padding: '2rem', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'linear-gradient(45deg, #451a03, transparent)' }}>
                    <Trophy size={48} color="var(--accent-gold)" style={{ marginBottom: '1rem' }} />
                    <h1 style={{ margin: 0, fontSize: '3rem', color: 'var(--accent-gold)' }}>FINAL LEADERBOARD</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Based on Playing XI strength + Remaining Wallet Bonus</p>
                </div>
                
                <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
                    {rankedUsers.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No teams available.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {rankedUsers.map((user, idx) => (
                                <div key={user.id} style={{ 
                                    background: idx === 0 ? 'linear-gradient(135deg, rgba(251,191,36,0.2), transparent)' : 'rgba(255,255,255,0.05)', 
                                    border: idx === 0 ? '2px solid var(--accent-gold)' : '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '2rem' 
                                }}>
                                    <div style={{ fontSize: '3rem', fontWeight: 900, color: idx === 0 ? 'var(--accent-gold)' : 'rgba(255,255,255,0.5)' }}>
                                        #{idx + 1}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{user.teamName}</div>
                                        <div style={{ color: 'var(--text-secondary)' }}>{user.name} | Playing XI: {(user.playingXI || []).length}/11</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>FINAL SCORE</div>
                                        <div style={{ fontSize: '2rem', fontWeight: 900, color: idx === 0 ? 'var(--accent-gold)' : 'var(--accent-cyan)' }}>
                                            {user.totalRating} <Star size={20} style={{verticalAlign: 'middle', display: 'inline-block'}}/>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                    <button className="btn btn-gold" onClick={onClose}>Close Leaderboard</button>
                </div>
            </div>
        </div>
    );
}

function TeamSquadModal({ user, onClose, isCurrentUser, roomId }) {
    const [bench, setBench] = useState(user.squad.filter(p => !(user.playingXI || []).find(x => x.id === p.id)));
    const [playingXI, setPlayingXI] = useState(user.playingXI || []);

    const onDragStart = (e, player, from) => {
        if (!isCurrentUser) return;
        e.dataTransfer.setData("player", JSON.stringify(player));
        e.dataTransfer.setData("from", from);
    }

    const onDrop = (e, to) => {
        if (!isCurrentUser) return;
        e.preventDefault();
        const player = JSON.parse(e.dataTransfer.getData("player"));
        const from = e.dataTransfer.getData("from");

        if (from === to) return;

        let newBench = [...bench];
        let newXI = [...playingXI];

        if (to === "XI" && playingXI.length < 11) {
            newBench = bench.filter(p => p.id !== player.id);
            newXI.push(player);
        } else if (to === "Bench") {
            newXI = playingXI.filter(p => p.id !== player.id);
            newBench.push(player);
        }

        setBench(newBench);
        setPlayingXI(newXI);
        socket.emit('updatePlayingXI', { roomId, playingXI: newXI });
    }

    const movePlayerUp = (index) => {
        if (index > 0) {
            const newXI = [...playingXI];
            [newXI[index - 1], newXI[index]] = [newXI[index], newXI[index - 1]];
            setPlayingXI(newXI);
            socket.emit('updatePlayingXI', { roomId, playingXI: newXI });
        }
    };

    const movePlayerDown = (index) => {
        if (index < playingXI.length - 1) {
            const newXI = [...playingXI];
            [newXI[index + 1], newXI[index]] = [newXI[index], newXI[index + 1]];
            setPlayingXI(newXI);
            socket.emit('updatePlayingXI', { roomId, playingXI: newXI });
        }
    };

    const renderPlayerMini = (p, from, index) => (
        <div 
            key={p.id} 
            draggable={isCurrentUser}
            onDragStart={(e) => onDragStart(e, p, from)}
            style={{ 
                background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.5rem', 
                border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '0.5rem',
                cursor: isCurrentUser ? 'grab' : 'default', opacity: isCurrentUser ? 1 : 0.8
            }}
        >
            <div style={{ width: '40px', height: '40px', borderRadius: '4px', overflow: 'hidden' }}>
                <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>{p.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{p.role}</div>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--accent-gold)' }}>₹{p.soldPrice}L</div>
            {from === 'XI' && isCurrentUser && (
                <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', marginLeft: '0.5rem' }}>
                    <button 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); movePlayerUp(index); }} 
                        disabled={index === 0}
                        style={{ 
                            background: index === 0 ? 'transparent' : 'rgba(255,255,255,0.15)', 
                            border: '1px solid ' + (index === 0 ? 'transparent' : 'rgba(255,255,255,0.3)'), 
                            color: index === 0 ? 'rgba(255,255,255,0.2)' : 'white', 
                            cursor: index === 0 ? 'not-allowed' : 'pointer', 
                            padding: '10px 14px', borderRadius: '8px', fontSize: '14px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                    >▲</button>
                    <button 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); movePlayerDown(index); }} 
                        disabled={index === playingXI.length - 1}
                        style={{ 
                            background: index === playingXI.length - 1 ? 'transparent' : 'rgba(255,255,255,0.15)', 
                            border: '1px solid ' + (index === playingXI.length - 1 ? 'transparent' : 'rgba(255,255,255,0.3)'), 
                            color: index === playingXI.length - 1 ? 'rgba(255,255,255,0.2)' : 'white', 
                            cursor: index === playingXI.length - 1 ? 'not-allowed' : 'pointer', 
                            padding: '10px 14px', borderRadius: '8px', fontSize: '14px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                    >▼</button>
                </div>
            )}
        </div>
    );

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '1000px', height: '80vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ margin: 0, color: 'var(--accent-gold)' }}>{user.teamName} Squad Builder</h2>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                            Budget Remaining: ₹{user.budget}L | Squad Size: {user.squad.length}
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
                </div>
                
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    {/* Playing XI Area */}
                    <div 
                        style={{ flex: 1, padding: '1.5rem', borderRight: '1px solid rgba(255,255,255,0.1)', overflowY: 'auto' }}
                        onDragOver={(e) => { e.preventDefault(); if (isCurrentUser) e.currentTarget.style.background = 'rgba(6,182,212,0.1)'; }}
                        onDragLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        onDrop={(e) => { e.currentTarget.style.background = 'transparent'; onDrop(e, 'XI'); }}
                    >
                        <h3 style={{ color: 'var(--accent-cyan)', marginBottom: '1rem', borderBottom: '1px solid rgba(6,182,212,0.3)', paddingBottom: '0.5rem' }}>
                            Playing XI ({playingXI.length}/11)
                        </h3>
                        {playingXI.length === 0 && <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', padding: '1rem', textAlign: 'center' }}>{isCurrentUser ? "Drag players here" : "No playing XI set"}</div>}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {playingXI.map((p, i) => renderPlayerMini(p, 'XI', i))}
                        </div>
                    </div>

                    {/* Bench Area */}
                    <div 
                        style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}
                        onDragOver={(e) => { e.preventDefault(); if (isCurrentUser) e.currentTarget.style.background = 'rgba(236,72,153,0.1)'; }}
                        onDragLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        onDrop={(e) => { e.currentTarget.style.background = 'transparent'; onDrop(e, 'Bench'); }}
                    >
                        <h3 style={{ color: 'var(--text-secondary)', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                            Bench ({bench.length})
                        </h3>
                        {bench.length === 0 && <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', padding: '1rem', textAlign: 'center' }}>Bench is empty</div>}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {bench.map((p, i) => renderPlayerMini(p, 'Bench', i))}
                        </div>
                    </div>
                </div>
                {isCurrentUser && (
                    <div style={{ padding: '0.75rem', textAlign: 'center', background: 'rgba(0,0,0,0.4)', color: 'var(--accent-gold)', fontSize: '0.875rem' }}>
                        Drag and drop players between the Bench and Playing XI to set your final team for the Winner Engine evaluation!
                    </div>
                )}
            </div>
        </div>
    );
}

function PlayerDatabaseModal({ players, onClose }) {
    const [filter, setFilter] = useState('All');
    
    const filtered = players.filter(p => {
        if(filter === 'All') return true;
        if(filter === 'Sold') return p.status === 'sold';
        if(filter === 'Unsold') return p.status === 'unsold';
        return p.role === filter;
    });

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '1000px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0 }}>Player Database ({filtered.length})</h2>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
                </div>
                
                <div style={{ padding: '1rem 1.5rem', display: 'flex', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', overflowX: 'auto' }}>
                    {['All', 'Batter', 'Bowler', 'All-Rounder', 'Wicket Keeper', 'Sold', 'Unsold'].map(f => (
                        <button key={f} onClick={() => setFilter(f)} className={`btn ${filter === f ? 'btn-primary' : ''}`} style={{ background: filter !== f ? 'rgba(255,255,255,0.1)' : '', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                            {f}
                        </button>
                    ))}
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <th style={{ padding: '0.5rem' }}>Name</th>
                                <th style={{ padding: '0.5rem' }}>Role</th>
                                <th style={{ padding: '0.5rem' }}>Nat.</th>
                                <th style={{ padding: '0.5rem' }}>Base</th>
                                <th style={{ padding: '0.5rem' }}>Status</th>
                                <th style={{ padding: '0.5rem' }}>Sold To</th>
                                <th style={{ padding: '0.5rem' }}>Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(p => (
                                <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{p.name}</td>
                                    <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>{p.role}</td>
                                    <td style={{ padding: '0.75rem 0.5rem' }}>{p.nationality}</td>
                                    <td style={{ padding: '0.75rem 0.5rem' }}>₹{p.basePrice}L</td>
                                    <td style={{ padding: '0.75rem 0.5rem' }}>
                                        {p.status === 'sold' && <span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>SOLD</span>}
                                        {p.status === 'unsold' && <span style={{ color: 'var(--accent-red)', fontWeight: 'bold' }}>UNSOLD</span>}
                                        {p.status === 'upcoming' && <span style={{ color: 'var(--accent-blue)' }}>UPCOMING</span>}
                                    </td>
                                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 'bold' }}>{p.soldTo || '-'}</td>
                                    <td style={{ padding: '0.75rem 0.5rem', color: 'var(--accent-gold)' }}>{p.soldPrice ? `₹${p.soldPrice}L` : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function LogViewer({ roomId }) {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    socket.on('logMessage', (msg) => {
      setLogs(prev => [{ time: new Date().toLocaleTimeString(), msg }, ...prev]);
    });
    return () => socket.off('logMessage');
  }, []);

  return (
    <>
      {logs.map((log, i) => (
        <div key={i} className="log-entry">
          <span style={{ color: 'var(--accent-blue)', marginRight: '0.5rem' }}>[{log.time}]</span>
          {log.msg}
        </div>
      ))}
    </>
  );
}
