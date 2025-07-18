import React, { useState } from 'react';
import { Car, Users, Trophy, Volume2, VolumeX } from 'lucide-react';

interface MainMenuProps {
  onJoinRoom: (roomId: string, playerName: string) => void;
  onCreateRoom: (roomName: string, playerName: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onJoinRoom,
  onCreateRoom,
  soundEnabled,
  onToggleSound
}) => {
  const [playerName, setPlayerName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim() && roomName.trim()) {
      onCreateRoom(roomName.trim(), playerName.trim());
    }
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim() && roomId.trim()) {
      onJoinRoom(roomId.trim(), playerName.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full -translate-y-16 translate-x-16 opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-400 to-blue-500 rounded-full translate-y-12 -translate-x-12 opacity-20"></div>

        {/* Header */}
        <div className="text-center mb-8 relative z-10">
          <div className="flex items-center justify-center mb-4">
            <Car className="w-12 h-12 text-blue-600 mr-2" />
            <Trophy className="w-10 h-10 text-yellow-500" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Bottle Racers
          </h1>
          <p className="text-gray-600">
            Multiplayer racing with explosive action!
          </p>
        </div>

        {/* Sound Toggle */}
        <div className="absolute top-4 right-4">
          <button
            onClick={onToggleSound}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            {soundEnabled ? (
              <Volume2 className="w-5 h-5 text-gray-600" />
            ) : (
              <VolumeX className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Main Menu */}
        {!showJoinForm && !showCreateForm && (
          <div className="space-y-4">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your racing name"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={20}
              />
            </div>

            <button
              onClick={() => setShowCreateForm(true)}
              disabled={!playerName.trim()}
              className="w-full p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Users className="w-5 h-5 mr-2" />
              Create Race Room
            </button>

            <button
              onClick={() => setShowJoinForm(true)}
              disabled={!playerName.trim()}
              className="w-full p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Car className="w-5 h-5 mr-2" />
              Join Race Room
            </button>

            {/* Game Features */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Game Features:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Real-time multiplayer racing</li>
                <li>• Throw bottles at opponents</li>
                <li>• Collect power-ups and boosts</li>
                <li>• Health system with elimination</li>
                <li>• Live leaderboards</li>
              </ul>
            </div>
          </div>
        )}

        {/* Create Room Form */}
        {showCreateForm && (
          <form onSubmit={handleCreateRoom} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room Name
              </label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Enter room name"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                maxLength={30}
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="flex-1 p-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={!roomName.trim()}
                className="flex-1 p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Room
              </button>
            </div>
          </form>
        )}

        {/* Join Room Form */}
        {showJoinForm && (
          <form onSubmit={handleJoinRoom} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room ID
              </label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter room ID"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowJoinForm(false)}
                className="flex-1 p-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={!roomId.trim()}
                className="flex-1 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Join Room
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};