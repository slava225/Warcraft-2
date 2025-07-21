// Основной игровой класс
import { WorldMap } from './world-map.js';
import { EntityManager } from './entity-manager.js';
import { ResourceManager } from './resource-manager.js';
import { Camera } from './camera.js';
import { InputManager } from './input-manager.js';
import { UI } from './ui.js';
import { AudioManager } from './audio-manager.js';
import { Unit } from './entities/unit.js';
import { Building } from './entities/building.js';
import { GameImprovements } from './game-improvements.js';

export class Game {
    constructor(config) {
        this.canvas = config.canvas;
        this.ctx = config.ctx;
        this.width = config.width;
        this.height = config.height;
        this.isMobile = config.isMobile;
        this.assetLoader = config.assetLoader;
        
        // Игровое состояние
        this.isPaused = false;
        this.gameSpeed = 1.0;
        this.lastTimestamp = 0;
        this.deltaTime = 0;
        
        // Игровые системы
        this.worldMap = new WorldMap(64, 64); // 64x64 тайлов
        this.entityManager = new EntityManager();
        this.entityManager.game = this; // Добавляем ссылку на игру
        this.resourceManager = new ResourceManager();
        this.camera = new Camera(this.width, this.height);
        this.inputManager = new InputManager(this.canvas, this.isMobile);
        this.ui = new UI(this);
        this.audioManager = new AudioManager();
        
        // Игровые объекты
        this.selectedUnits = new Set();
        this.selectedBuilding = null;
        this.buildMode = null;
        this.buildingGhost = null;
        
        // Инициализация
        this.init();
        
        // Добавляем улучшения
        this.improvements = new GameImprovements(this);
    }

    init() {
        // Генерируем карту
        this.worldMap.generate();
        
        // Создаем начальные ресурсы
        this.resourceManager.setResource('gold', 1000);
        this.resourceManager.setResource('wood', 500);
        this.resourceManager.setResource('food', 10);
        this.resourceManager.setResource('maxFood', 50);
        
        // Создаем стартовые юниты и здания
        this.createStartingUnits();
        
        // Настраиваем обработчики ввода
        this.setupInputHandlers();
        
        console.log('Игра инициализирована');
    }

    createStartingUnits() {
        // Главная база
        const townhall = new Building({
            type: 'townhall',
            x: 500,
            y: 400,
            width: 96,
            height: 96,
            hp: 1200,
            maxHp: 1200,
            player: 1
        });
        this.entityManager.addEntity(townhall);
        
        // Стартовые крестьяне
        for (let i = 0; i < 5; i++) {
            const peasant = new Unit({
                type: 'peasant',
                x: 450 + (i * 30),
                y: 350,
                width: 24,
                height: 24,
                hp: 30,
                maxHp: 30,
                speed: 60,
                player: 1
            });
            this.entityManager.addEntity(peasant);
        }
        
        // Казарма
        const barracks = new Building({
            type: 'barracks',
            x: 600,
            y: 300,
            width: 64,
            height: 64,
            hp: 800,
            maxHp: 800,
            player: 1
        });
        this.entityManager.addEntity(barracks);
    }

    setupInputHandlers() {
        // Обработка выделения
        this.inputManager.on('click', (event) => {
            this.handleClick(event.x, event.y, event.ctrlKey);
        });
        
        // Обработка правого клика (команды)
        this.inputManager.on('rightclick', (event) => {
            this.handleRightClick(event.x, event.y);
        });
        
        // Обработка перетаскивания для выделения
        this.inputManager.on('dragstart', (event) => {
            this.startSelection(event.x, event.y);
        });
        
        this.inputManager.on('drag', (event) => {
            this.updateSelection(event.x, event.y);
        });
        
        this.inputManager.on('dragend', (event) => {
            this.endSelection(event.x, event.y);
        });
        
        // Обработка камеры
        this.inputManager.on('pan', (event) => {
            this.camera.move(-event.deltaX, -event.deltaY);
        });
        
        this.inputManager.on('zoom', (event) => {
            this.camera.zoom(event.delta);
        });
    }

    handleClick(screenX, screenY, ctrlKey) {
        const worldPos = this.camera.screenToWorld(screenX, screenY);
        const entity = this.entityManager.getEntityAt(worldPos.x, worldPos.y);
        
        if (this.buildMode) {
            // Размещение здания
            this.placeBuildingAt(worldPos.x, worldPos.y);
            return;
        }
        
        if (!ctrlKey) {
            this.clearSelection();
        }
        
        if (entity) {
            if (entity instanceof Unit && entity.player === 1) {
                this.selectUnit(entity);
            } else if (entity instanceof Building && entity.player === 1) {
                this.selectBuilding(entity);
            }
        }
        
        this.ui.updateSelection();
    }

    handleRightClick(screenX, screenY) {
        if (this.selectedUnits.size === 0) return;
        
        const worldPos = this.camera.screenToWorld(screenX, screenY);
        const targetEntity = this.entityManager.getEntityAt(worldPos.x, worldPos.y);
        
        for (const unit of this.selectedUnits) {
            if (targetEntity && targetEntity.player !== 1) {
                // Атака
                unit.attack(targetEntity);
            } else {
                // Движение
                unit.moveTo(worldPos.x, worldPos.y);
            }
        }
    }

    startSelection(x, y) {
        this.selectionStart = this.camera.screenToWorld(x, y);
        this.selectionEnd = { ...this.selectionStart };
        this.isSelecting = true;
    }

    updateSelection(x, y) {
        if (!this.isSelecting) return;
        this.selectionEnd = this.camera.screenToWorld(x, y);
    }

    endSelection(x, y) {
        if (!this.isSelecting) return;
        
        this.selectionEnd = this.camera.screenToWorld(x, y);
        
        const minX = Math.min(this.selectionStart.x, this.selectionEnd.x);
        const maxX = Math.max(this.selectionStart.x, this.selectionEnd.x);
        const minY = Math.min(this.selectionStart.y, this.selectionEnd.y);
        const maxY = Math.max(this.selectionStart.y, this.selectionEnd.y);
        
        // Выделяем юниты в прямоугольнике
        if (Math.abs(maxX - minX) > 10 && Math.abs(maxY - minY) > 10) {
            this.clearSelection();
            
            const units = this.entityManager.getUnitsInArea(minX, minY, maxX, maxY);
            for (const unit of units) {
                if (unit.player === 1) {
                    this.selectUnit(unit);
                }
            }
        }
        
        this.isSelecting = false;
        this.ui.updateSelection();
    }

    selectUnit(unit) {
        this.selectedUnits.add(unit);
        unit.selected = true;
        this.selectedBuilding = null;
    }

    selectBuilding(building) {
        this.clearSelection();
        this.selectedBuilding = building;
        building.selected = true;
    }

    clearSelection() {
        for (const unit of this.selectedUnits) {
            unit.selected = false;
        }
        this.selectedUnits.clear();
        
        if (this.selectedBuilding) {
            this.selectedBuilding.selected = false;
            this.selectedBuilding = null;
        }
    }

    enterBuildMode(buildingType) {
        this.buildMode = buildingType;
        this.buildingGhost = this.createBuildingGhost(buildingType);
        this.canvas.style.cursor = 'crosshair';
    }

    exitBuildMode() {
        this.buildMode = null;
        this.buildingGhost = null;
        this.canvas.style.cursor = 'default';
    }

    createBuildingGhost(type) {
        const buildingData = {
            townhall: { width: 96, height: 96, cost: { gold: 1200, wood: 800 } },
            barracks: { width: 64, height: 64, cost: { gold: 700, wood: 450 } },
            farm: { width: 48, height: 48, cost: { gold: 500, wood: 250 } },
            lumber: { width: 64, height: 64, cost: { gold: 600, wood: 450 } }
        };
        
        return {
            type,
            ...buildingData[type],
            x: 0,
            y: 0,
            canPlace: false
        };
    }

    placeBuildingAt(x, y) {
        if (!this.buildingGhost || !this.buildingGhost.canPlace) return;
        
        const cost = this.buildingGhost.cost;
        if (!this.resourceManager.canAfford(cost)) {
            this.ui.showMessage('Недостаточно ресурсов');
            return;
        }
        
        // Тратим ресурсы
        for (const [resource, amount] of Object.entries(cost)) {
            this.resourceManager.spendResource(resource, amount);
        }
        
        // Создаем здание
        const building = new Building({
            type: this.buildingGhost.type,
            x: x - this.buildingGhost.width / 2,
            y: y - this.buildingGhost.height / 2,
            width: this.buildingGhost.width,
            height: this.buildingGhost.height,
            hp: 1,
            maxHp: 800,
            player: 1,
            isConstructing: true
        });
        
        this.entityManager.addEntity(building);
        this.exitBuildMode();
        
        // Отправляем ближайшего крестьянина строить
        const nearestPeasant = this.findNearestPeasant(x, y);
        if (nearestPeasant) {
            nearestPeasant.buildBuilding(building);
        }
    }

    findNearestPeasant(x, y) {
        let nearest = null;
        let minDistance = Infinity;
        
        for (const entity of this.entityManager.entities) {
            if (entity instanceof Unit && entity.type === 'peasant' && entity.player === 1) {
                const distance = Math.hypot(entity.x - x, entity.y - y);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearest = entity;
                }
            }
        }
        
        return nearest;
    }

    createUnit(type, building) {
        const unitData = {
            peasant: { cost: { gold: 75, food: 1 }, hp: 30, speed: 60 },
            footman: { cost: { gold: 60, food: 1 }, hp: 60, speed: 50 },
            archer: { cost: { gold: 150, wood: 50, food: 1 }, hp: 40, speed: 55 },
            knight: { cost: { gold: 800, food: 4 }, hp: 180, speed: 75 }
        };
        
        const data = unitData[type];
        if (!data) return;
        
        if (!this.resourceManager.canAfford(data.cost)) {
            this.ui.showMessage('Недостаточно ресурсов');
            return;
        }
        
        // Тратим ресурсы
        for (const [resource, amount] of Object.entries(data.cost)) {
            this.resourceManager.spendResource(resource, amount);
        }
        
        // Создаем юнита рядом со зданием
        const spawnX = building.x + building.width + 10;
        const spawnY = building.y + building.height / 2;
        
        const unit = new Unit({
            type,
            x: spawnX,
            y: spawnY,
            width: 24,
            height: 24,
            hp: data.hp,
            maxHp: data.hp,
            speed: data.speed,
            player: 1
        });
        
        this.entityManager.addEntity(unit);
    }

    update(timestamp) {
        if (this.isPaused) return;
        
        this.deltaTime = (timestamp - this.lastTimestamp) / 1000 * this.gameSpeed;
        this.lastTimestamp = timestamp;
        
        // Обновляем игровые системы
        this.inputManager.update();
        this.entityManager.update(this.deltaTime);
        this.camera.fullUpdate(this.deltaTime);
        this.ui.update(this.deltaTime);
        
        // Обновляем улучшения
        if (this.improvements) {
            this.improvements.update(this.deltaTime);
        }
        
        // Обновляем призрак здания
        if (this.buildingGhost) {
            const mousePos = this.inputManager.getMousePosition();
            if (mousePos) {
                const worldPos = this.camera.screenToWorld(mousePos.x, mousePos.y);
                this.buildingGhost.x = worldPos.x - this.buildingGhost.width / 2;
                this.buildingGhost.y = worldPos.y - this.buildingGhost.height / 2;
                this.buildingGhost.canPlace = this.canPlaceBuildingAt(this.buildingGhost.x, this.buildingGhost.y);
            }
        }
    }

    canPlaceBuildingAt(x, y) {
        if (!this.buildingGhost) return false;
        
        const { width, height } = this.buildingGhost;
        
        // Проверяем коллизии с другими зданиями
        for (const entity of this.entityManager.entities) {
            if (entity instanceof Building) {
                if (x < entity.x + entity.width &&
                    x + width > entity.x &&
                    y < entity.y + entity.height &&
                    y + height > entity.y) {
                    return false;
                }
            }
        }
        
        // Проверяем границы карты
        if (x < 0 || y < 0 || x + width > this.worldMap.width * 32 || y + height > this.worldMap.height * 32) {
            return false;
        }
        
        return true;
    }

    render(ctx) {
        // Очищаем канвас
        ctx.clearRect(0, 0, this.width, this.height);
        
        // Применяем трансформацию камеры
        ctx.save();
        this.camera.apply(ctx);
        
        // Рендерим карту
        this.worldMap.render(ctx, this.camera);
        
        // Рендерим сущности
        this.entityManager.render(ctx, this.camera);
        
        // Рендерим призрак здания
        if (this.buildingGhost) {
            this.renderBuildingGhost(ctx);
        }
        
        // Рендерим выделение
        this.renderSelection(ctx);
        
        // Рендерим улучшения
        if (this.improvements) {
            this.improvements.render(ctx);
        }
        
        ctx.restore();
        
        // Рендерим UI
        this.ui.render(ctx);
    }

    renderBuildingGhost(ctx) {
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = this.buildingGhost.canPlace ? '#00ff00' : '#ff0000';
        ctx.fillRect(
            this.buildingGhost.x,
            this.buildingGhost.y,
            this.buildingGhost.width,
            this.buildingGhost.height
        );
        ctx.restore();
    }

    renderSelection(ctx) {
        // Рендерим выделенные юниты
        for (const unit of this.selectedUnits) {
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.strokeRect(unit.x - 2, unit.y - 2, unit.width + 4, unit.height + 4);
        }
        
        // Рендерим выделенное здание
        if (this.selectedBuilding) {
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.strokeRect(
                this.selectedBuilding.x - 2,
                this.selectedBuilding.y - 2,
                this.selectedBuilding.width + 4,
                this.selectedBuilding.height + 4
            );
        }
        
        // Рендерим рамку выделения
        if (this.isSelecting && this.selectionStart && this.selectionEnd) {
            const minX = Math.min(this.selectionStart.x, this.selectionEnd.x);
            const maxX = Math.max(this.selectionStart.x, this.selectionEnd.x);
            const minY = Math.min(this.selectionStart.y, this.selectionEnd.y);
            const maxY = Math.max(this.selectionStart.y, this.selectionEnd.y);
            
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
            ctx.setLineDash([]);
        }
    }

    pause() {
        this.isPaused = true;
        this.ui.showPauseMenu();
    }

    resume() {
        this.isPaused = false;
        this.ui.hidePauseMenu();
    }

    handleResize() {
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.camera.setViewport(this.width, this.height);
    }
}