import React, { useState } from 'react';
import { Users, Play, Settings } from 'lucide-react';
import { GameRoom } from '../types/game';

interface GameLobbyProps {
  room: GameRoom;
  playerId: string;
  playerName: string;
  onStartGame: () => void;
  onLeaveRoom: () => void;
  isHost: boolean;
}

export const GameLobby: React.FC<GameLobbyProps> = ({
  room,
  playerId,
  playerName,
  onStartGame,
  onLeaveRoom,
  isHost
}) => {
  const [maxLaps, setMaxLaps] = useState(3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Race Lobby</h1>
          <p className="text-gray-600">Room: {room.name}</p>
          <p className="text-sm text-gray-500 mt-1">Room ID: {room.id}</p>
        </div>

        {/* Players List */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Users className="w-5 h-5 mr-2 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">
              Players ({room.players.length}/{room.maxPlayers})
            </h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {room.players.map((player, index) => {
              const playerData = typeof player === 'string' ? { id: player, name: `Player ${index + 1}` } : player;
              return (
              <div
                key={playerData.id}
                className={`p-4 rounded-lg border-2 ${
                  playerData.id === playerId
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">
                    {playerData.id === playerId ? playerName : playerData.name}
                  </span>
                  {room.host === playerData.id && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                      HOST
                    </span>
                  )}
                </div>
              </div>
              );
            })}
            
            {/* Empty slots */}
            {Array.from({ length: room.maxPlayers - room.players.length }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="p-4 rounded-lg border-2 border-dashed border-gray-300 bg-gray-100"
              >
                <span className="text-gray-500">Waiting for player...</span>
              </div>
            ))}
          </div>
        </div>

        {/* Game Settings (Host Only) */}
        {isHost && (
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center mb-4">
              <Settings className="w-5 h-5 mr-2 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-800">Game Settings</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Laps
                </label>
                <select
                  value={maxLaps}
                  onChange={(e) => setMaxLaps(Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={1}>1 Lap</option>
                  <option value={3}>3 Laps</option>
                  <option value={5}>5 Laps</option>
                  <option value={10}>10 Laps</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Game Rules */}
        <div className="mb-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">Game Rules</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Use WASD or arrow keys to control your car</li>
            <li>• Press SPACE to throw bottles at opponents</li>
            <li>• Collect power-ups for speed boosts, shields, and more bottles</li>
            <li>• Avoid getting hit - when health reaches zero, you're eliminated!</li>
            <li>• Complete the required number of laps to win</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={onLeaveRoom}
            className="flex-1 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
          >
            Leave Room
          </button>
          
          {isHost ? (
            <button
              onClick={onStartGame}
              disabled={room.players.length < 2}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center ${
                room.players.length >= 2
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Play className="w-5 h-5 mr-2" />
              Start Race
            </button>
          ) : (
            <div className="flex-1 px-6 py-3 bg-yellow-100 text-yellow-800 rounded-lg text-center font-medium">
              Waiting for host to start...
            </div>
          )}
        </div>

        {room.players.length < 2 && isHost && (
          <p className="text-center text-gray-500 text-sm mt-4">
            Need at least 2 players to start the race
          </p>
        )}
      </div>
    </div>
  );
};