// City Generator class - Realistic city with proper layout
export class CityGenerator {
    constructor(scene) {
        this.scene = scene;
        this.buildings = [];
        this.roads = [];
        this.sidewalks = [];
        this.decorations = [];
        
        // City layout parameters
        this.worldWidth = 3200;
        this.worldHeight = 3200;
        this.blockSize = 400;  // Size of city blocks
        this.roadWidth = 80;   // Width of roads
        this.sidewalkWidth = 40; // Width of sidewalks
        this.buildingMargin = 10; // Space between buildings
    }

    generateCity() {
        // Create base ground
        this.createGround();
        
        // Create road network with sidewalks
        this.createRoadNetwork();
        
        // Create city blocks with buildings
        this.createCityBlocks();
        
        // Add special buildings
        this.createSpecialBuildings();
        
        // Add city decorations
        this.addCityDecorations();
        
        // Add vegetation
        this.addVegetation();
    }

    createGround() {
        // Create base ground texture (grass/dirt)
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(0x2a4a2a, 1);
        graphics.fillRect(0, 0, this.worldWidth, this.worldHeight);
        graphics.setDepth(-3);
    }

    createRoadNetwork() {
        // Calculate road positions
        const numBlocksX = Math.floor(this.worldWidth / this.blockSize);
        const numBlocksY = Math.floor(this.worldHeight / this.blockSize);
        
        // Create roads and sidewalks
        for (let bx = 0; bx <= numBlocksX; bx++) {
            for (let by = 0; by <= numBlocksY; by++) {
                const x = bx * this.blockSize;
                const y = by * this.blockSize;
                
                // Horizontal roads
                if (bx < numBlocksX) {
                    // Road
                    for (let rx = x; rx < x + this.blockSize - this.roadWidth; rx += 64) {
                        const road = this.scene.add.image(rx, y - this.roadWidth/2, 'road_horizontal');
                        road.setOrigin(0, 0.5);
                        road.setDepth(-1);
                        this.roads.push(road);
                    }
                    
                    // Sidewalks on both sides
                    this.createSidewalk(x, y - this.roadWidth/2 - this.sidewalkWidth, 
                                      this.blockSize - this.roadWidth, this.sidewalkWidth);
                    this.createSidewalk(x, y + this.roadWidth/2, 
                                      this.blockSize - this.roadWidth, this.sidewalkWidth);
                }
                
                // Vertical roads
                if (by < numBlocksY) {
                    // Road
                    for (let ry = y; ry < y + this.blockSize - this.roadWidth; ry += 64) {
                        const road = this.scene.add.image(x - this.roadWidth/2, ry, 'road_vertical');
                        road.setOrigin(0.5, 0);
                        road.setDepth(-1);
                        this.roads.push(road);
                    }
                    
                    // Sidewalks on both sides
                    this.createSidewalk(x - this.roadWidth/2 - this.sidewalkWidth, y,
                                      this.sidewalkWidth, this.blockSize - this.roadWidth);
                    this.createSidewalk(x + this.roadWidth/2, y,
                                      this.sidewalkWidth, this.blockSize - this.roadWidth);
                }
                
                // Intersections
                const intersection = this.scene.add.image(x, y, 'road_intersection');
                intersection.setOrigin(0.5, 0.5);
                intersection.setDepth(-1);
                this.roads.push(intersection);
            }
        }
    }
    
    createSidewalk(x, y, width, height) {
        const sidewalk = this.scene.add.rectangle(x, y, width, height, 0x888888);
        sidewalk.setOrigin(0, 0);
        sidewalk.setDepth(-2);
        sidewalk.setStrokeStyle(1, 0x666666);
        this.sidewalks.push(sidewalk);
    }

    createCityBlocks() {
        const numBlocksX = Math.floor(this.worldWidth / this.blockSize);
        const numBlocksY = Math.floor(this.worldHeight / this.blockSize);
        
        for (let bx = 0; bx < numBlocksX; bx++) {
            for (let by = 0; by < numBlocksY; by++) {
                // Calculate block boundaries (inside sidewalks)
                const blockX = bx * this.blockSize + this.roadWidth/2 + this.sidewalkWidth;
                const blockY = by * this.blockSize + this.roadWidth/2 + this.sidewalkWidth;
                const blockWidth = this.blockSize - this.roadWidth - this.sidewalkWidth * 2;
                const blockHeight = this.blockSize - this.roadWidth - this.sidewalkWidth * 2;
                
                // Determine block type
                const blockType = this.getBlockType(bx, by, numBlocksX, numBlocksY);
                
                // Create buildings based on block type
                this.createBlockBuildings(blockX, blockY, blockWidth, blockHeight, blockType);
            }
        }
    }
    
    getBlockType(bx, by, maxX, maxY) {
        // Center blocks - commercial/downtown
        if (bx >= maxX/3 && bx <= 2*maxX/3 && by >= maxY/3 && by <= 2*maxY/3) {
            return 'commercial';
        }
        // Edge blocks - residential
        if (bx === 0 || by === 0 || bx === maxX-1 || by === maxY-1) {
            return 'residential';
        }
        // Mixed zones
        return Phaser.Math.RND.pick(['commercial', 'residential', 'mixed']);
    }
    
    createBlockBuildings(x, y, width, height, type) {
        if (width <= 0 || height <= 0) return;
        
        switch(type) {
            case 'commercial':
                this.createCommercialBlock(x, y, width, height);
                break;
            case 'residential':
                this.createResidentialBlock(x, y, width, height);
                break;
            case 'mixed':
                this.createMixedBlock(x, y, width, height);
                break;
        }
    }
    
    createCommercialBlock(x, y, width, height) {
        // Create shops and offices along the street
        const shopWidth = 60;
        const shopHeight = 80;
        const spacing = 10;
        
        // Shops along horizontal streets
        for (let sx = x; sx < x + width - shopWidth; sx += shopWidth + spacing) {
            // North side shops
            this.createShop(sx, y, shopWidth, shopHeight);
            // South side shops
            this.createShop(sx, y + height - shopHeight, shopWidth, shopHeight);
        }
        
        // Office building in center
        if (width > 150 && height > 150) {
            const officeWidth = 100;
            const officeHeight = 100;
            this.createOfficeBuilding(
                x + (width - officeWidth) / 2,
                y + (height - officeHeight) / 2,
                officeWidth,
                officeHeight
            );
        }
    }
    
    createResidentialBlock(x, y, width, height) {
        // Create houses with yards
        const houseWidth = 70;
        const houseHeight = 70;
        const spacing = 20;
        
        for (let hx = x + spacing; hx < x + width - houseWidth; hx += houseWidth + spacing) {
            for (let hy = y + spacing; hy < y + height - houseHeight; hy += houseHeight + spacing) {
                this.createHouse(hx, hy, houseWidth, houseHeight);
            }
        }
    }
    
    createMixedBlock(x, y, width, height) {
        // Mix of shops and apartments
        const buildingWidth = 80;
        const buildingHeight = 90;
        const spacing = 15;
        
        for (let bx = x; bx < x + width - buildingWidth; bx += buildingWidth + spacing) {
            for (let by = y; by < y + height - buildingHeight; by += buildingHeight + spacing) {
                if (Phaser.Math.Between(0, 1) === 0) {
                    this.createShop(bx, by, buildingWidth, buildingHeight);
                } else {
                    this.createApartment(bx, by, buildingWidth, buildingHeight);
                }
            }
        }
    }
    
    createShop(x, y, width, height) {
        const building = this.scene.physics.add.staticImage(x + width/2, y + height/2, 'building2');
        building.setDisplaySize(width, height);
        building.setTint(Phaser.Math.RND.pick([0xffaaaa, 0xaaffaa, 0xaaaaff]));
        building.setDepth(1);
        this.buildings.push(building);
        
        // Add shop sign
        const signs = ['🏪', '🏬', '🛒', '☕', '🍕', '🍔'];
        const sign = this.scene.add.text(x + width/2, y + 10, Phaser.Math.RND.pick(signs), {
            fontSize: '20px'
        });
        sign.setOrigin(0.5);
        sign.setDepth(2);
    }
    
    createHouse(x, y, width, height) {
        const building = this.scene.physics.add.staticImage(x + width/2, y + height/2, 'building1');
        building.setDisplaySize(width, height);
        building.setTint(Phaser.Math.RND.pick([0xcc9966, 0x996633, 0xccaa88]));
        building.setDepth(1);
        this.buildings.push(building);
    }
    
    createApartment(x, y, width, height) {
        const building = this.scene.physics.add.staticImage(x + width/2, y + height/2, 'building3');
        building.setDisplaySize(width, height);
        building.setTint(0x888888);
        building.setDepth(1);
        this.buildings.push(building);
    }
    
    createOfficeBuilding(x, y, width, height) {
        const building = this.scene.physics.add.staticImage(x + width/2, y + height/2, 'building1');
        building.setDisplaySize(width, height);
        building.setTint(0x4444aa);
        building.setDepth(1);
        this.buildings.push(building);
    }

    createSpecialBuildings() {
        // Police station in center
        this.createPoliceStation(1600, 1500, 120, 120);
        
        // Hospital
        this.createHospital(2400, 800, 140, 100);
        
        // Bank in downtown
        this.createBank(1600, 1600, 100, 100);
        
        // Gas stations
        this.createGasStation(500, 500, 80, 60);
        this.createGasStation(2600, 2600, 80, 60);
    }
    
    createPoliceStation(x, y, width, height) {
        const building = this.scene.physics.add.staticImage(x, y, 'building1');
        building.setDisplaySize(width, height);
        building.setTint(0x0000aa);
        building.setDepth(1);
        this.buildings.push(building);
        
        // Add police sign
        const sign = this.scene.add.text(x, y - height/2 - 10, '🚔 POLICE', {
            fontSize: '16px',
            backgroundColor: '#000088',
            padding: { x: 5, y: 2 }
        });
        sign.setOrigin(0.5);
        sign.setDepth(2);
    }
    
    createHospital(x, y, width, height) {
        const building = this.scene.physics.add.staticImage(x, y, 'building1');
        building.setDisplaySize(width, height);
        building.setTint(0xffffff);
        building.setDepth(1);
        this.buildings.push(building);
        
        // Add hospital sign
        const sign = this.scene.add.text(x, y - height/2 - 10, '🏥 HOSPITAL', {
            fontSize: '16px',
            backgroundColor: '#ff0000',
            padding: { x: 5, y: 2 }
        });
        sign.setOrigin(0.5);
        sign.setDepth(2);
    }
    
    createBank(x, y, width, height) {
        const building = this.scene.physics.add.staticImage(x, y, 'building2');
        building.setDisplaySize(width, height);
        building.setTint(0x008800);
        building.setDepth(1);
        this.buildings.push(building);
        
        // Add bank sign
        const sign = this.scene.add.text(x, y - height/2 - 10, '🏦 BANK', {
            fontSize: '16px',
            backgroundColor: '#008800',
            padding: { x: 5, y: 2 }
        });
        sign.setOrigin(0.5);
        sign.setDepth(2);
    }
    
    createGasStation(x, y, width, height) {
        const building = this.scene.physics.add.staticImage(x, y, 'building3');
        building.setDisplaySize(width, height);
        building.setTint(0xff8800);
        building.setDepth(1);
        this.buildings.push(building);
        
        // Add gas station sign
        const sign = this.scene.add.text(x, y, '⛽', {
            fontSize: '32px'
        });
        sign.setOrigin(0.5);
        sign.setDepth(2);
    }

    addCityDecorations() {
        // Add street lights along roads
        for (let x = 0; x < this.worldWidth; x += this.blockSize) {
            for (let y = 0; y < this.worldHeight; y += this.blockSize) {
                // Lights at intersections
                this.addStreetLight(x - 20, y - 20);
                this.addStreetLight(x + 20, y - 20);
                this.addStreetLight(x - 20, y + 20);
                this.addStreetLight(x + 20, y + 20);
            }
        }
        
        // Add parking spots along roads
        for (let i = 0; i < 30; i++) {
            const blockX = Phaser.Math.Between(0, Math.floor(this.worldWidth / this.blockSize) - 1);
            const blockY = Phaser.Math.Between(0, Math.floor(this.worldHeight / this.blockSize) - 1);
            const x = blockX * this.blockSize + this.roadWidth/2 + this.sidewalkWidth + 10;
            const y = blockY * this.blockSize + Phaser.Math.Between(50, this.blockSize - 50);
            
            this.addParkingSpot(x, y);
        }
        
        // Add trash cans and benches
        for (let i = 0; i < 40; i++) {
            const x = Phaser.Math.Between(100, this.worldWidth - 100);
            const y = Phaser.Math.Between(100, this.worldHeight - 100);
            
            if (this.isOnSidewalk(x, y)) {
                if (Phaser.Math.Between(0, 1) === 0) {
                    this.addBench(x, y);
                } else {
                    this.addTrashCan(x, y);
                }
            }
        }
    }
    
    addStreetLight(x, y) {
        const pole = this.scene.add.rectangle(x, y, 4, 20, 0x444444);
        pole.setDepth(3);
        
        const light = this.scene.add.circle(x, y - 10, 6, 0xffff88, 0.8);
        light.setDepth(3);
        
        // Add glow effect
        const glow = this.scene.add.circle(x, y - 10, 20, 0xffff00, 0.2);
        glow.setDepth(2);
    }
    
    addParkingSpot(x, y) {
        const spot = this.scene.add.rectangle(x, y, 50, 30, 0x555555, 0.5);
        spot.setStrokeStyle(2, 0xffffff, 0.8);
        spot.setDepth(0);
    }
    
    addBench(x, y) {
        const bench = this.scene.add.rectangle(x, y, 30, 15, 0x8b4513);
        bench.setDepth(2);
    }
    
    addTrashCan(x, y) {
        const can = this.scene.add.circle(x, y, 8, 0x555555);
        can.setStrokeStyle(1, 0x333333);
        can.setDepth(2);
    }
    
    addVegetation() {
        // Add trees in residential areas and parks
        for (let i = 0; i < 80; i++) {
            const x = Phaser.Math.Between(100, this.worldWidth - 100);
            const y = Phaser.Math.Between(100, this.worldHeight - 100);
            
            // Only place trees in appropriate areas
            if (!this.isOnRoad(x, y) && !this.isOnSidewalk(x, y) && !this.isNearBuilding(x, y)) {
                this.addTree(x, y);
            }
        }
        
        // Add bushes and grass patches
        for (let i = 0; i < 60; i++) {
            const x = Phaser.Math.Between(100, this.worldWidth - 100);
            const y = Phaser.Math.Between(100, this.worldHeight - 100);
            
            if (!this.isOnRoad(x, y) && !this.isOnSidewalk(x, y)) {
                this.addBush(x, y);
            }
        }
    }
    
    addTree(x, y) {
        // Tree trunk
        const trunk = this.scene.add.rectangle(x, y + 10, 8, 16, 0x8b4513);
        trunk.setDepth(3);
        
        // Tree crown
        const crown = this.scene.add.circle(x, y - 5, 20, 0x228822);
        crown.setDepth(3);
        
        // Add collision
        const collider = this.scene.physics.add.staticImage(x, y, null);
        collider.setSize(30, 30);
        collider.setVisible(false);
        this.buildings.push(collider);
    }
    
    addBush(x, y) {
        const bush = this.scene.add.ellipse(x, y, 25, 20, 0x336633);
        bush.setDepth(2);
    }

    isOnRoad(x, y) {
        const localX = x % this.blockSize;
        const localY = y % this.blockSize;
        
        return (localX < this.roadWidth/2 || localX > this.blockSize - this.roadWidth/2) ||
               (localY < this.roadWidth/2 || localY > this.blockSize - this.roadWidth/2);
    }
    
    isOnSidewalk(x, y) {
        const localX = x % this.blockSize;
        const localY = y % this.blockSize;
        
        const onHorizontalSidewalk = 
            (localX >= this.roadWidth/2 && localX <= this.roadWidth/2 + this.sidewalkWidth) ||
            (localX >= this.blockSize - this.roadWidth/2 - this.sidewalkWidth && 
             localX <= this.blockSize - this.roadWidth/2);
             
        const onVerticalSidewalk = 
            (localY >= this.roadWidth/2 && localY <= this.roadWidth/2 + this.sidewalkWidth) ||
            (localY >= this.blockSize - this.roadWidth/2 - this.sidewalkWidth && 
             localY <= this.blockSize - this.roadWidth/2);
        
        return onHorizontalSidewalk || onVerticalSidewalk;
    }
    
    isNearBuilding(x, y) {
        for (let building of this.buildings) {
            const dist = Phaser.Math.Distance.Between(x, y, building.x, building.y);
            if (dist < 50) return true;
        }
        return false;
    }
}