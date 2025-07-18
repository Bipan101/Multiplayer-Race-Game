# Multiplayer Car Racing Game - Bottle Racers

A real-time multiplayer car racing game where players can race against each other, throw bottles at opponents, and collect power-ups to gain advantages.

## 🎮 Features

- **Real-time Multiplayer**: Up to 6 players per room using Socket.IO
- **Combat Racing**: Throw bottles at opponents to damage them
- **Power-ups**: Speed boosts, shields, health packs, and extra bottles
- **Health System**: Cars get eliminated when health reaches zero
- **Lap Tracking**: Configurable number of laps (1, 3, 5, or 10)
- **Lobby System**: Create or join rooms with unique room IDs
- **Sound Effects**: Engine sounds, explosions, and power-up collection
- **Responsive Design**: Works on desktop and mobile devices

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Game

#### Development Mode (Local Multiplayer)

To run both the frontend and backend simultaneously:

```bash
npm run dev:full
```

This will start:
- Backend server on `http://localhost:3001`
- Frontend development server on `http://localhost:5173`

#### Individual Services

Backend only:
```bash
npm run server
```

Frontend only:
```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

## 🎯 How to Play

1. **Enter Your Name**: Start by entering your racing name
2. **Create or Join Room**: 
   - Create a new room with a custom name
   - Or join an existing room using a room ID
3. **Wait in Lobby**: Wait for other players to join (minimum 2 players)
4. **Race Controls**:
   - **WASD** or **Arrow Keys**: Drive your car
   - **SPACE**: Throw bottles at opponents
5. **Collect Power-ups**:
   - **⚡ Speed**: Temporary speed boost
   - **🛡 Shield**: Protection from bottles
   - **❤ Health**: Restore health points
   - **🍾 Bottles**: Get more ammunition
6. **Win Condition**: Complete the required number of laps first!

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Components**: Modular UI components for different game screens
- **Services**: Socket.IO client service for real-time communication
- **Utils**: Game physics, sound management, and utility functions
- **Types**: TypeScript interfaces for type safety

### Backend (Node.js + Socket.IO)
- **Real-time Communication**: Socket.IO for multiplayer synchronization
- **Game Logic**: Server-side physics and game state management
- **Room Management**: Create, join, and manage game rooms
- **Player Management**: Handle connections, disconnections, and player data

### Key Files

- `src/App.tsx` - Main application component
- `src/services/socketService.ts` - Socket.IO client wrapper
- `server/index.js` - Backend game server
- `src/components/GameCanvas.tsx` - Main game rendering component
- `src/utils/gamePhysics.ts` - Physics engine for car movement and collisions

## 🔧 Configuration

### Game Settings (Configurable by Host)
- Number of laps: 1, 3, 5, or 10
- Maximum players per room: 6
- Game physics constants (speed, acceleration, etc.)

### Server Configuration
- Port: 3001 (configurable via PORT environment variable)
- CORS: Enabled for all origins in development

## 🚀 Deployment

### Frontend Deployment
The frontend can be deployed to any static hosting service (Netlify, Vercel, etc.):

```bash
npm run build
# Deploy the 'dist' folder
```

### Backend Deployment
The backend can be deployed to services like Heroku, Railway, or any Node.js hosting platform:

1. Set the PORT environment variable
2. Update the frontend's socket connection URL in `src/services/socketService.ts`
3. Deploy the server code

### Environment Variables
- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment mode (development/production)

## 🎵 Sound System

The game includes a procedural sound system that generates:
- Engine sounds while driving
- Bottle throwing and impact effects
- Power-up collection sounds
- Explosion effects for eliminations
- Lap completion notifications

Sounds can be toggled on/off via the main menu.

## 🐛 Troubleshooting

### Common Issues

1. **Can't join rooms**: Make sure the backend server is running
2. **Connection errors**: Check if the server URL in `socketService.ts` is correct
3. **Game not starting**: Ensure minimum 2 players are in the room
4. **Performance issues**: Try reducing the number of power-ups or adjusting physics constants

### Development Tips

- Use browser developer tools to monitor WebSocket connections
- Check server logs for connection and game state issues
- The game state is synchronized every frame (60 FPS) for smooth gameplay

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## 🎮 Future Enhancements

- Multiple track layouts
- Car customization and upgrades
- Tournament mode with brackets
- Spectator mode
- Mobile touch controls optimization
- AI opponents for single-player mode