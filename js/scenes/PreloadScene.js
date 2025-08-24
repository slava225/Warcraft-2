// Preload Scene - handles asset loading
export class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        // Update loading bar
        this.load.on('progress', (value) => {
            const progressBar = document.getElementById('loading-progress');
            if (progressBar) {
                progressBar.style.width = (value * 100) + '%';
            }
        });

        // Since we're creating sprites programmatically, we don't need to load external images
        // We'll generate them in the create method
    }

    create() {
        // Generate textures programmatically
        this.createPlayerTexture();
        this.createCarTextures();
        this.createBuildingTextures();
        this.createNPCTextures();
        this.createBulletTexture();
        this.createRoadTextures();

        // Start game scene
        this.scene.start('GameScene');
    }

    createPlayerTexture() {
        const graphics = this.add.graphics();
        
        // Create player on foot texture
        graphics.fillStyle(0x4444ff, 1);
        graphics.fillCircle(16, 16, 8);
        graphics.fillStyle(0xffcc99, 1);
        graphics.fillCircle(16, 12, 5);
        graphics.generateTexture('player', 32, 32);
        
        graphics.clear();
    }

    createCarTextures() {
        const graphics = this.add.graphics();
        
        // Regular car
        graphics.fillStyle(0xff4444, 1);
        graphics.fillRect(4, 8, 40, 24);
        graphics.fillStyle(0x333333, 1);
        graphics.fillRect(10, 12, 12, 16);
        graphics.fillRect(26, 12, 12, 16);
        graphics.fillStyle(0x88ccff, 1);
        graphics.fillRect(14, 14, 16, 12);
        graphics.generateTexture('car_red', 48, 40);
        
        graphics.clear();
        
        // Police car
        graphics.fillStyle(0x000088, 1);
        graphics.fillRect(4, 8, 40, 24);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRect(10, 8, 28, 8);
        graphics.fillStyle(0xff0000, 1);
        graphics.fillRect(18, 10, 4, 4);
        graphics.fillStyle(0x0000ff, 1);
        graphics.fillRect(26, 10, 4, 4);
        graphics.fillStyle(0x333333, 1);
        graphics.fillRect(10, 20, 12, 12);
        graphics.fillRect(26, 20, 12, 12);
        graphics.generateTexture('car_police', 48, 40);
        
        graphics.clear();
        
        // Taxi
        graphics.fillStyle(0xffff00, 1);
        graphics.fillRect(4, 8, 40, 24);
        graphics.fillStyle(0x333333, 1);
        graphics.fillRect(10, 12, 12, 16);
        graphics.fillRect(26, 12, 12, 16);
        graphics.fillStyle(0x88ccff, 1);
        graphics.fillRect(14, 14, 16, 12);
        graphics.generateTexture('car_taxi', 48, 40);
        
        graphics.clear();
        
        // Sports car
        graphics.fillStyle(0x00ff00, 1);
        graphics.fillRect(4, 10, 40, 20);
        graphics.fillStyle(0x333333, 1);
        graphics.fillRect(10, 14, 10, 12);
        graphics.fillRect(28, 14, 10, 12);
        graphics.fillStyle(0x88ccff, 1);
        graphics.fillRect(14, 12, 20, 10);
        graphics.generateTexture('car_sport', 48, 40);
        
        graphics.destroy();
    }

    createBuildingTextures() {
        const graphics = this.add.graphics();
        
        // Building 1
        graphics.fillStyle(0x666666, 1);
        graphics.fillRect(0, 0, 128, 128);
        graphics.fillStyle(0x444444, 1);
        for (let y = 10; y < 120; y += 30) {
            for (let x = 10; x < 120; x += 30) {
                graphics.fillRect(x, y, 20, 20);
            }
        }
        graphics.generateTexture('building1', 128, 128);
        
        graphics.clear();
        
        // Building 2
        graphics.fillStyle(0x884444, 1);
        graphics.fillRect(0, 0, 96, 96);
        graphics.fillStyle(0x333333, 1);
        for (let y = 8; y < 88; y += 20) {
            for (let x = 8; x < 88; x += 20) {
                graphics.fillRect(x, y, 12, 12);
            }
        }
        graphics.generateTexture('building2', 96, 96);
        
        graphics.clear();
        
        // Building 3
        graphics.fillStyle(0x448844, 1);
        graphics.fillRect(0, 0, 160, 80);
        graphics.fillStyle(0x88ccff, 1);
        for (let x = 10; x < 150; x += 25) {
            graphics.fillRect(x, 20, 15, 40);
        }
        graphics.generateTexture('building3', 160, 80);
        
        graphics.destroy();
    }

    createNPCTextures() {
        const graphics = this.add.graphics();
        
        // Civilian NPC
        graphics.fillStyle(0x44ff44, 1);
        graphics.fillCircle(16, 16, 8);
        graphics.fillStyle(0xffcc99, 1);
        graphics.fillCircle(16, 12, 5);
        graphics.generateTexture('npc_civilian', 32, 32);
        
        graphics.clear();
        
        // Police NPC
        graphics.fillStyle(0x0000aa, 1);
        graphics.fillCircle(16, 16, 8);
        graphics.fillStyle(0xffcc99, 1);
        graphics.fillCircle(16, 12, 5);
        graphics.fillStyle(0x000088, 1);
        graphics.fillRect(12, 8, 8, 4);
        graphics.generateTexture('npc_police', 32, 32);
        
        graphics.clear();
        
        // Gang member NPC
        graphics.fillStyle(0xff00ff, 1);
        graphics.fillCircle(16, 16, 8);
        graphics.fillStyle(0xffcc99, 1);
        graphics.fillCircle(16, 12, 5);
        graphics.generateTexture('npc_gang', 32, 32);
        
        graphics.destroy();
    }

    createBulletTexture() {
        const graphics = this.add.graphics();
        
        graphics.fillStyle(0xffff00, 1);
        graphics.fillCircle(4, 4, 3);
        graphics.generateTexture('bullet', 8, 8);
        
        graphics.destroy();
    }

    createRoadTextures() {
        const graphics = this.add.graphics();
        
        // Horizontal road
        graphics.fillStyle(0x333333, 1);
        graphics.fillRect(0, 0, 128, 64);
        graphics.fillStyle(0xffff00, 1);
        graphics.fillRect(0, 30, 128, 4);
        graphics.generateTexture('road_horizontal', 128, 64);
        
        graphics.clear();
        
        // Vertical road
        graphics.fillStyle(0x333333, 1);
        graphics.fillRect(0, 0, 64, 128);
        graphics.fillStyle(0xffff00, 1);
        graphics.fillRect(30, 0, 4, 128);
        graphics.generateTexture('road_vertical', 64, 128);
        
        graphics.clear();
        
        // Intersection
        graphics.fillStyle(0x333333, 1);
        graphics.fillRect(0, 0, 128, 128);
        graphics.fillStyle(0xffff00, 1);
        graphics.fillRect(0, 62, 128, 4);
        graphics.fillRect(62, 0, 4, 128);
        graphics.generateTexture('road_intersection', 128, 128);
        
        graphics.clear();
        
        // Sidewalk
        graphics.fillStyle(0x555555, 1);
        graphics.fillRect(0, 0, 64, 64);
        graphics.lineStyle(1, 0x666666, 1);
        for (let i = 0; i < 64; i += 16) {
            graphics.strokeRect(i, 0, 16, 64);
        }
        graphics.generateTexture('sidewalk', 64, 64);
        
        graphics.destroy();
    }
}