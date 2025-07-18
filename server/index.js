const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

const rooms = new Map();
const gameLoops = new Map();

const PHYSICS = {
  FRICTION: 0.95,
  TURN_SPEED: 0.08,
  ACCELERATION: 0.5,
  BRAKE_FORCE: 0.8,
  MAX_SPEED: 8,
  BOTTLE_SPEED: 12,
  TRACK_WIDTH: 800,
  TRACK_HEIGHT: 600
};

function createInitialGameState(roomId) {
  return {
    id: roomId,
    players: [],
    bottles: [],
    powerUps: [],
    gameStarted: false,
    gameEnded: false,
    winner: null,
    raceTime: 0,
    maxLaps: 3
  };
}

function createCar(playerId, playerName, index) {
  const colors = ['#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff', '#44ffff'];
  const startPositions = [
    { x: 100, y: 100 },
    { x: 100, y: 140 },
    { x: 100, y: 180 },
    { x: 100, y: 220 },
    { x: 100, y: 260 },
    { x: 100, y: 300 }
  ];

  return {
    id: uuidv4(),
    playerId,
    playerName,
    position: startPositions[index] || { x: 100, y: 100 + index * 40 },
    velocity: { x: 0, y: 0 },
    rotation: 0,
    health: 100,
    maxHealth: 100,
    speed: 0,
    maxSpeed: PHYSICS.MAX_SPEED,
    acceleration: PHYSICS.ACCELERATION,
    bottles: 5,
    lap: 0,
    lapTime: 0,
    totalTime: 0,
    isEliminated: false,
    powerUps: [],
    color: colors[index % colors.length]
  };
}

function generatePowerUps() {
  const powerUps = [];
  const positions = generatePowerUpPositions(8);
  const types = ['speed', 'shield', 'health', 'bottles'];

  positions.forEach((position, index) => {
    powerUps.push({
      id: uuidv4(),
      type: types[index % types.length],
      position,
      collected: false
    });
  });

  return powerUps;
}

function generatePowerUpPositions(count) {
  const positions = [];
  const margin = 50;
  
  for (let i = 0; i < count; i++) {
    positions.push({
      x: margin + Math.random() * (PHYSICS.TRACK_WIDTH - 2 * margin),
      y: margin + Math.random() * (PHYSICS.TRACK_HEIGHT - 2 * margin)
    });
  }
  
  return positions;
}

function updateCarPhysics(car, input) {
  if (input.up) {
    const forwardX = Math.cos(car.rotation) * PHYSICS.ACCELERATION;
    const forwardY = Math.sin(car.rotation) * PHYSICS.ACCELERATION;
    car.velocity.x += forwardX;
    car.velocity.y += forwardY;
  }
  
  if (input.down) {
    car.velocity.x *= PHYSICS.BRAKE_FORCE;
    car.velocity.y *= PHYSICS.BRAKE_FORCE;
  }

  const speed = Math.sqrt(car.velocity.x ** 2 + car.velocity.y ** 2);
  if (speed > 0.5) {
    if (input.left) {
      car.rotation -= PHYSICS.TURN_SPEED * (speed / PHYSICS.MAX_SPEED);
    }
    if (input.right) {
      car.rotation += PHYSICS.TURN_SPEED * (speed / PHYSICS.MAX_SPEED);
    }
  }

  car.velocity.x *= PHYSICS.FRICTION;
  car.velocity.y *= PHYSICS.FRICTION;

  const currentSpeed = Math.sqrt(car.velocity.x ** 2 + car.velocity.y ** 2);
  if (currentSpeed > car.maxSpeed) {
    car.velocity.x = (car.velocity.x / currentSpeed) * car.maxSpeed;
    car.velocity.y = (car.velocity.y / currentSpeed) * car.maxSpeed;
  }

  car.position.x += car.velocity.x;
  car.position.y += car.velocity.y;

  keepInBounds(car);
}

function keepInBounds(car) {
  const margin = 20;
  
  if (car.position.x < margin) {
    car.position.x = margin;
    car.velocity.x = Math.abs(car.velocity.x) * 0.5;
  }
  if (car.position.x > PHYSICS.TRACK_WIDTH - margin) {
    car.position.x = PHYSICS.TRACK_WIDTH - margin;
    car.velocity.x = -Math.abs(car.velocity.x) * 0.5;
  }
  if (car.position.y < margin) {
    car.position.y = margin;
    car.velocity.y = Math.abs(car.velocity.y) * 0.5;
  }
  if (car.position.y > PHYSICS.TRACK_HEIGHT - margin) {
    car.position.y = PHYSICS.TRACK_HEIGHT - margin;
    car.velocity.y = -Math.abs(car.velocity.y) * 0.5;
  }
}

function createBottle(car) {
  const bottleSpeed = PHYSICS.BOTTLE_SPEED;
  const angle = car.rotation;
  
  return {
    id: `bottle_${Date.now()}_${Math.random()}`,
    position: {
      x: car.position.x + Math.cos(angle) * 40,
      y: car.position.y + Math.sin(angle) * 40
    },
    velocity: {
      x: Math.cos(angle) * bottleSpeed + car.velocity.x,
      y: Math.sin(angle) * bottleSpeed + car.velocity.y
    },
    playerId: car.playerId,
    damage: 20,
    active: true
  };
}

function updateBottlePhysics(bottle) {
  bottle.position.x += bottle.velocity.x;
  bottle.position.y += bottle.velocity.y;

  if (bottle.position.x < 0 || bottle.position.x > PHYSICS.TRACK_WIDTH ||
      bottle.position.y < 0 || bottle.position.y > PHYSICS.TRACK_HEIGHT) {
    bottle.active = false;
  }
}

function checkCollision(pos1, pos2, radius1, radius2) {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < (radius1 + radius2);
}

function handleBottleCarCollision(bottle, car) {
  if (bottle.playerId === car.playerId || !bottle.active) return false;
  
  if (checkCollision(bottle.position, car.position, 5, 20)) {
    car.health -= bottle.damage;
    bottle.active = false;

    const knockbackForce = 3;
    const angle = Math.atan2(car.position.y - bottle.position.y, car.position.x - bottle.position.x);
    car.velocity.x += Math.cos(angle) * knockbackForce;
    car.velocity.y += Math.sin(angle) * knockbackForce;
    
    return true;
  }
  return false;
}

function handlePowerUpCollection(powerUp, car) {
  if (powerUp.collected) return false;
  
  if (checkCollision(powerUp.position, car.position, 15, 20)) {
    powerUp.collected = true;
    applyPowerUp(powerUp, car);
    return true;
  }
  return false;
}

function applyPowerUp(powerUp, car) {
  switch (powerUp.type) {
    case 'speed':
      car.maxSpeed = Math.min(car.maxSpeed + 2, 12);
      setTimeout(() => {
        car.maxSpeed = PHYSICS.MAX_SPEED;
      }, 5000);
      break;
    case 'shield':
      car.powerUps.push({
        ...powerUp,
        duration: 8000
      });
      break;
    case 'health':
      car.health = Math.min(car.health + 30, car.maxHealth);
      break;
    case 'bottles':
      car.bottles += 3;
      break;
  }
}

function updateGame(roomId) {
  const room = rooms.get(roomId);
  if (!room || !room.gameState.gameStarted || room.gameState.gameEnded) return;

  const gameState = room.gameState;
  gameState.raceTime++;

  gameState.bottles = gameState.bottles.filter(bottle => {
    if (!bottle.active) return false;
    
    updateBottlePhysics(bottle);
    
    for (const car of gameState.players) {
      if (!car.isEliminated && handleBottleCarCollision(bottle, car)) {
        if (car.health <= 0) {
          car.isEliminated = true;
        }
        break;
      }
    }
    
    return bottle.active;
  });

  gameState.powerUps.forEach(powerUp => {
    if (powerUp.collected) return;
    
    for (const car of gameState.players) {
      if (!car.isEliminated && handlePowerUpCollection(powerUp, car)) {
        break;
      }
    }
  });

  gameState.players.forEach(car => {
    if (car.isEliminated) return;
    
    car.totalTime = gameState.raceTime;
    
    if (car.position.x < 50 && car.position.y < 100 && car.velocity.x > 0) {
      if (car.lap < gameState.maxLaps) {
        car.lap++;
        
        if (car.lap >= gameState.maxLaps) {
          gameState.gameEnded = true;
          gameState.winner = car.playerId;
        }
      }
    }
  });

  const activePlayers = gameState.players.filter(p => !p.isEliminated);
  if (activePlayers.length <= 1 && !gameState.gameEnded) {
    gameState.gameEnded = true;
    if (activePlayers.length === 1) {
      gameState.winner = activePlayers[0].playerId;
    }
  }

  if (gameState.raceTime % 600 === 0) {
    const uncollectedCount = gameState.powerUps.filter(p => !p.collected).length;
    if (uncollectedCount < 4) {
      const newPowerUps = generatePowerUps();
      gameState.powerUps.push(...newPowerUps.slice(0, 2));
    }
  }

  io.to(roomId).emit('gameStateUpdate', gameState);

  if (gameState.gameEnded) {
    const gameLoop = gameLoops.get(roomId);
    if (gameLoop) {
      clearInterval(gameLoop);
      gameLoops.delete(roomId);
    }
  }
}

function startGameLoop(roomId) {
  const gameLoop = setInterval(() => {
    updateGame(roomId);
  }, 1000 / 60);

  gameLoops.set(roomId, gameLoop);
}

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.on('createRoom', (data) => {
    const { roomName, playerName } = data;
    const roomId = uuidv4();
    
    const room = {
      id: roomId,
      name: roomName,
      players: [{ id: socket.id, name: playerName }],
      maxPlayers: 6,
      host: socket.id,
      gameState: createInitialGameState(roomId)
    };

    rooms.set(roomId, room);
    socket.join(roomId);
    socket.emit('roomCreated', { roomId, room });
    
    console.log(`Room created: ${roomId} by ${playerName}`);
  });

  socket.on('joinRoom', (data) => {
    const { roomId, playerName } = data;
    const room = rooms.get(roomId);
    
    if (!room) {
      socket.emit('joinError', 'Room not found');
      return;
    }
    
    if (room.players.length >= room.maxPlayers) {
      socket.emit('joinError', 'Room is full');
      return;
    }

    if (room.players.find(p => p.id === socket.id)) {
      socket.emit('joinError', 'Already in room');
      return;
    }

    room.players.push({ id: socket.id, name: playerName });
    socket.join(roomId);
    
    io.to(roomId).emit('playerJoined', { room, playerId: socket.id });
    socket.emit('roomJoined', { roomId, room });
    
    console.log(`${playerName} joined room: ${roomId}`);
  });

  socket.on('startGame', (data) => {
    const { roomId } = data;
    const room = rooms.get(roomId);
    
    if (!room || room.host !== socket.id || room.players.length < 2) {
      return;
    }

    room.gameState.players = room.players.map((player, index) => 
      createCar(player.id, player.name, index)
    );

    room.gameState.powerUps = generatePowerUps();
    
    room.gameState.gameStarted = true;
    room.gameState.gameEnded = false;
    room.gameState.raceTime = 0;

    startGameLoop(roomId);
    
    io.to(roomId).emit('gameStarted', room.gameState);
    
    console.log(`Game started in room: ${roomId}`);
  });

  socket.on('playerInput', (data) => {
    const { roomId, input } = data;
    const room = rooms.get(roomId);
    
    if (!room || !room.gameState.gameStarted) return;

    const car = room.gameState.players.find(p => p.playerId === socket.id);
    if (!car || car.isEliminated) return;

    if (input.keys.space && car.bottles > 0) {
      const bottle = createBottle(car);
      room.gameState.bottles.push(bottle);
      car.bottles--;
    }

    updateCarPhysics(car, input.keys);
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    
    for (const [roomId, room] of rooms.entries()) {
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        room.gameState.players = room.gameState.players.filter(p => p.playerId !== socket.id);
        
        if (room.players.length === 0) {
          const gameLoop = gameLoops.get(roomId);
          if (gameLoop) {
            clearInterval(gameLoop);
            gameLoops.delete(roomId);
          }
          rooms.delete(roomId);
          console.log(`Room deleted: ${roomId}`);
        } else {
          if (room.host === socket.id && room.players.length > 0) {
            room.host = room.players[0].id;
          }
          
          io.to(roomId).emit('playerLeft', { room, playerId: socket.id });
        }
        break;
      }
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', rooms: rooms.size });
});

const PORT = process.env.PORT || 3001;

// ✅ THE CRITICAL FIX FOR RENDER:
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Game server running on port ${PORT}`);
});
