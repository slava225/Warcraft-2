// Игровая карта и ландшафт
export class WorldMap {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.tileSize = 32;
        this.tiles = [];
        this.resources = [];
        
        // Типы тайлов
        this.tileTypes = {
            GRASS: 0,
            DIRT: 1,
            WATER: 2,
            FOREST: 3,
            STONE: 4,
            GOLD: 5
        };
        
        // Цвета тайлов
        this.tileColors = {
            [this.tileTypes.GRASS]: '#4a7c59',
            [this.tileTypes.DIRT]: '#8b4513',
            [this.tileTypes.WATER]: '#4682b4',
            [this.tileTypes.FOREST]: '#228b22',
            [this.tileTypes.STONE]: '#696969',
            [this.tileTypes.GOLD]: '#ffd700'
        };
    }

    generate() {
        // Инициализируем массив тайлов
        this.tiles = Array(this.height).fill().map(() => Array(this.width).fill(this.tileTypes.GRASS));
        
        // Генерируем ландшафт
        this.generateTerrain();
        this.generateResources();
        this.generateWater();
        
        console.log('Карта сгенерирована');
    }

    generateTerrain() {
        // Используем шум Перлина для естественного ландшафта
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const noiseValue = this.noise(x * 0.1, y * 0.1);
                
                if (noiseValue < -0.3) {
                    this.tiles[y][x] = this.tileTypes.WATER;
                } else if (noiseValue < -0.1) {
                    this.tiles[y][x] = this.tileTypes.DIRT;
                } else if (noiseValue > 0.3) {
                    this.tiles[y][x] = this.tileTypes.FOREST;
                } else {
                    this.tiles[y][x] = this.tileTypes.GRASS;
                }
            }
        }
    }

    generateResources() {
        // Размещаем месторождения золота
        const goldDeposits = 8;
        for (let i = 0; i < goldDeposits; i++) {
            const x = Math.floor(Math.random() * this.width);
            const y = Math.floor(Math.random() * this.height);
            
            // Создаем группу золотых тайлов
            this.placeTileCluster(x, y, this.tileTypes.GOLD, 2, 4);
        }
        
        // Размещаем каменные месторождения
        const stoneDeposits = 12;
        for (let i = 0; i < stoneDeposits; i++) {
            const x = Math.floor(Math.random() * this.width);
            const y = Math.floor(Math.random() * this.height);
            
            this.placeTileCluster(x, y, this.tileTypes.STONE, 1, 3);
        }
    }

    generateWater() {
        // Создаем реки
        const riverCount = 3;
        for (let i = 0; i < riverCount; i++) {
            this.generateRiver();
        }
    }

    generateRiver() {
        // Начинаем с случайной точки на краю карты
        let x, y, direction;
        
        if (Math.random() < 0.5) {
            // Горизонтальный край
            x = Math.random() < 0.5 ? 0 : this.width - 1;
            y = Math.floor(Math.random() * this.height);
            direction = x === 0 ? 1 : -1;
        } else {
            // Вертикальный край
            x = Math.floor(Math.random() * this.width);
            y = Math.random() < 0.5 ? 0 : this.height - 1;
            direction = y === 0 ? 1 : -1;
        }
        
        // Генерируем путь реки
        const riverLength = 20 + Math.floor(Math.random() * 20);
        for (let i = 0; i < riverLength; i++) {
            if (this.isValidTile(x, y)) {
                this.tiles[y][x] = this.tileTypes.WATER;
                
                // Иногда делаем реку шире
                if (Math.random() < 0.3) {
                    for (let dx = -1; dx <= 1; dx++) {
                        for (let dy = -1; dy <= 1; dy++) {
                            if (this.isValidTile(x + dx, y + dy)) {
                                this.tiles[y + dy][x + dx] = this.tileTypes.WATER;
                            }
                        }
                    }
                }
            }
            
            // Двигаемся в случайном направлении с тенденцией
            const moveX = Math.random() < 0.7 ? direction : (Math.random() < 0.5 ? -1 : 1);
            const moveY = Math.random() < 0.3 ? (Math.random() < 0.5 ? -1 : 1) : 0;
            
            x += moveX;
            y += moveY;
            
            // Проверяем границы
            if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
                break;
            }
        }
    }

    placeTileCluster(centerX, centerY, tileType, minRadius, maxRadius) {
        const radius = minRadius + Math.floor(Math.random() * (maxRadius - minRadius + 1));
        
        for (let y = centerY - radius; y <= centerY + radius; y++) {
            for (let x = centerX - radius; x <= centerX + radius; x++) {
                const distance = Math.hypot(x - centerX, y - centerY);
                if (distance <= radius && this.isValidTile(x, y) && Math.random() < 0.7) {
                    this.tiles[y][x] = tileType;
                }
            }
        }
    }

    isValidTile(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    getTile(x, y) {
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);
        
        if (this.isValidTile(tileX, tileY)) {
            return this.tiles[tileY][tileX];
        }
        
        return this.tileTypes.GRASS;
    }

    isPassable(x, y) {
        const tileType = this.getTile(x, y);
        return tileType !== this.tileTypes.WATER && tileType !== this.tileTypes.STONE;
    }

    isResource(x, y) {
        const tileType = this.getTile(x, y);
        return tileType === this.tileTypes.GOLD || tileType === this.tileTypes.FOREST;
    }

    getResourceType(x, y) {
        const tileType = this.getTile(x, y);
        if (tileType === this.tileTypes.GOLD) return 'gold';
        if (tileType === this.tileTypes.FOREST) return 'wood';
        return null;
    }

    harvestResource(x, y) {
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);
        
        if (!this.isValidTile(tileX, tileY)) return null;
        
        const tileType = this.tiles[tileY][tileX];
        let resourceType = null;
        let amount = 0;
        
        if (tileType === this.tileTypes.GOLD) {
            resourceType = 'gold';
            amount = 10 + Math.floor(Math.random() * 10);
        } else if (tileType === this.tileTypes.FOREST) {
            resourceType = 'wood';
            amount = 5 + Math.floor(Math.random() * 5);
            // Дерево исчезает после рубки
            this.tiles[tileY][tileX] = this.tileTypes.GRASS;
        }
        
        return resourceType ? { type: resourceType, amount } : null;
    }

    render(ctx, camera) {
        // Определяем видимую область
        const startX = Math.max(0, Math.floor(-camera.x / this.tileSize));
        const startY = Math.max(0, Math.floor(-camera.y / this.tileSize));
        const endX = Math.min(this.width, startX + Math.ceil(camera.viewport.width / camera.zoom / this.tileSize) + 2);
        const endY = Math.min(this.height, startY + Math.ceil(camera.viewport.height / camera.zoom / this.tileSize) + 2);
        
        // Рендерим только видимые тайлы
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const tileType = this.tiles[y][x];
                const worldX = x * this.tileSize;
                const worldY = y * this.tileSize;
                
                // Основной цвет тайла
                ctx.fillStyle = this.tileColors[tileType];
                ctx.fillRect(worldX, worldY, this.tileSize, this.tileSize);
                
                // Добавляем детали для некоторых типов тайлов
                this.renderTileDetails(ctx, worldX, worldY, tileType);
                
                // Рендерим границы тайлов (опционально, для отладки)
                if (camera.zoom > 1) {
                    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(worldX, worldY, this.tileSize, this.tileSize);
                }
            }
        }
    }

    renderTileDetails(ctx, x, y, tileType) {
        ctx.save();
        
        switch (tileType) {
            case this.tileTypes.FOREST:
                // Рисуем простое дерево
                ctx.fillStyle = '#8b4513';
                ctx.fillRect(x + 14, y + 20, 4, 8);
                ctx.fillStyle = '#228b22';
                ctx.beginPath();
                ctx.arc(x + 16, y + 16, 8, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case this.tileTypes.GOLD:
                // Рисуем золотые крапинки
                ctx.fillStyle = '#ffff00';
                for (let i = 0; i < 3; i++) {
                    const px = x + 8 + Math.random() * 16;
                    const py = y + 8 + Math.random() * 16;
                    ctx.fillRect(px, py, 2, 2);
                }
                break;
                
            case this.tileTypes.STONE:
                // Рисуем камни
                ctx.fillStyle = '#a9a9a9';
                ctx.beginPath();
                ctx.arc(x + 12, y + 12, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x + 20, y + 20, 3, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case this.tileTypes.WATER:
                // Рисуем волны
                ctx.strokeStyle = '#87ceeb';
                ctx.lineWidth = 1;
                ctx.beginPath();
                for (let i = 0; i < 3; i++) {
                    const waveY = y + 8 + i * 8;
                    ctx.moveTo(x, waveY);
                    ctx.quadraticCurveTo(x + 8, waveY - 2, x + 16, waveY);
                    ctx.quadraticCurveTo(x + 24, waveY + 2, x + 32, waveY);
                }
                ctx.stroke();
                break;
        }
        
        ctx.restore();
    }

    // Простая реализация шума для генерации ландшафта
    noise(x, y) {
        // Используем простую хеш-функцию для генерации псевдослучайных значений
        const hash = (x, y) => {
            let h = (x * 374761393) + (y * 668265263);
            h = (h ^ (h >> 13)) * 1274126177;
            return (h ^ (h >> 16)) / 2147483648.0;
        };
        
        // Интерполяция между соседними точками
        const intX = Math.floor(x);
        const intY = Math.floor(y);
        const fracX = x - intX;
        const fracY = y - intY;
        
        const a = hash(intX, intY);
        const b = hash(intX + 1, intY);
        const c = hash(intX, intY + 1);
        const d = hash(intX + 1, intY + 1);
        
        const i1 = this.interpolate(a, b, fracX);
        const i2 = this.interpolate(c, d, fracX);
        
        return this.interpolate(i1, i2, fracY);
    }

    interpolate(a, b, t) {
        return a * (1 - t) + b * t;
    }
}