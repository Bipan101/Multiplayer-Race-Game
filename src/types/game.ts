export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  x: number;
  y: number;
}

export interface Car {
  id: string;
  playerId: string;
  playerName: string;
  position: Position;
  velocity: Velocity;
  rotation: number;
  health: number;
  maxHealth: number;
  speed: number;
  maxSpeed: number;
  acceleration: number;
  bottles: number;
  lap: number;
  lapTime: number;
  totalTime: number;
  isEliminated: boolean;
  powerUps: PowerUp[];
  color: string;
}

export interface Bottle {
  id: string;
  position: Position;
  velocity: Velocity;
  playerId: string;
  damage: number;
  active: boolean;
}

export interface PowerUp {
  id: string;
  type: 'speed' | 'shield' | 'health' | 'bottles';
  position: Position;
  collected: boolean;
  duration?: number;
  effect?: number;
}

export interface GameState {
  id: string;
  players: Car[];
  bottles: Bottle[];
  powerUps: PowerUp[];
  gameStarted: boolean;
  gameEnded: boolean;
  winner: string | null;
  raceTime: number;
  maxLaps: number;
}

export interface GameRoom {
  id: string;
  name: string;
  players: string[];
  maxPlayers: number;
  gameState: GameState;
  host: string;
}

export interface PlayerInput {
  playerId: string;
  keys: {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
    space: boolean;
  };
  timestamp: number;
}