# 🏈 Football Throw Game

An interactive browser-based football throwing game where you time your throw using an animated power meter to hit a receiver target. The game features a 10-second timer, score tracking, and a prize system.

## Features

- **Animated Power Meter**: Watch the power meter oscillate and time your throw perfectly
- **Timer-Based Gameplay**: 10-second rounds to test your skills
- **Receiver Target**: Hit the cartoon receiver to score points
- **Score Tracking**: Track your hits, throws, and accuracy
- **Prize System**: Win prizes based on your performance
- **Full-Screen Experience**: Immersive full-screen gameplay
- **Responsive Design**: Works on desktop and mobile devices

## How to Play

1. Click **THROW!** to start the game (or press Spacebar)
2. Watch the **power meter** on the left side oscillate
3. Click **THROW!** when the power meter is in the optimal range (green zone = 60-90)
4. Try to hit the receiver target to score points
5. You have 10 seconds to make as many successful throws as possible
6. After time runs out, see your final stats and prize!

## Local Development

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone or download this repository
2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to `http://localhost:3000`

## Deployment to Heroku

### Prerequisites
- Heroku account
- Heroku CLI installed
- Git repository initialized

### Deployment Steps

1. **Login to Heroku** (if not already logged in):
```bash
heroku login
```

2. **Create a new Heroku app**:
```bash
heroku create your-app-name
```

3. **Set the Node.js buildpack** (if not automatically detected):
```bash
heroku buildpacks:set heroku/nodejs
```

4. **Deploy to Heroku**:
```bash
git add .
git commit -m "Initial commit"
git push heroku main
```

Or if you're using the master branch:
```bash
git push heroku master
```

5. **Open your app**:
```bash
heroku open
```

### Alternative: Deploy via Heroku Dashboard

1. Go to [Heroku Dashboard](https://dashboard.heroku.com)
2. Click "New" → "Create new app"
3. Connect your GitHub repository
4. Enable automatic deploys (optional)
5. Click "Deploy Branch"

## Project Structure

```
Football-Throw-Game/
├── index.html          # Main game HTML
├── style.css           # Game styling
├── script.js           # Game logic and physics
├── server.js           # Express server for Heroku
├── package.json        # Node.js dependencies
├── Procfile            # Heroku process file
├── .gitignore          # Git ignore file
└── README.md           # This file
```

## Game Mechanics

- **Power Range**: 10-100 (oscillates automatically)
- **Optimal Power**: 75 ± 15 (60-90 range)
- **Target Size**: 80px hit zone
- **Game Duration**: 10 seconds
- **Trajectory**: Parabolic arc with realistic physics

## Browser Compatibility

Works best in modern browsers that support:
- HTML5 Canvas
- CSS3 (gradients, transforms)
- ES6 JavaScript features
- requestAnimationFrame API

## Customization

You can customize the game by modifying:
- `gameState.prize` - Change the prize text
- `TARGET.optimalPower` - Adjust optimal power level
- `TARGET.tolerance` - Change the power tolerance range
- `gameState.timeLeft` - Modify game duration
- `TARGET.size` - Adjust hit zone size

## Future Enhancements

Potential features to add:
- Different difficulty levels
- Multiple receiver targets
- Wind effects
- Sound effects and music
- High score leaderboard
- Multiplayer mode
- Custom prize configuration

## License

MIT License - Feel free to use and modify as needed.

Enjoy the game! 🎮🏈
