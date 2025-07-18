// Менеджер игровых сущностей
export class EntityManager {
    constructor() {
        this.entities = [];
        this.nextId = 1;
        this.spatialGrid = new Map();
        this.gridSize = 64;
    }

    addEntity(entity) {
        entity.id = this.nextId++;
        this.entities.push(entity);
        this.updateSpatialGrid(entity);
        return entity;
    }

    removeEntity(entity) {
        const index = this.entities.indexOf(entity);
        if (index !== -1) {
            this.entities.splice(index, 1);
            this.removeFromSpatialGrid(entity);
        }
    }

    getEntityById(id) {
        return this.entities.find(entity => entity.id === id);
    }

    getEntitiesOfType(type) {
        return this.entities.filter(entity => entity.type === type);
    }

    getEntitiesOfPlayer(player) {
        return this.entities.filter(entity => entity.player === player);
    }

    getEntityAt(x, y) {
        // Сначала проверяем в пространственной сетке
        const gridKey = this.getGridKey(x, y);
        const nearbyEntities = this.spatialGrid.get(gridKey) || [];
        
        for (const entity of nearbyEntities) {
            if (this.isPointInEntity(x, y, entity)) {
                return entity;
            }
        }
        
        // Если ничего не найдено в сетке, проверяем все сущности
        for (const entity of this.entities) {
            if (this.isPointInEntity(x, y, entity)) {
                return entity;
            }
        }
        
        return null;
    }

    getUnitsInArea(minX, minY, maxX, maxY) {
        const unitsInArea = [];
        
        for (const entity of this.entities) {
            if (entity.type && this.isEntityInArea(entity, minX, minY, maxX, maxY)) {
                unitsInArea.push(entity);
            }
        }
        
        return unitsInArea;
    }

    getEntitiesInRadius(x, y, radius) {
        const entitiesInRadius = [];
        
        for (const entity of this.entities) {
            const distance = Math.hypot(
                entity.x + entity.width / 2 - x,
                entity.y + entity.height / 2 - y
            );
            
            if (distance <= radius) {
                entitiesInRadius.push(entity);
            }
        }
        
        return entitiesInRadius;
    }

    findNearestEntity(x, y, filter = null) {
        let nearest = null;
        let minDistance = Infinity;
        
        for (const entity of this.entities) {
            if (filter && !filter(entity)) continue;
            
            const distance = Math.hypot(
                entity.x + entity.width / 2 - x,
                entity.y + entity.height / 2 - y
            );
            
            if (distance < minDistance) {
                minDistance = distance;
                nearest = entity;
            }
        }
        
        return nearest;
    }

    findPath(startX, startY, endX, endY, entitySize = 24) {
        // Простая A* реализация для поиска пути
        const gridSize = 32;
        const startGridX = Math.floor(startX / gridSize);
        const startGridY = Math.floor(startY / gridSize);
        const endGridX = Math.floor(endX / gridSize);
        const endGridY = Math.floor(endY / gridSize);
        
        if (startGridX === endGridX && startGridY === endGridY) {
            return [{ x: endX, y: endY }];
        }
        
        const openSet = [{ x: startGridX, y: startGridY, f: 0, g: 0, h: 0, parent: null }];
        const closedSet = new Set();
        
        while (openSet.length > 0) {
            // Находим узел с наименьшим f
            let current = openSet[0];
            let currentIndex = 0;
            
            for (let i = 1; i < openSet.length; i++) {
                if (openSet[i].f < current.f) {
                    current = openSet[i];
                    currentIndex = i;
                }
            }
            
            openSet.splice(currentIndex, 1);
            closedSet.add(`${current.x},${current.y}`);
            
            // Проверяем, достигли ли цели
            if (current.x === endGridX && current.y === endGridY) {
                const path = [];
                let node = current;
                while (node) {
                    path.unshift({ x: node.x * gridSize + gridSize / 2, y: node.y * gridSize + gridSize / 2 });
                    node = node.parent;
                }
                return path.slice(1); // Убираем стартовую точку
            }
            
            // Проверяем соседей
            const neighbors = [
                { x: current.x - 1, y: current.y },
                { x: current.x + 1, y: current.y },
                { x: current.x, y: current.y - 1 },
                { x: current.x, y: current.y + 1 },
                { x: current.x - 1, y: current.y - 1 },
                { x: current.x + 1, y: current.y - 1 },
                { x: current.x - 1, y: current.y + 1 },
                { x: current.x + 1, y: current.y + 1 }
            ];
            
            for (const neighbor of neighbors) {
                const key = `${neighbor.x},${neighbor.y}`;
                
                if (closedSet.has(key)) continue;
                if (!this.isPassable(neighbor.x * gridSize, neighbor.y * gridSize, entitySize)) continue;
                
                const g = current.g + (neighbor.x !== current.x && neighbor.y !== current.y ? 1.414 : 1);
                const h = Math.abs(neighbor.x - endGridX) + Math.abs(neighbor.y - endGridY);
                const f = g + h;
                
                const existingNode = openSet.find(node => node.x === neighbor.x && node.y === neighbor.y);
                
                if (!existingNode) {
                    openSet.push({
                        x: neighbor.x,
                        y: neighbor.y,
                        f, g, h,
                        parent: current
                    });
                } else if (g < existingNode.g) {
                    existingNode.g = g;
                    existingNode.f = g + existingNode.h;
                    existingNode.parent = current;
                }
            }
        }
        
        // Путь не найден, возвращаем прямую линию
        return [{ x: endX, y: endY }];
    }

    isPassable(x, y, entitySize) {
        // Проверяем проходимость для сущности размером entitySize
        const halfSize = entitySize / 2;
        const corners = [
            { x: x - halfSize, y: y - halfSize },
            { x: x + halfSize, y: y - halfSize },
            { x: x - halfSize, y: y + halfSize },
            { x: x + halfSize, y: y + halfSize }
        ];
        
        // Проверяем границы карты
        const mapBounds = { minX: 0, minY: 0, maxX: 2048, maxY: 2048 };
        for (const corner of corners) {
            if (corner.x < mapBounds.minX || corner.x > mapBounds.maxX ||
                corner.y < mapBounds.minY || corner.y > mapBounds.maxY) {
                return false;
            }
        }
        
        for (const corner of corners) {
            // Проверяем коллизии с другими сущностями
            for (const entity of this.entities) {
                if (entity.isBuilding && this.isPointInEntity(corner.x, corner.y, entity)) {
                    return false;
                }
            }
        }
        
        return true;
    }

    checkCollisions(entity) {
        const collisions = [];
        
        for (const other of this.entities) {
            if (other === entity) continue;
            
            if (this.entitiesCollide(entity, other)) {
                collisions.push(other);
            }
        }
        
        return collisions;
    }

    entitiesCollide(entity1, entity2) {
        return entity1.x < entity2.x + entity2.width &&
               entity1.x + entity1.width > entity2.x &&
               entity1.y < entity2.y + entity2.height &&
               entity1.y + entity1.height > entity2.y;
    }

    isPointInEntity(x, y, entity) {
        return x >= entity.x &&
               x <= entity.x + entity.width &&
               y >= entity.y &&
               y <= entity.y + entity.height;
    }

    isEntityInArea(entity, minX, minY, maxX, maxY) {
        return entity.x + entity.width >= minX &&
               entity.x <= maxX &&
               entity.y + entity.height >= minY &&
               entity.y <= maxY;
    }

    updateSpatialGrid(entity) {
        this.removeFromSpatialGrid(entity);
        
        const minGridX = Math.floor(entity.x / this.gridSize);
        const maxGridX = Math.floor((entity.x + entity.width) / this.gridSize);
        const minGridY = Math.floor(entity.y / this.gridSize);
        const maxGridY = Math.floor((entity.y + entity.height) / this.gridSize);
        
        entity.gridCells = [];
        
        for (let gridY = minGridY; gridY <= maxGridY; gridY++) {
            for (let gridX = minGridX; gridX <= maxGridX; gridX++) {
                const key = `${gridX},${gridY}`;
                
                if (!this.spatialGrid.has(key)) {
                    this.spatialGrid.set(key, []);
                }
                
                this.spatialGrid.get(key).push(entity);
                entity.gridCells.push(key);
            }
        }
    }

    removeFromSpatialGrid(entity) {
        if (entity.gridCells) {
            for (const key of entity.gridCells) {
                const cell = this.spatialGrid.get(key);
                if (cell) {
                    const index = cell.indexOf(entity);
                    if (index !== -1) {
                        cell.splice(index, 1);
                    }
                    
                    if (cell.length === 0) {
                        this.spatialGrid.delete(key);
                    }
                }
            }
            entity.gridCells = [];
        }
    }

    getGridKey(x, y) {
        const gridX = Math.floor(x / this.gridSize);
        const gridY = Math.floor(y / this.gridSize);
        return `${gridX},${gridY}`;
    }

    update(deltaTime) {
        // Обновляем все сущности
        for (let i = this.entities.length - 1; i >= 0; i--) {
            const entity = this.entities[i];
            
            if (entity.update) {
                entity.update(deltaTime, this);
            }
            
            // Обновляем пространственную сетку если сущность двигалась
            if (entity.hasMoved) {
                this.updateSpatialGrid(entity);
                entity.hasMoved = false;
            }
            
            // Удаляем мертвые сущности
            if (entity.hp <= 0 && entity.canDie !== false) {
                this.removeEntity(entity);
            }
        }
    }

    render(ctx, camera) {
        // Определяем видимую область
        const viewLeft = -camera.x;
        const viewTop = -camera.y;
        const viewRight = viewLeft + camera.viewport.width / camera.zoom;
        const viewBottom = viewTop + camera.viewport.height / camera.zoom;
        
        // Рендерим только видимые сущности
        const visibleEntities = this.entities.filter(entity => {
            return entity.x + entity.width >= viewLeft &&
                   entity.x <= viewRight &&
                   entity.y + entity.height >= viewTop &&
                   entity.y <= viewBottom;
        });
        
        // Сортируем по Y координате для правильного z-order
        visibleEntities.sort((a, b) => (a.y + a.height) - (b.y + b.height));
        
        // Рендерим сущности
        for (const entity of visibleEntities) {
            if (entity.render) {
                entity.render(ctx, camera);
            } else {
                this.renderDefaultEntity(ctx, entity);
            }
        }
    }

    renderDefaultEntity(ctx, entity) {
        ctx.save();
        
        // Основная форма
        if (entity.isBuilding) {
            ctx.fillStyle = entity.player === 1 ? '#654321' : '#8b0000';
        } else {
            ctx.fillStyle = entity.player === 1 ? '#0066cc' : '#cc0000';
        }
        
        ctx.fillRect(entity.x, entity.y, entity.width, entity.height);
        
        // Полоса здоровья
        if (entity.hp < entity.maxHp) {
            const healthBarWidth = entity.width;
            const healthBarHeight = 4;
            const healthBarY = entity.y - 8;
            
            // Фон полосы здоровья
            ctx.fillStyle = '#333333';
            ctx.fillRect(entity.x, healthBarY, healthBarWidth, healthBarHeight);
            
            // Заполнение полосы здоровья
            const healthPercent = entity.hp / entity.maxHp;
            ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
            ctx.fillRect(entity.x, healthBarY, healthBarWidth * healthPercent, healthBarHeight);
        }
        
        // Индикатор выделения
        if (entity.selected) {
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.strokeRect(entity.x - 2, entity.y - 2, entity.width + 4, entity.height + 4);
        }
        
        ctx.restore();
    }

    clear() {
        this.entities = [];
        this.spatialGrid.clear();
        this.nextId = 1;
    }

    getStatistics() {
        const stats = {
            totalEntities: this.entities.length,
            units: 0,
            buildings: 0,
            players: {}
        };
        
        for (const entity of this.entities) {
            if (entity.isBuilding) {
                stats.buildings++;
            } else {
                stats.units++;
            }
            
            if (!stats.players[entity.player]) {
                stats.players[entity.player] = { units: 0, buildings: 0 };
            }
            
            if (entity.isBuilding) {
                stats.players[entity.player].buildings++;
            } else {
                stats.players[entity.player].units++;
            }
        }
        
        return stats;
    }
}