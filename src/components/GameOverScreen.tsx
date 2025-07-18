import React from 'react';
import { Trophy, Medal, RotateCcw, Home } from 'lucide-react';
import { GameState } from '../types/game';

interface GameOverScreenProps {
  gameState: GameState;
  playerId: string;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  gameState,
  playerId,
  onPlayAgain,
  onBackToMenu
}) => {
  const sortedPlayers = [...gameState.players]
    .sort((a, b) => {
      if (a.isEliminated && !b.isEliminated) return 1;
      if (!a.isEliminated && b.isEliminated) return -1;
      if (a.lap !== b.lap) return b.lap - a.lap;
      return a.totalTime - b.totalTime;
    });

  const playerPosition = sortedPlayers.findIndex(p => p.playerId === playerId) + 1;
  const winner = sortedPlayers[0];

  const getPositionColor = (position: number) => {
    switch (position) {
      case 1: return 'text-yellow-500';
      case 2: return 'text-gray-400';
      case 3: return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1: return <Trophy className="w-6 h-6" />;
      case 2: case 3: return <Medal className="w-6 h-6" />;
      default: return <span className="w-6 h-6 flex items-center justify-center font-bold">{position}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Trophy className="w-16 h-16 text-yellow-500" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Race Complete!</h1>
          {winner && (
            <p className="text-xl text-gray-600">
              🏆 Winner: <span className="font-bold text-yellow-600">{winner.playerName}</span>
            </p>
          )}
        </div>

        {/* Player's Result */}
        <div className={`mb-8 p-6 rounded-xl border-2 ${
          playerPosition === 1 
            ? 'border-yellow-400 bg-yellow-50' 
            : playerPosition <= 3 
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 bg-gray-50'
        }`}>
          <div className="flex items-center justify-center mb-4">
            <div className={`flex items-center ${getPositionColor(playerPosition)}`}>
              {getPositionIcon(playerPosition)}
              <span className="ml-2 text-2xl font-bold">
                {playerPosition === 1 ? '1st Place!' : 
                 playerPosition === 2 ? '2nd Place!' :
                 playerPosition === 3 ? '3rd Place!' :
                 `${playerPosition}th Place`}
              </span>
            </div>
          </div>
          
          <div className="text-center text-gray-700">
            <p className="text-lg">Your Performance:</p>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <span className="font-semibold">Laps Completed:</span>
                <br />
                <span className="text-xl">{gameState.players.find(p => p.playerId === playerId)?.lap || 0}</span>
              </div>
              <div>
                <span className="font-semibold">Total Time:</span>
                <br />
                <span className="text-xl">
                  {Math.floor((gameState.players.find(p => p.playerId === playerId)?.totalTime || 0) / 60)}:
                  {((gameState.players.find(p => p.playerId === playerId)?.totalTime || 0) % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Final Leaderboard */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Final Results</h2>
          <div className="space-y-3">
            {sortedPlayers.map((player, index) => {
              const position = index + 1;
              const isCurrentPlayer = player.playerId === playerId;
              
              return (
                <div
                  key={player.playerId}
                  className={`flex items-center p-4 rounded-lg border-2 ${
                    isCurrentPlayer 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className={`flex items-center mr-4 ${getPositionColor(position)}`}>
                    {getPositionIcon(position)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`font-semibold ${isCurrentPlayer ? 'text-blue-800' : 'text-gray-800'}`}>
                        {player.playerName}
                        {isCurrentPlayer && ' (You)'}
                      </span>
                      <div className="text-right text-sm text-gray-600">
                        <div>Laps: {player.lap}</div>
                        <div>
                          Time: {Math.floor(player.totalTime / 60)}:
                          {(player.totalTime % 60).toString().padStart(2, '0')}
                        </div>
                      </div>
                    </div>
                    
                    {player.isEliminated && (
                      <span className="text-red-500 text-sm">Eliminated</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={onBackToMenu}
            className="flex-1 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium flex items-center justify-center"
          >
            <Home className="w-5 h-5 mr-2" />
            Main Menu
          </button>
          
          <button
            onClick={onPlayAgain}
            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
};