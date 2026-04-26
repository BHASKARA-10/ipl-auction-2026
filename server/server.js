const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Load players and group by category
let allPlayers = [];
let playersByCategory = {
    'Batter': [],
    'Bowler': [],
    'All-Rounder': [],
    'Wicket Keeper': []
};

try {
    allPlayers = JSON.parse(fs.readFileSync(path.join(__dirname, 'players.json'), 'utf-8'));
    allPlayers.forEach(p => {
        if(playersByCategory[p.role]) {
            playersByCategory[p.role].push(p);
        }
    });
} catch (e) {
    console.error("Could not load players.json");
}

// In-memory state for rooms
const rooms = {};

const getNextBid = (currentBid, basePrice) => {
  if (currentBid === 0) return basePrice;
  if (currentBid < 100) return currentBid + 5; 
  if (currentBid < 200) return currentBid + 10;
  return currentBid + 20; 
};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Admin creates a room
  socket.on('createRoom', ({ adminName, rules }) => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Deep copy categories for this room so we can pop players off
    const roomCategories = {
        'Batter': [...playersByCategory['Batter']],
        'Bowler': [...playersByCategory['Bowler']],
        'All-Rounder': [...playersByCategory['All-Rounder']],
        'Wicket Keeper': [...playersByCategory['Wicket Keeper']]
    };

    rooms[roomId] = {
      id: roomId,
      admin: { id: socket.id, name: adminName },
      rules: {
          budget: rules.budget || 10000,
          maxSquad: rules.maxSquad || 25,
          maxForeign: rules.maxForeign || 8
      },
      users: {},
      categories: roomCategories,
      allPlayersStatus: allPlayers.map(p => ({ ...p, status: 'upcoming', soldTo: null, soldPrice: null })),
      activeCategory: null,
      currentPlayer: null,
      auctionState: 'lobby', // lobby, bidding, sold, unsold
      currentBid: 0,
      currentBidder: null,
      timer: 15,
      logs: [],
    };

    socket.join(roomId);
    socket.emit('roomCreated', { roomId, roomState: rooms[roomId] });
    console.log(`Room created: ${roomId} by Admin ${adminName}`);
  });

  // User joins a room
  socket.on('joinRoom', ({ roomId, userName, teamName }) => {
    const room = rooms[roomId];
    if (room) {
      // Check if team already exists
      const existingTeamId = Object.keys(room.users).find(id => room.users[id].teamName === teamName);
      
      if (existingTeamId) {
        const existingUser = room.users[existingTeamId];
        if (existingUser.connected === false) {
           // Reclaim the disconnected team
           existingUser.id = socket.id;
           existingUser.connected = true;
           existingUser.name = userName;
           
           // Move user to new socket ID key
           room.users[socket.id] = existingUser;
           delete room.users[existingTeamId];
           
           // Update current bidder reference if they were the highest bidder
           if (room.currentBidder === existingTeamId) {
               room.currentBidder = socket.id;
           }
           
           socket.join(roomId);
           io.to(roomId).emit('roomUpdated', room);
           io.to(roomId).emit('logMessage', `${teamName} reconnected to the room.`);
           socket.emit('joinedRoom', { roomId, roomState: room });
           return;
        } else {
           socket.emit('error', `${teamName} is already taken and currently active in this room.`);
           return;
        }
      }

      room.users[socket.id] = {
        id: socket.id,
        name: userName,
        teamName: teamName,
        budget: room.rules.budget,
        squad: [],
        playingXI: [],
        foreignCount: 0,
        connected: true
      };
      socket.join(roomId);
      
      io.to(roomId).emit('roomUpdated', room);
      io.to(roomId).emit('logMessage', `${teamName} joined the room.`);
      socket.emit('joinedRoom', { roomId, roomState: room });
    } else {
      socket.emit('error', 'Room not found');
    }
  });

  socket.on('checkRoom', (roomId) => {
    const room = rooms[roomId];
    if (room) {
      const takenTeams = Object.values(room.users)
          .filter(u => u.connected !== false)
          .map(u => u.teamName);
      socket.emit('roomStatus', { takenTeams });
    } else {
      socket.emit('roomStatus', { takenTeams: [] });
    }
  });

  // Admin sets active category and loads next player
  socket.on('nextPlayer', ({ roomId, category }) => {
    const room = rooms[roomId];
    if (room && room.admin.id === socket.id) {
      if (category) {
          room.activeCategory = category;
      }
      
      const catList = room.categories[room.activeCategory];
      
      if (catList && catList.length > 0) {
        // Pop the first player from the selected category
        const player = catList.shift();
        room.currentPlayer = player;
        room.auctionState = 'bidding';
        room.currentBid = 0; 
        room.currentBidder = null;
        room.timer = 15;
        
        io.to(roomId).emit('roomUpdated', room);
        io.to(roomId).emit('logMessage', `On the block: ${player.name} (${player.role}) - Base Price: ₹${player.basePrice}L`);
      } else {
        io.to(socket.id).emit('error', `No more players in category: ${room.activeCategory}`);
      }
    }
  });

  // User places a bid
  socket.on('placeBid', ({ roomId }) => {
    const room = rooms[roomId];
    if (room && room.auctionState === 'bidding') {
      const user = room.users[socket.id];
      const player = room.currentPlayer;
      
      if(!user || !player) return;

      // Rule Validation
      if (user.squad.length >= room.rules.maxSquad) {
          socket.emit('error', 'Squad is full! Max players reached.');
          return;
      }
      if (player.nationality === 'Overseas' && user.foreignCount >= room.rules.maxForeign) {
          socket.emit('error', 'Foreign player limit reached!');
          return;
      }

      let newBidAmount = getNextBid(room.currentBid, player.basePrice);

      if (user.budget >= newBidAmount) {
        room.currentBid = newBidAmount;
        room.currentBidder = socket.id;
        room.timer = 15; 
        
        io.to(roomId).emit('roomUpdated', room);
        io.to(roomId).emit('logMessage', `${user.teamName} bids ₹${newBidAmount}L`);
      } else {
        socket.emit('error', 'Insufficient budget!');
      }
    }
  });

  // Admin manually sells player
  socket.on('sellPlayer', ({ roomId }) => {
    sellCurrentPlayer(roomId);
  });
  
  // Admin manually marks unsold
  socket.on('unsoldPlayer', ({ roomId }) => {
    const room = rooms[roomId];
    if (room && room.admin.id === socket.id && room.auctionState === 'bidding') {
        room.auctionState = 'unsold';
        
        // Update allPlayersStatus
        const pIndex = room.allPlayersStatus.findIndex(p => p.id === room.currentPlayer.id);
        if(pIndex !== -1) {
            room.allPlayersStatus[pIndex].status = 'unsold';
        }

        io.to(roomId).emit('roomUpdated', room);
        io.to(roomId).emit('logMessage', `${room.currentPlayer.name} remains UNSOLD.`);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    for (const roomId in rooms) {
      const room = rooms[roomId];
      if (room.admin.id === socket.id) {
          // Admin left, keep room alive but mark admin as disconnected
          room.admin.connected = false;
          io.to(roomId).emit('logMessage', 'Admin disconnected. Waiting for admin to reconnect...');
      } else if (room.users[socket.id]) {
        const userName = room.users[socket.id].teamName;
        room.users[socket.id].connected = false;
        // We no longer delete the user so they can rejoin
        // delete room.users[socket.id];
        io.to(roomId).emit('roomUpdated', room);
        io.to(roomId).emit('logMessage', `${userName} disconnected.`);
      }
    }
  });

  function sellCurrentPlayer(roomId) {
    const room = rooms[roomId];
    if(!room || room.auctionState !== 'bidding') return;

    const player = room.currentPlayer;
    if(!player) return;

    if (room.currentBidder) {
        const winningUser = room.users[room.currentBidder];
        winningUser.budget -= room.currentBid;
        winningUser.squad.push({
            ...player,
            soldPrice: room.currentBid
        });
        if (player.nationality === 'Overseas') {
            winningUser.foreignCount++;
        }
        
        room.auctionState = 'sold';
        
        // Update allPlayersStatus
        const pIndex = room.allPlayersStatus.findIndex(p => p.id === player.id);
        if(pIndex !== -1) {
            room.allPlayersStatus[pIndex].status = 'sold';
            room.allPlayersStatus[pIndex].soldTo = winningUser.teamName;
            room.allPlayersStatus[pIndex].soldPrice = room.currentBid;
        }

        io.to(roomId).emit('roomUpdated', room);
        io.to(roomId).emit('logMessage', `SOLD! ${player.name} to ${winningUser.teamName} for ₹${room.currentBid}L`);
    } else {
        room.auctionState = 'unsold';
        
        // Update allPlayersStatus
        const pIndex = room.allPlayersStatus.findIndex(p => p.id === player.id);
        if(pIndex !== -1) {
            room.allPlayersStatus[pIndex].status = 'unsold';
        }

        io.to(roomId).emit('roomUpdated', room);
        io.to(roomId).emit('logMessage', `${player.name} remains UNSOLD.`);
    }
  }

  // Bind the sellCurrentPlayer to a global interval for timer
  if(!global.timerInterval) {
      global.timerInterval = setInterval(() => {
          for(const rId in rooms) {
              const r = rooms[rId];
              if(r.auctionState === 'bidding') {
                  if(r.timer > 0) {
                      r.timer--;
                      io.to(rId).emit('timerUpdate', r.timer);
                  } else {
                      sellCurrentPlayer(rId);
                  }
              }
          }
      }, 1000);
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
