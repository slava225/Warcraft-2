// City Generator class
export class CityGenerator {
    constructor(scene) {
        this.scene = scene;
        this.buildings = [];
        this.roads = [];
        this.gridSize = 128;
        this.worldWidth = 3200;
        this.worldHeight = 3200;
    }

    generateCity() {
        // Create ground
        this.createGround();
        
        // Create road grid
        this.createRoadGrid();
        
        // Create buildings
        this.createBuildings();
        
        // Add decorations
        this.addDecorations();
    }

    createGround() {
        // Create tiled ground
        for (let x = 0; x < this.worldWidth; x += 64) {
            for (let y = 0; y < this.worldHeight; y += 64) {
                const sidewalk = this.scene.add.image(x, y, 'sidewalk');
                sidewalk.setOrigin(0, 0);
                sidewalk.setDepth(-2);
            }
        }
    }

    createRoadGrid() {
        const roadWidth = 128;
        const blockSize = 320;
        
        // Create horizontal roads
        for (let y = roadWidth; y < this.worldHeight; y += blockSize) {
            for (let x = 0; x < this.worldWidth; x += roadWidth) {
                const road = this.scene.add.image(x, y, 'road_horizontal');
                road.setOrigin(0, 0);
                road.setDepth(-1);
                this.roads.push(road);
            }
        }
        
        // Create vertical roads
        for (let x = roadWidth; x < this.worldWidth; x += blockSize) {
            for (let y = 0; y < this.worldHeight; y += roadWidth) {
                const road = this.scene.add.image(x, y, 'road_vertical');
                road.setOrigin(0, 0);
                road.setDepth(-1);
                this.roads.push(road);
            }
        }
        
        // Create intersections
        for (let x = roadWidth; x < this.worldWidth; x += blockSize) {
            for (let y = roadWidth; y < this.worldHeight; y += blockSize) {
                const intersection = this.scene.add.image(x, y, 'road_intersection');
                intersection.setOrigin(0, 0);
                intersection.setDepth(-1);
                this.roads.push(intersection);
            }
        }
    }

    createBuildings() {
        const buildingTypes = ['building1', 'building2', 'building3'];
        const blockSize = 320;
        const roadWidth = 128;
        const buildingMargin = 20;
        
        // Create buildings in blocks between roads
        for (let blockX = 0; blockX < this.worldWidth / blockSize; blockX++) {
            for (let blockY = 0; blockY < this.worldHeight / blockSize; blockY++) {
                const baseX = blockX * blockSize;
                const baseY = blockY * blockSize;
                
                // Skip road areas
                if (blockX === 0 || blockY === 0) continue;
                
                // Randomly place buildings in this block
                const numBuildings = Phaser.Math.Between(2, 4);
                
                for (let i = 0; i < numBuildings; i++) {
                    const buildingType = Phaser.Math.RND.pick(buildingTypes);
                    
                    // Calculate building position within block
                    let x, y, width, height;
                    
                    if (buildingType === 'building1') {
                        width = 128;
                        height = 128;
                    } else if (buildingType === 'building2') {
                        width = 96;
                        height = 96;
                    } else {
                        width = 160;
                        height = 80;
                    }
                    
                    // Position building within block avoiding roads
                    x = baseX + buildingMargin + Phaser.Math.Between(0, blockSize - roadWidth - width - buildingMargin * 2);
                    y = baseY + buildingMargin + Phaser.Math.Between(0, blockSize - roadWidth - height - buildingMargin * 2);
                    
                    // Avoid placing on roads
                    if (x < roadWidth + buildingMargin || y < roadWidth + buildingMargin) {
                        x += roadWidth;
                        y += roadWidth;
                    }
                    
                    // Create building sprite with physics
                    const building = this.scene.physics.add.staticImage(x, y, buildingType);
                    building.setOrigin(0, 0);
                    building.setDepth(1);
                    building.setImmovable(true);
                    
                    this.buildings.push(building);
                }
            }
        }
        
        // Add some special buildings
        this.createSpecialBuildings();
    }

    createSpecialBuildings() {
        // Police station
        const policeStation = this.scene.physics.add.staticImage(800, 800, 'building1');
        policeStation.setTint(0x0000ff);
        policeStation.setScale(1.5);
        policeStation.setDepth(1);
        policeStation.setImmovable(true);
        this.buildings.push(policeStation);
        
        // Hospital
        const hospital = this.scene.physics.add.staticImage(2400, 800, 'building1');
        hospital.setTint(0xff0000);
        hospital.setScale(1.5);
        hospital.setDepth(1);
        hospital.setImmovable(true);
        this.buildings.push(hospital);
        
        // Bank
        const bank = this.scene.physics.add.staticImage(1600, 2400, 'building2');
        bank.setTint(0x00ff00);
        bank.setScale(1.5);
        bank.setDepth(1);
        bank.setImmovable(true);
        this.buildings.push(bank);
    }

    addDecorations() {
        // Add street lights
        for (let x = 200; x < this.worldWidth; x += 400) {
            for (let y = 200; y < this.worldHeight; y += 400) {
                const light = this.scene.add.circle(x, y, 8, 0xffff00, 0.5);
                light.setDepth(2);
            }
        }
        
        // Add trees
        for (let i = 0; i < 50; i++) {
            const x = Phaser.Math.Between(100, this.worldWidth - 100);
            const y = Phaser.Math.Between(100, this.worldHeight - 100);
            
            // Check if position is not on road
            const onRoad = this.isOnRoad(x, y);
            if (!onRoad) {
                const tree = this.scene.add.circle(x, y, 15, 0x00aa00);
                tree.setDepth(3);
                
                // Add collision for trees
                const treeCollider = this.scene.physics.add.staticImage(x, y, null);
                treeCollider.setSize(30, 30);
                treeCollider.setVisible(false);
                this.buildings.push(treeCollider);
            }
        }
        
        // Add parking spots
        for (let i = 0; i < 20; i++) {
            const x = Phaser.Math.Between(200, this.worldWidth - 200);
            const y = Phaser.Math.Between(200, this.worldHeight - 200);
            
            if (this.isNearRoad(x, y)) {
                const parkingSpot = this.scene.add.rectangle(x, y, 60, 40, 0x666666, 0.3);
                parkingSpot.setStrokeStyle(2, 0xffffff, 0.5);
                parkingSpot.setDepth(0);
            }
        }
    }

    isOnRoad(x, y) {
        const blockSize = 320;
        const roadWidth = 128;
        
        const blockX = Math.floor(x / blockSize);
        const blockY = Math.floor(y / blockSize);
        const localX = x % blockSize;
        const localY = y % blockSize;
        
        return localX < roadWidth || localY < roadWidth;
    }

    isNearRoad(x, y) {
        const blockSize = 320;
        const roadWidth = 128;
        const nearDistance = 150;
        
        const localX = x % blockSize;
        const localY = y % blockSize;
        
        return (localX < nearDistance && localX > roadWidth) || 
               (localY < nearDistance && localY > roadWidth);
    }
}