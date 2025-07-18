import { v4 as uuidv4 } from 'uuid';
import { GameState, GameRoom, Car, PowerUp, Bottle, PlayerInput } from '../types/game';
import { GamePhysics } from '../utils/gamePhysics';
import { SoundManager } from '../utils/soundManager';

export class GameService {
  private static instance: GameService;
  private rooms: Map<string, GameRoom> = new Map();
  private gameLoops: Map<string, NodeJS.Timeout> = new Map();
  private soundManager: SoundManager;

  private constructor() {
    this.soundManager = SoundManager.getInstance();
    this.soundManager.initSounds();
  }

  static getInstance(): GameService {
    if (!GameService.instance) {
      GameService.instance = new GameService();
    }
    return GameService.instance;
  }

  /**
   * Creates a new game room
   */
  createRoom(roomName: string, hostId: string): GameRoom {
    const roomId = uuidv4();
    const room: GameRoom = {
      id: roomId,
      name: roomName,
      players: [hostId],
      maxPlayers: 6,
      host: hostId,
      gameState: this.createInitialGameState(roomId)
    };

    this.rooms.set(roomId, room);
    return room;
  }

  /**
   * Joins an existing room
   */
  joinRoom(roomId: string, playerId: string): GameRoom | null {
    const room = this.rooms.get(roomId);
    if (!room || room.players.length >= room.maxPlayers) {
      return null;
    }

    if (!room.players.includes(playerId)) {
      room.players.push(playerId);
    }

    return room;
  }

  /**
   * Leaves a room
   */
  leaveRoom(roomId: string, playerId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.players = room.players.filter(id => id !== playerId);
    room.gameState.players = room.gameState.players.filter(p => p.playerId !== playerId);

    if (room.players.length === 0) {
      this.stopGameLoop(roomId);
      this.rooms.delete(roomId);
    } else if (room.host === playerId && room.players.length > 0) {
      room.host = room.players[0];
    }
  }

  /**
   * Gets a room by ID
   */
  getRoom(roomId: string): GameRoom | null {
    return this.rooms.get(roomId) || null;
  }

  /**
   * Starts a game
   */
  startGame(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room || room.players.length < 2) return false;

    // Initialize cars for all players
    room.gameState.players = room.players.map((playerId, index) => 
      this.createCar(playerId, `Player ${index + 1}`, index)
    );

    // Generate power-ups
    room.gameState.powerUps = this.generatePowerUps();
    
    room.gameState.gameStarted = true;
    room.gameState.gameEnded = false;
    room.gameState.raceTime = 0;

    this.startGameLoop(roomId);
    return true;
  }

  /**
   * Processes player input
   */
  processPlayerInput(roomId: string, input: PlayerInput): void {
    const room = this.rooms.get(roomId);
    if (!room || !room.gameState.gameStarted) return;

    const car = room.gameState.players.find(p => p.playerId === input.playerId);
    if (!car || car.isEliminated) return;

    // Handle bottle throwing
    if (input.keys.space && car.bottles > 0) {
      const bottle = GamePhysics.createBottle(car);
      room.gameState.bottles.push(bottle);
      car.bottles--;
      this.soundManager.playSound('throw', 0.3);
    }

    // Update car physics
    GamePhysics.updateCarPhysics(car, input.keys);
  }

  /**
   * Creates initial game state
   */
  private createInitialGameState(roomId: string): GameState {
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

  /**
   * Creates a car for a player
   */
  private createCar(playerId: string, playerName: string, index: number): Car {
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
      maxSpeed: GamePhysics.MAX_SPEED,
      acceleration: GamePhysics.ACCELERATION,
      bottles: 5,
      lap: 0,
      lapTime: 0,
      totalTime: 0,
      isEliminated: false,
      powerUps: [],
      color: colors[index % colors.length]
    };
  }

  /**
   * Generates power-ups on the track
   */
  private generatePowerUps(): PowerUp[] {
    const powerUps: PowerUp[] = [];
    const positions = GamePhysics.generatePowerUpPositions(8);
    const types: PowerUp['type'][] = ['speed', 'shield', 'health', 'bottles'];

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

  /**
   * Starts the game loop for a room
   */
  private startGameLoop(roomId: string): void {
    const gameLoop = setInterval(() => {
      this.updateGame(roomId);
    }, 1000 / 60); // 60 FPS

    this.gameLoops.set(roomId, gameLoop);
  }

  /**
   * Stops the game loop for a room
   */
  private stopGameLoop(roomId: string): void {
    const gameLoop = this.gameLoops.get(roomId);
    if (gameLoop) {
      clearInterval(gameLoop);
      this.gameLoops.delete(roomId);
    }
  }

  /**
   * Updates game state
   */
  private updateGame(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room || !room.gameState.gameStarted || room.gameState.gameEnded) return;

    const gameState = room.gameState;

    // Update race time
    gameState.raceTime++;

    // Update bottles
    gameState.bottles = gameState.bottles.filter(bottle => {
      if (!bottle.active) return false;
      
      GamePhysics.updateBottlePhysics(bottle);
      
      // Check collisions with cars
      for (const car of gameState.players) {
        if (!car.isEliminated && GamePhysics.handleBottleCarCollision(bottle, car)) {
          this.soundManager.playSound('hit', 0.4);
          
          // Check if car is eliminated
          if (car.health <= 0) {
            car.isEliminated = true;
            this.soundManager.playSound('explosion', 0.6);
          }
          break;
        }
      }
      
      return bottle.active;
    });

    // Update power-ups
    gameState.powerUps.forEach(powerUp => {
      if (powerUp.collected) return;
      
      for (const car of gameState.players) {
        if (!car.isEliminated && GamePhysics.handlePowerUpCollection(powerUp, car)) {
          this.soundManager.playSound('powerup', 0.5);
          break;
        }
      }
    });

    // Update car lap tracking
    gameState.players.forEach(car => {
      if (car.isEliminated) return;
      
      car.totalTime = gameState.raceTime;
      
      // Simple lap detection (crossing start line)
      if (car.position.x < 50 && car.position.y < 100 && car.velocity.x > 0) {
        if (car.lap < gameState.maxLaps) {
          car.lap++;
          this.soundManager.playSound('lap', 0.7);
          
          if (car.lap >= gameState.maxLaps) {
            gameState.gameEnded = true;
            gameState.winner = car.playerId;
          }
        }
      }
    });

    // Check if all players are eliminated
    const activePlayers = gameState.players.filter(p => !p.isEliminated);
    if (activePlayers.length <= 1 && !gameState.gameEnded) {
      gameState.gameEnded = true;
      if (activePlayers.length === 1) {
        gameState.winner = activePlayers[0].playerId;
      }
    }

    // Respawn power-ups periodically
    if (gameState.raceTime % 600 === 0) { // Every 10 seconds
      const uncollectedCount = gameState.powerUps.filter(p => !p.collected).length;
      if (uncollectedCount < 4) {
        const newPowerUps = this.generatePowerUps();
        gameState.powerUps.push(...newPowerUps.slice(0, 2));
      }
    }

    // Stop game loop if game ended
    if (gameState.gameEnded) {
      this.stopGameLoop(roomId);
    }
  }
}