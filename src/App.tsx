import React, { useState, useEffect, useCallback } from 'react';
import { MainMenu } from './components/MainMenu';
import { GameLobby } from './components/GameLobby';
import { GameCanvas } from './components/GameCanvas';
import { GameOverScreen } from './components/GameOverScreen';
import { SocketService } from './services/socketService';
import { SoundManager } from './utils/soundManager';
import { GameRoom, GameState, PlayerInput } from './types/game';

type GameScreen = 'menu' | 'lobby' | 'game' | 'gameOver';

function App() {
  const [currentScreen, setCurrentScreen] = useState<GameScreen>('menu');
  const [socketService] = useState(() => SocketService.getInstance());
  const [soundManager] = useState(() => SoundManager.getInstance());
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');

  /**
   * Initialize socket connection
   */
  useEffect(() => {
    const initializeConnection = async () => {
      try {
        await socketService.connect();
        setConnectionStatus('connected');
        setPlayerId(socketService.getSocketId());
        
        // Set up event listeners
        socketService.on('roomCreated', (data: any) => {
          setCurrentRoom(data.room);
          setCurrentScreen('lobby');
        });

        socketService.on('roomJoined', (data: any) => {
          setCurrentRoom(data.room);
          setCurrentScreen('lobby');
        });

        socketService.on('playerJoined', (data: any) => {
          setCurrentRoom(data.room);
        });

        socketService.on('playerLeft', (data: any) => {
          setCurrentRoom(data.room);
        });

        socketService.on('joinError', (error: string) => {
          alert(`Failed to join room: ${error}`);
        });

        socketService.on('gameStarted', (gameState: GameState) => {
          setGameState(gameState);
          setCurrentScreen('game');
        });

        socketService.on('gameStateUpdate', (gameState: GameState) => {
          setGameState(gameState);
          
          // Check if game ended
          if (gameState.gameEnded && currentScreen === 'game') {
            setCurrentScreen('gameOver');
          }
        });

      } catch (error) {
        console.error('Failed to connect to server:', error);
        setConnectionStatus('error');
      }
    };

    initializeConnection();

    return () => {
      socketService.disconnect();
    };
  }, [socketService, currentScreen]);
  /**
   * Handle creating a new room
   */
  const handleCreateRoom = useCallback((roomName: string, name: string) => {
    if (socketService.isConnected()) {
      socketService.createRoom(roomName, name);
      setPlayerName(name);
    }
  }, [socketService]);

  /**
   * Handle joining an existing room
   */
  const handleJoinRoom = useCallback((roomId: string, name: string) => {
    if (socketService.isConnected()) {
      socketService.joinRoom(roomId, name);
      setPlayerName(name);
    }
  }, [socketService]);

  /**
   * Handle leaving a room
   */
  const handleLeaveRoom = useCallback(() => {
    setCurrentRoom(null);
    setGameState(null);
    setCurrentScreen('menu');
  }, []);

  /**
   * Handle starting a game
   */
  const handleStartGame = useCallback(() => {
    if (currentRoom && socketService.isConnected()) {
      socketService.startGame(currentRoom.id);
    }
  }, [socketService, currentRoom]);

  /**
   * Handle player input
   */
  const handlePlayerInput = useCallback((input: any) => {
    if (currentRoom && playerId && socketService.isConnected()) {
      const playerInput: PlayerInput = {
        playerId,
        keys: input,
        timestamp: Date.now()
      };
      socketService.sendPlayerInput(currentRoom.id, playerInput);
    }
  }, [socketService, currentRoom, playerId]);

  /**
   * Handle play again
   */
  const handlePlayAgain = useCallback(() => {
    setCurrentScreen('lobby');
  }, []);

  /**
   * Handle sound toggle
   */
  const handleToggleSound = useCallback(() => {
    const enabled = soundManager.toggleSound();
    setSoundEnabled(enabled);
  }, [soundManager]);

  // Show connection status
  if (connectionStatus === 'connecting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Connecting to game server...</p>
        </div>
      </div>
    );
  }

  if (connectionStatus === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-xl mb-4">Failed to connect to game server</p>
          <p className="text-gray-300">Please make sure the server is running</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  /**
   * Render current screen
   */
  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'menu':
        return (
          <MainMenu
            onJoinRoom={handleJoinRoom}
            onCreateRoom={handleCreateRoom}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
          />
        );

      case 'lobby':
        return currentRoom && playerId ? (
          <GameLobby
            room={currentRoom}
            playerId={playerId}
            playerName={playerName}
            onStartGame={handleStartGame}
            onLeaveRoom={handleLeaveRoom}
            isHost={currentRoom.host === playerId}
          />
        ) : null;

      case 'game':
        return gameState && playerId ? (
          <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <GameCanvas
              gameState={gameState}
              playerId={playerId}
              onInputChange={handlePlayerInput}
            />
          </div>
        ) : null;

      case 'gameOver':
        return gameState && playerId ? (
          <GameOverScreen
            gameState={gameState}
            playerId={playerId}
            onPlayAgain={handlePlayAgain}
            onBackToMenu={handleLeaveRoom}
          />
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div className="App">
      {renderCurrentScreen()}
    </div>
  );
}

export default App;
