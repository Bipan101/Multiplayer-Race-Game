import { io, Socket } from 'socket.io-client';
import { GameState, GameRoom } from '../types/game';

export class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;
  private callbacks: Map<string, Function[]> = new Map();

  private constructor() {}

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  /**
   * Connect to the game server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Dynamically determine the backend server URL
        let serverUrl: string;
        
        if (process.env.NODE_ENV === 'production') {
          serverUrl = 'wss://your-game-server.herokuapp.com'; // Replace with your deployed server
        } else {
          // In webcontainer environments, replace the frontend port with backend port
          const hostname = window.location.hostname;
          const protocol = 'ws:'; // Always use ws: in development/webcontainer
          
          if (hostname.includes('webcontainer-api.io') || hostname.includes('stackblitz.io')) {
            // WebContainer environment - replace port in the current URL
            serverUrl = `${protocol}//${hostname.replace('-5173-', '-3001-')}`;
          } else {
            // Local development
            serverUrl = 'http://localhost:3001';
          }
        }

        this.socket = io(serverUrl, {
          transports: ['websocket', 'polling']
        });

        this.socket.on('connect', () => {
          console.log('Connected to game server');
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.error('Connection error:', error);
          reject(error);
        });

        this.socket.on('disconnect', () => {
          console.log('Disconnected from game server');
        });

        // Set up event listeners
        this.setupEventListeners();

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.callbacks.clear();
  }

  /**
   * Create a new room
   */
  createRoom(roomName: string, playerName: string): void {
    if (this.socket) {
      this.socket.emit('createRoom', { roomName, playerName });
    }
  }

  /**
   * Join an existing room
   */
  joinRoom(roomId: string, playerName: string): void {
    if (this.socket) {
      this.socket.emit('joinRoom', { roomId, playerName });
    }
  }

  /**
   * Start the game (host only)
   */
  startGame(roomId: string): void {
    if (this.socket) {
      this.socket.emit('startGame', { roomId });
    }
  }

  /**
   * Send player input to server
   */
  sendPlayerInput(roomId: string, input: any): void {
    if (this.socket) {
      this.socket.emit('playerInput', { roomId, input });
    }
  }

  /**
   * Register event callback
   */
  on(event: string, callback: Function): void {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event)!.push(callback);
  }

  /**
   * Unregister event callback
   */
  off(event: string, callback: Function): void {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Set up socket event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Room events
    this.socket.on('roomCreated', (data) => {
      this.triggerCallbacks('roomCreated', data);
    });

    this.socket.on('roomJoined', (data) => {
      this.triggerCallbacks('roomJoined', data);
    });

    this.socket.on('playerJoined', (data) => {
      this.triggerCallbacks('playerJoined', data);
    });

    this.socket.on('playerLeft', (data) => {
      this.triggerCallbacks('playerLeft', data);
    });

    this.socket.on('joinError', (error) => {
      this.triggerCallbacks('joinError', error);
    });

    // Game events
    this.socket.on('gameStarted', (gameState) => {
      this.triggerCallbacks('gameStarted', gameState);
    });

    this.socket.on('gameStateUpdate', (gameState) => {
      this.triggerCallbacks('gameStateUpdate', gameState);
    });
  }

  /**
   * Trigger registered callbacks for an event
   */
  private triggerCallbacks(event: string, data: any): void {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get socket ID
   */
  getSocketId(): string | null {
    return this.socket?.id || null;
  }
}