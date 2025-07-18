import React, { useRef, useEffect, useCallback } from 'react';
import { Car, Bottle, PowerUp, GameState } from '../types/game';

interface GameCanvasProps {
  gameState: GameState;
  playerId: string;
  onInputChange: (input: any) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, playerId, onInputChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysRef = useRef({
    up: false,
    down: false,
    left: false,
    right: false,
    space: false
  });

  /**
   * Handle keyboard input
   */
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.code) {
      case 'ArrowUp':
      case 'KeyW':
        keysRef.current.up = true;
        break;
      case 'ArrowDown':
      case 'KeyS':
        keysRef.current.down = true;
        break;
      case 'ArrowLeft':
      case 'KeyA':
        keysRef.current.left = true;
        break;
      case 'ArrowRight':
      case 'KeyD':
        keysRef.current.right = true;
        break;
      case 'Space':
        keysRef.current.space = true;
        e.preventDefault();
        break;
    }
    onInputChange(keysRef.current);
  }, [onInputChange]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    switch (e.code) {
      case 'ArrowUp':
      case 'KeyW':
        keysRef.current.up = false;
        break;
      case 'ArrowDown':
      case 'KeyS':
        keysRef.current.down = false;
        break;
      case 'ArrowLeft':
      case 'KeyA':
        keysRef.current.left = false;
        break;
      case 'ArrowRight':
      case 'KeyD':
        keysRef.current.right = false;
        break;
      case 'Space':
        keysRef.current.space = false;
        break;
    }
    onInputChange(keysRef.current);
  }, [onInputChange]);

  /**
   * Set up event listeners
   */
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  /**
   * Draw the game
   */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#2d5a27';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw track boundaries
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // Draw start/finish line
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 10; i++) {
      ctx.fillRect(20 + i * 20, 20, 10, 30);
    }

    // Draw power-ups
    gameState.powerUps.forEach(powerUp => {
      if (!powerUp.collected) {
        drawPowerUp(ctx, powerUp);
      }
    });

    // Draw bottles
    gameState.bottles.forEach(bottle => {
      if (bottle.active) {
        drawBottle(ctx, bottle);
      }
    });

    // Draw cars
    gameState.players.forEach(car => {
      if (!car.isEliminated) {
        drawCar(ctx, car, car.playerId === playerId);
      }
    });

    // Draw UI elements
    drawUI(ctx, canvas, gameState, playerId);
  }, [gameState, playerId]);

  /**
   * Draw a car
   */
  const drawCar = (ctx: CanvasRenderingContext2D, car: Car, isPlayer: boolean) => {
    ctx.save();
    ctx.translate(car.position.x, car.position.y);
    ctx.rotate(car.rotation);

    // Car body
    ctx.fillStyle = isPlayer ? '#ff4444' : car.color;
    ctx.fillRect(-15, -8, 30, 16);

    // Car outline
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(-15, -8, 30, 16);

    // Car front
    ctx.fillStyle = '#333333';
    ctx.fillRect(12, -6, 6, 12);

    // Health bar
    ctx.restore();
    const healthWidth = 30;
    const healthHeight = 4;
    const healthPercent = car.health / car.maxHealth;
    
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(car.position.x - healthWidth/2, car.position.y - 25, healthWidth, healthHeight);
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(car.position.x - healthWidth/2, car.position.y - 25, healthWidth * healthPercent, healthHeight);

    // Player name
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(car.playerName, car.position.x, car.position.y - 30);

    // Shield effect
    const hasShield = car.powerUps.some(p => p.type === 'shield');
    if (hasShield) {
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(car.position.x, car.position.y, 25, 0, Math.PI * 2);
      ctx.stroke();
    }
  };

  /**
   * Draw a bottle projectile
   */
  const drawBottle = (ctx: CanvasRenderingContext2D, bottle: Bottle) => {
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.arc(bottle.position.x, bottle.position.y, 5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  /**
   * Draw a power-up
   */
  const drawPowerUp = (ctx: CanvasRenderingContext2D, powerUp: PowerUp) => {
    const colors = {
      speed: '#ffff00',
      shield: '#00ffff',
      health: '#ff00ff',
      bottles: '#ffa500'
    };

    ctx.fillStyle = colors[powerUp.type];
    ctx.beginPath();
    ctx.arc(powerUp.position.x, powerUp.position.y, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Power-up icon
    ctx.fillStyle = '#000000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    const icons = { speed: '⚡', shield: '🛡', health: '❤', bottles: '🍾' };
    ctx.fillText(icons[powerUp.type], powerUp.position.x, powerUp.position.y + 4);
  };

  /**
   * Draw UI elements
   */
  const drawUI = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, gameState: GameState, playerId: string) => {
    const player = gameState.players.find(p => p.playerId === playerId);
    if (!player) return;

    // Player stats
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, canvas.height - 100, 200, 80);

    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Health: ${player.health}/${player.maxHealth}`, 20, canvas.height - 75);
    ctx.fillText(`Bottles: ${player.bottles}`, 20, canvas.height - 55);
    ctx.fillText(`Lap: ${player.lap}/${gameState.maxLaps}`, 20, canvas.height - 35);

    // Leaderboard
    const sortedPlayers = [...gameState.players]
      .filter(p => !p.isEliminated)
      .sort((a, b) => {
        if (a.lap !== b.lap) return b.lap - a.lap;
        return a.totalTime - b.totalTime;
      });

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(canvas.width - 220, 10, 200, Math.min(sortedPlayers.length * 25 + 20, 200));

    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Leaderboard', canvas.width - 210, 30);

    sortedPlayers.slice(0, 7).forEach((car, index) => {
      ctx.font = '12px Arial';
      const y = 50 + index * 25;
      const isCurrentPlayer = car.playerId === playerId;
      ctx.fillStyle = isCurrentPlayer ? '#ffff00' : '#ffffff';
      ctx.fillText(`${index + 1}. ${car.playerName}`, canvas.width - 210, y);
      ctx.fillText(`Lap ${car.lap}`, canvas.width - 100, y);
    });

    // Game timer
    if (gameState.gameStarted && !gameState.gameEnded) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(canvas.width / 2 - 50, 10, 100, 30);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      const minutes = Math.floor(gameState.raceTime / 60);
      const seconds = gameState.raceTime % 60;
      ctx.fillText(`${minutes}:${seconds.toString().padStart(2, '0')}`, canvas.width / 2, 30);
    }
  };

  /**
   * Animation loop
   */
  useEffect(() => {
    const animate = () => {
      draw();
      requestAnimationFrame(animate);
    };
    animate();
  }, [draw]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="border-2 border-gray-800 bg-green-800"
        tabIndex={0}
      />
      <div className="absolute top-2 left-2 text-white text-sm bg-black bg-opacity-50 p-2 rounded">
        <p>Controls: WASD or Arrow Keys to move, Space to throw bottles</p>
      </div>
    </div>
  );
};