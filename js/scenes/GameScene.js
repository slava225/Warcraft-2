// Main Game Scene
import { Player } from '../entities/Player.js';
import { Car } from '../entities/Car.js';
import { NPC } from '../entities/NPC.js';
import { CityGenerator } from '../world/CityGenerator.js';
import { InputManager } from '../controls/InputManager.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.cars = [];
        this.npcs = [];
        this.bullets = [];
        this.buildings = [];
    }

    create() {
        // Set world bounds
        this.physics.world.setBounds(0, 0, 3200, 3200);
        
        // Generate city
        this.cityGenerator = new CityGenerator(this);
        this.cityGenerator.generateCity();
        this.buildings = this.cityGenerator.buildings;
        
        // Create player
        this.player = new Player(this, 1600, 1600);
        
        // Create cars
        this.spawnCars();
        
        // Create NPCs
        this.spawnNPCs();
        
        // Setup camera
        this.cameras.main.setBounds(0, 0, 3200, 3200);
        this.cameras.main.startFollow(this.player.sprite);
        
        // Dynamic zoom based on screen size
        const baseZoom = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
        this.cameras.main.setZoom(Math.max(1.0, Math.min(2.0, baseZoom * 1.5)));
        
        // Handle resize
        this.scale.on('resize', (gameSize) => {
            const width = gameSize.width;
            const height = gameSize.height;
            this.cameras.resize(width, height);
            
            const newZoom = Math.min(width / 1280, height / 720);
            this.cameras.main.setZoom(Math.max(1.0, Math.min(2.0, newZoom * 1.5)));
        });
        
        // Setup input
        this.inputManager = new InputManager(this, this.player);
        
        // Setup collisions
        this.setupCollisions();
        
        // Create UI
        this.createUI();
        
        // Start game loop
        this.time.addEvent({
            delay: 2000,
            callback: this.spawnRandomCar,
            callbackScope: this,
            loop: true
        });
        
        this.time.addEvent({
            delay: 3000,
            callback: this.spawnRandomNPC,
            callbackScope: this,
            loop: true
        });
    }

    update(time, delta) {
        // Update player
        this.player.update(delta);
        
        // Update input
        this.inputManager.update();
        
        // Update cars
        this.cars.forEach(car => {
            if (car.active) {
                car.update(delta);
            }
        });
        
        // Update NPCs
        this.npcs.forEach(npc => {
            if (npc.active) {
                npc.update(delta, this.player);
            }
        });
        
        // Update bullets
        this.bullets = this.bullets.filter(bullet => {
            if (!bullet.active) return false;
            
            // Check if bullet is out of bounds
            if (bullet.x < 0 || bullet.x > 3200 || bullet.y < 0 || bullet.y > 3200) {
                bullet.destroy();
                return false;
            }
            
            return true;
        });
        
        // Update UI
        this.updateUI();
    }

    spawnCars() {
        const carTypes = ['car_red', 'car_taxi', 'car_sport', 'car_police'];
        const positions = [
            { x: 400, y: 400 },
            { x: 800, y: 600 },
            { x: 1200, y: 800 },
            { x: 1600, y: 1000 },
            { x: 2000, y: 1200 },
            { x: 2400, y: 1400 },
            { x: 600, y: 1800 },
            { x: 1000, y: 2200 }
        ];
        
        positions.forEach((pos, index) => {
            const carType = carTypes[index % carTypes.length];
            const car = new Car(this, pos.x, pos.y, carType);
            this.cars.push(car);
        });
    }

    spawnNPCs() {
        const npcTypes = ['npc_civilian', 'npc_police', 'npc_gang'];
        
        for (let i = 0; i < 15; i++) {
            const x = Phaser.Math.Between(200, 3000);
            const y = Phaser.Math.Between(200, 3000);
            const type = npcTypes[i % npcTypes.length];
            const npc = new NPC(this, x, y, type);
            this.npcs.push(npc);
        }
    }

    spawnRandomCar() {
        const carTypes = ['car_red', 'car_taxi', 'car_sport'];
        const edges = [
            { x: Phaser.Math.Between(100, 3100), y: 100 },
            { x: Phaser.Math.Between(100, 3100), y: 3100 },
            { x: 100, y: Phaser.Math.Between(100, 3100) },
            { x: 3100, y: Phaser.Math.Between(100, 3100) }
        ];
        
        const edge = Phaser.Math.RND.pick(edges);
        const carType = Phaser.Math.RND.pick(carTypes);
        
        // Remove old inactive cars
        this.cars = this.cars.filter(car => car.active);
        
        if (this.cars.length < 20) {
            const car = new Car(this, edge.x, edge.y, carType);
            car.setAI(true);
            this.cars.push(car);
        }
    }

    spawnRandomNPC() {
        const npcTypes = ['npc_civilian', 'npc_gang'];
        
        // Remove old inactive NPCs
        this.npcs = this.npcs.filter(npc => npc.active);
        
        if (this.npcs.length < 25) {
            const x = Phaser.Math.Between(200, 3000);
            const y = Phaser.Math.Between(200, 3000);
            const type = Phaser.Math.RND.pick(npcTypes);
            const npc = new NPC(this, x, y, type);
            this.npcs.push(npc);
        }
    }

    setupCollisions() {
        // Player vs Cars
        this.cars.forEach(car => {
            this.physics.add.collider(this.player.sprite, car.sprite);
        });
        
        // Player vs Buildings
        this.buildings.forEach(building => {
            this.physics.add.collider(this.player.sprite, building);
        });
        
        // Cars vs Buildings
        this.cars.forEach(car => {
            this.buildings.forEach(building => {
                this.physics.add.collider(car.sprite, building);
            });
        });
        
        // Cars vs Cars
        this.cars.forEach((car, index) => {
            for (let i = index + 1; i < this.cars.length; i++) {
                this.physics.add.collider(car.sprite, this.cars[i].sprite);
            }
        });
        
        // NPCs vs Buildings
        this.npcs.forEach(npc => {
            this.buildings.forEach(building => {
                this.physics.add.collider(npc.sprite, building);
            });
        });
    }

    createBullet(x, y, angle) {
        const bullet = this.physics.add.sprite(x, y, 'bullet');
        bullet.setScale(0.5);
        
        const speed = 800;
        const velocityX = Math.cos(angle) * speed;
        const velocityY = Math.sin(angle) * speed;
        
        bullet.setVelocity(velocityX, velocityY);
        bullet.rotation = angle;
        
        this.bullets.push(bullet);
        
        // Bullet vs NPCs collision
        this.npcs.forEach(npc => {
            this.physics.add.overlap(bullet, npc.sprite, () => {
                if (npc.active) {
                    npc.takeDamage(25);
                    bullet.destroy();
                }
            });
        });
        
        // Bullet vs Buildings collision
        this.buildings.forEach(building => {
            this.physics.add.collider(bullet, building, () => {
                bullet.destroy();
            });
        });
        
        // Destroy bullet after 2 seconds
        this.time.delayedCall(2000, () => {
            if (bullet.active) {
                bullet.destroy();
            }
        });
        
        return bullet;
    }

    createUI() {
        // Health bar background
        this.healthBarBg = this.add.rectangle(10, 10, 204, 24, 0x333333)
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(1000);
        
        // Health bar
        this.healthBar = this.add.rectangle(12, 12, 200, 20, 0xff0000)
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(1001);
        
        // Wanted level text
        this.wantedText = this.add.text(10, 40, 'Wanted: ☆☆☆☆☆', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        })
        .setScrollFactor(0)
        .setDepth(1000);
        
        // Score text
        this.scoreText = this.add.text(10, 70, 'Score: 0', {
            fontSize: '18px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        })
        .setScrollFactor(0)
        .setDepth(1000);
        
        // Car indicator
        this.carIndicator = this.add.text(10, 100, '', {
            fontSize: '16px',
            fill: '#ffff00',
            fontFamily: 'Arial'
        })
        .setScrollFactor(0)
        .setDepth(1000);
    }

    updateUI() {
        // Update health bar
        const healthPercent = this.player.health / this.player.maxHealth;
        this.healthBar.width = 200 * healthPercent;
        
        if (healthPercent > 0.6) {
            this.healthBar.fillColor = 0x00ff00;
        } else if (healthPercent > 0.3) {
            this.healthBar.fillColor = 0xffff00;
        } else {
            this.healthBar.fillColor = 0xff0000;
        }
        
        // Update wanted level
        const stars = '★'.repeat(this.player.wantedLevel) + '☆'.repeat(5 - this.player.wantedLevel);
        this.wantedText.setText(`Wanted: ${stars}`);
        
        // Update score
        this.scoreText.setText(`Score: ${this.player.score}`);
        
        // Update car indicator
        if (this.player.currentCar) {
            this.carIndicator.setText('In Vehicle 🚗');
        } else {
            this.carIndicator.setText('');
        }
    }

    gameOver() {
        this.scene.pause();
        
        const gameOverText = this.add.text(640, 360, 'WASTED', {
            fontSize: '72px',
            fill: '#ff0000',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 4
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(2000);
        
        const restartText = this.add.text(640, 440, 'Click to Restart', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(2000);
        
        this.input.once('pointerdown', () => {
            this.scene.restart();
        });
    }
}