// Генератор простых спрайтов для игры
export class SpriteGenerator {
    constructor() {
        this.sprites = new Map();
    }

    // Создает простой спрайт юнита
    createUnitSprite(type, width = 32, height = 32) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Настройки для разных типов юнитов
        const unitConfig = {
            peasant: { color: '#8B4513', symbol: '👨‍🌾' },
            footman: { color: '#4682B4', symbol: '⚔️' },
            archer: { color: '#228B22', symbol: '🏹' },
            knight: { color: '#FFD700', symbol: '🐎' }
        };

        const config = unitConfig[type] || { color: '#808080', symbol: '?' };

        // Рисуем тело юнита
        ctx.fillStyle = config.color;
        ctx.fillRect(2, 2, width - 4, height - 4);
        
        // Рисуем границы
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(2, 2, width - 4, height - 4);

        // Добавляем символ или простой рисунок
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `${Math.floor(width / 2)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (config.symbol.length === 1) {
            ctx.fillText(config.symbol, width / 2, height / 2);
        } else {
            // Для эмодзи используем простую графику
            switch (type) {
                case 'peasant':
                    this.drawPeasant(ctx, width, height);
                    break;
                case 'footman':
                    this.drawFootman(ctx, width, height);
                    break;
                case 'archer':
                    this.drawArcher(ctx, width, height);
                    break;
                case 'knight':
                    this.drawKnight(ctx, width, height);
                    break;
            }
        }

        return canvas;
    }

    // Создает спрайт здания
    createBuildingSprite(type, width = 64, height = 64) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        const buildingConfig = {
            townhall: { color: '#8B4513', roofColor: '#CD853F' },
            barracks: { color: '#696969', roofColor: '#A9A9A9' },
            farm: { color: '#DEB887', roofColor: '#F4A460' },
            lumber: { color: '#654321', roofColor: '#8B4513' }
        };

        const config = buildingConfig[type] || { color: '#808080', roofColor: '#A0A0A0' };

        // Рисуем основание здания
        ctx.fillStyle = config.color;
        ctx.fillRect(4, height / 3, width - 8, (height * 2) / 3 - 4);

        // Рисуем крышу
        ctx.fillStyle = config.roofColor;
        ctx.beginPath();
        ctx.moveTo(width / 2, 4);
        ctx.lineTo(width - 4, height / 3);
        ctx.lineTo(4, height / 3);
        ctx.closePath();
        ctx.fill();

        // Границы
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(4, height / 3, width - 8, (height * 2) / 3 - 4);
        
        // Крыша
        ctx.beginPath();
        ctx.moveTo(width / 2, 4);
        ctx.lineTo(width - 4, height / 3);
        ctx.lineTo(4, height / 3);
        ctx.closePath();
        ctx.stroke();

        // Добавляем детали в зависимости от типа
        this.addBuildingDetails(ctx, type, width, height);

        return canvas;
    }

    // Создает спрайт тайла местности
    createTerrainSprite(type, size = 32) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        const terrainConfig = {
            grass: '#228B22',
            dirt: '#8B4513',
            water: '#4682B4',
            mountain: '#696969',
            forest: '#006400'
        };

        const color = terrainConfig[type] || '#228B22';
        
        // Базовый цвет
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, size, size);

        // Добавляем текстуру
        this.addTerrainTexture(ctx, type, size);

        return canvas;
    }

    drawPeasant(ctx, width, height) {
        // Голова
        ctx.fillStyle = '#FFDBAC';
        ctx.fillRect(width / 2 - 4, 6, 8, 8);
        
        // Тело
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(width / 2 - 6, 14, 12, 10);
        
        // Инструмент
        ctx.fillStyle = '#654321';
        ctx.fillRect(width / 2 + 8, 10, 4, 12);
    }

    drawFootman(ctx, width, height) {
        // Шлем
        ctx.fillStyle = '#C0C0C0';
        ctx.fillRect(width / 2 - 5, 4, 10, 8);
        
        // Тело (доспехи)
        ctx.fillStyle = '#4682B4';
        ctx.fillRect(width / 2 - 6, 12, 12, 12);
        
        // Щит
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(width / 2 - 10, 14, 4, 8);
        
        // Меч
        ctx.fillStyle = '#C0C0C0';
        ctx.fillRect(width / 2 + 8, 8, 2, 12);
    }

    drawArcher(ctx, width, height) {
        // Капюшон
        ctx.fillStyle = '#228B22';
        ctx.fillRect(width / 2 - 5, 4, 10, 8);
        
        // Тело
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(width / 2 - 5, 12, 10, 10);
        
        // Лук
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(width / 2 + 8, height / 2, 6, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawKnight(ctx, width, height) {
        // Плюмаж на шлеме
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(width / 2 - 2, 2, 4, 6);
        
        // Шлем
        ctx.fillStyle = '#C0C0C0';
        ctx.fillRect(width / 2 - 6, 6, 12, 8);
        
        // Доспехи
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(width / 2 - 7, 14, 14, 12);
        
        // Меч
        ctx.fillStyle = '#C0C0C0';
        ctx.fillRect(width / 2 + 10, 4, 3, 16);
    }

    addBuildingDetails(ctx, type, width, height) {
        switch (type) {
            case 'townhall':
                // Флаг
                ctx.fillStyle = '#FF0000';
                ctx.fillRect(width / 2 - 1, 4, 2, height / 3 - 4);
                ctx.fillRect(width / 2 + 1, 8, 8, 6);
                break;
                
            case 'barracks':
                // Окна
                ctx.fillStyle = '#FFFF00';
                ctx.fillRect(width / 4, height / 2, 6, 6);
                ctx.fillRect(3 * width / 4 - 6, height / 2, 6, 6);
                break;
                
            case 'farm':
                // Поле
                ctx.fillStyle = '#90EE90';
                ctx.fillRect(6, height - 12, width - 12, 8);
                break;
                
            case 'lumber':
                // Бревна
                ctx.fillStyle = '#8B4513';
                for (let i = 0; i < 3; i++) {
                    ctx.fillRect(8 + i * 4, height - 16 + i * 2, width - 16, 3);
                }
                break;
        }
    }

    addTerrainTexture(ctx, type, size) {
        ctx.globalAlpha = 0.3;
        
        switch (type) {
            case 'grass':
                // Травинки
                ctx.strokeStyle = '#006400';
                ctx.lineWidth = 1;
                for (let i = 0; i < 10; i++) {
                    const x = Math.random() * size;
                    const y = Math.random() * size;
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x, y - 3);
                    ctx.stroke();
                }
                break;
                
            case 'dirt':
                // Камешки
                ctx.fillStyle = '#654321';
                for (let i = 0; i < 8; i++) {
                    const x = Math.random() * size;
                    const y = Math.random() * size;
                    ctx.fillRect(x, y, 2, 2);
                }
                break;
                
            case 'water':
                // Волны
                ctx.strokeStyle = '#87CEEB';
                ctx.lineWidth = 1;
                for (let y = 0; y < size; y += 8) {
                    ctx.beginPath();
                    ctx.moveTo(0, y);
                    for (let x = 0; x < size; x += 4) {
                        ctx.lineTo(x, y + Math.sin(x / 4) * 2);
                    }
                    ctx.stroke();
                }
                break;
                
            case 'forest':
                // Деревья (упрощенные)
                ctx.fillStyle = '#8B4513';
                for (let i = 0; i < 4; i++) {
                    const x = (i % 2) * size / 2 + size / 4;
                    const y = Math.floor(i / 2) * size / 2 + size / 4;
                    ctx.fillRect(x - 1, y, 2, 6);
                    ctx.fillStyle = '#006400';
                    ctx.fillRect(x - 3, y - 3, 6, 6);
                    ctx.fillStyle = '#8B4513';
                }
                break;
        }
        
        ctx.globalAlpha = 1.0;
    }

    // Получить спрайт (создать если не существует)
    getSprite(category, type, width, height) {
        const key = `${category}_${type}_${width}_${height}`;
        
        if (!this.sprites.has(key)) {
            let sprite;
            switch (category) {
                case 'unit':
                    sprite = this.createUnitSprite(type, width, height);
                    break;
                case 'building':
                    sprite = this.createBuildingSprite(type, width, height);
                    break;
                case 'terrain':
                    sprite = this.createTerrainSprite(type, width);
                    break;
                default:
                    return null;
            }
            this.sprites.set(key, sprite);
        }
        
        return this.sprites.get(key);
    }

    // Создать набор спрайтов для игры
    generateGameSprites() {
        const sprites = {};
        
        // Юниты
        sprites.units = {};
        ['peasant', 'footman', 'archer', 'knight'].forEach(type => {
            sprites.units[type] = this.getSprite('unit', type, 32, 32);
        });
        
        // Здания
        sprites.buildings = {};
        ['townhall', 'barracks', 'farm', 'lumber'].forEach(type => {
            sprites.buildings[type] = this.getSprite('building', type, 64, 64);
        });
        
        // Местность
        sprites.terrain = {};
        ['grass', 'dirt', 'water', 'mountain', 'forest'].forEach(type => {
            sprites.terrain[type] = this.getSprite('terrain', type, 32, 32);
        });
        
        return sprites;
    }
}