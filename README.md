# City Chaos - GTA 2 Style Game

A top-down action game inspired by GTA 2, built with modern web technologies.

🎮 **[Play Now](https://yourusername.github.io/city-chaos-game)**

## Features

- 🚗 **Vehicle System** - Steal and drive various cars (sports cars, taxis, police cars)
- 🔫 **Combat** - Shoot enemies and escape from police
- 🏙️ **Open World** - Explore a procedurally generated city with streets and buildings
- 👮 **Wanted System** - 5-star wanted level system like GTA
- 🤖 **AI NPCs** - Civilians, gang members, and police with different behaviors
- 📱 **Mobile Support** - Full touch controls with virtual joystick
- 🎯 **Score System** - Earn points for actions and survival

## Controls

### Desktop
- **WASD / Arrow Keys** - Move/Drive
- **Mouse Click** - Shoot
- **Enter** - Enter/Exit vehicle
- **Space** - Shoot (auto-aim)

### Mobile
- **Virtual Joystick** - Move/Drive
- **🔫 Button** - Shoot
- **🚗 Button** - Enter/Exit vehicle

## Technologies

- **HTML Living Standard** - Modern HTML5 features
- **ECMAScript 2025** - Latest JavaScript features
- **Phaser 3** - Powerful HTML5 game framework
- **Mobile-First Design** - Responsive and touch-optimized

## Local Development

1. Clone the repository:
```bash
git clone https://github.com/yourusername/city-chaos-game.git
cd city-chaos-game
```

2. Start a local server:
```bash
# Using Python
python3 -m http.server 8000

# Or using Node.js
npx http-server -p 8000
```

3. Open in browser:
```
http://localhost:8000
```

## Deployment

The game is automatically deployed to GitHub Pages when you push to the main branch.

### Setup GitHub Pages:
1. Go to repository Settings
2. Navigate to Pages section
3. Select "Deploy from a branch"
4. Choose "main" branch and "/" (root) folder
5. Save and wait for deployment

## Game Mechanics

### Wanted Level
- ⭐ Level 1: Minor crimes
- ⭐⭐ Level 2: Police start noticing
- ⭐⭐⭐ Level 3: Active police pursuit
- ⭐⭐⭐⭐ Level 4: Heavy police response
- ⭐⭐⭐⭐⭐ Level 5: Maximum heat!

### NPCs
- **Civilians** (Green) - Run away from danger
- **Police** (Blue) - Chase players with wanted level
- **Gang Members** (Purple) - Randomly aggressive

### Vehicles
- **Red Car** - Standard vehicle
- **Taxi** (Yellow) - Common city car
- **Sports Car** (Green) - Fastest vehicle
- **Police Car** (Blue) - Used by police

## Contributing

Feel free to submit issues and pull requests!

## License

MIT License - Feel free to use this code for your own projects!

## Credits

Built with ❤️ using Phaser 3
