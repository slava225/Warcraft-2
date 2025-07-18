// Игровое здание
export class Building {
    constructor(data) {
        // Основные параметры
        this.type = data.type;
        this.x = data.x;
        this.y = data.y;
        this.width = data.width || 64;
        this.height = data.height || 64;
        this.player = data.player || 1;
        
        // Здоровье
        this.hp = data.hp || 800;
        this.maxHp = data.maxHp || 800;
        this.armor = data.armor || 0;
        
        // Состояние
        this.selected = false;
        this.isBuilding = true;
        this.isConstructing = data.isConstructing || false;
        this.canDie = false; // Здания не исчезают сразу при 0 HP
        
        // Производство
        this.productionQueue = [];
        this.productionTimer = 0;
        this.maxQueueSize = 5;
        
        // Гарнизон (для некоторых зданий)
        this.garrison = [];
        this.maxGarrison = 0;
        
        // Исследования
        this.research = [];
        this.researchTimer = 0;
        
        // Эффекты
        this.flashTimer = 0;
        
        // Инициализация по типу здания
        this.initializeBuildingType();
    }

    initializeBuildingType() {
        const buildingTypes = {
            townhall: {
                maxHp: 1200,
                armor: 5,
                canProduce: ['peasant'],
                providesFood: 5,
                canResearch: ['upgrade_armor', 'upgrade_damage']
            },
            barracks: {
                maxHp: 800,
                armor: 3,
                canProduce: ['footman', 'archer', 'knight'],
                requiresBuilding: 'townhall'
            },
            farm: {
                maxHp: 400,
                armor: 0,
                providesFood: 8,
                width: 48,
                height: 48,
                isResource: true
            },
            lumber: {
                maxHp: 600,
                armor: 2,
                width: 64,
                height: 64,
                canProduce: ['peasant'],
                providesIncome: { wood: 5 }
            },
            tower: {
                maxHp: 500,
                armor: 8,
                damage: 20,
                attackRange: 120,
                attackSpeed: 0.5,
                canAttack: true,
                width: 32,
                height: 48
            },
            castle: {
                maxHp: 2000,
                armor: 10,
                canProduce: ['knight', 'archer'],
                maxGarrison: 20,
                providesFood: 20
            }
        };

        const typeData = buildingTypes[this.type];
        if (typeData) {
            Object.assign(this, typeData);
            this.maxHp = typeData.maxHp;
            if (this.hp > this.maxHp) {
                this.hp = this.maxHp;
            }
        }
    }

    update(deltaTime, entityManager) {
        // Обновляем производство
        this.updateProduction(deltaTime, entityManager);
        
        // Обновляем исследования
        this.updateResearch(deltaTime, entityManager);
        
        // Обновляем доход от ресурсов
        this.updateIncome(deltaTime, entityManager);
        
        // Обновляем боевую систему (для башен)
        if (this.canAttack) {
            this.updateCombat(deltaTime, entityManager);
        }
        
        // Обновляем эффекты
        this.updateEffects(deltaTime);
    }

    updateProduction(deltaTime, entityManager) {
        if (this.productionQueue.length === 0) return;
        
        const currentItem = this.productionQueue[0];
        this.productionTimer += deltaTime;
        
        if (this.productionTimer >= currentItem.productionTime) {
            // Производство завершено
            this.completeProduction(currentItem, entityManager);
            this.productionQueue.shift();
            this.productionTimer = 0;
        }
    }

    updateResearch(deltaTime, entityManager) {
        if (this.research.length === 0) return;
        
        const currentResearch = this.research[0];
        this.researchTimer += deltaTime;
        
        if (this.researchTimer >= currentResearch.researchTime) {
            // Исследование завершено
            this.completeResearch(currentResearch, entityManager);
            this.research.shift();
            this.researchTimer = 0;
        }
    }

    updateIncome(deltaTime, entityManager) {
        if (!this.providesIncome) return;
        
        // Пассивный доход каждые 10 секунд
        this.incomeTimer = (this.incomeTimer || 0) + deltaTime;
        if (this.incomeTimer >= 10.0) {
            const game = entityManager.game || window.game;
            if (game && game.resourceManager) {
                for (const [resource, amount] of Object.entries(this.providesIncome)) {
                    game.resourceManager.addResource(resource, amount);
                }
            }
            this.incomeTimer = 0;
        }
    }

    updateCombat(deltaTime, entityManager) {
        if (!this.canAttack) return;
        
        // Ищем врагов в радиусе атаки
        const enemies = entityManager.getEntitiesInRadius(
            this.x + this.width / 2,
            this.y + this.height / 2,
            this.attackRange
        ).filter(entity => 
            entity.player !== this.player && 
            entity.hp > 0 && 
            !entity.isBuilding
        );
        
        if (enemies.length > 0) {
            const timeSinceLastAttack = Date.now() - (this.lastAttackTime || 0);
            const attackCooldown = 1000 / (this.attackSpeed || 1);
            
            if (timeSinceLastAttack >= attackCooldown) {
                // Атакуем ближайшего врага
                const nearest = enemies.reduce((closest, current) => {
                    const distCurrent = Math.hypot(
                        current.x - this.x,
                        current.y - this.y
                    );
                    const distClosest = Math.hypot(
                        closest.x - this.x,
                        closest.y - this.y
                    );
                    return distCurrent < distClosest ? current : closest;
                });
                
                this.performAttack(nearest, entityManager);
                this.lastAttackTime = Date.now();
            }
        }
    }

    updateEffects(deltaTime) {
        if (this.flashTimer > 0) {
            this.flashTimer -= deltaTime;
        }
    }

    // Производство юнитов
    addToProductionQueue(unitType) {
        if (this.productionQueue.length >= this.maxQueueSize) {
            return false;
        }
        
        if (!this.canProduce || !this.canProduce.includes(unitType)) {
            return false;
        }
        
        const unitData = this.getUnitProductionData(unitType);
        if (!unitData) return false;
        
        this.productionQueue.push({
            type: unitType,
            productionTime: unitData.productionTime,
            cost: unitData.cost
        });
        
        return true;
    }

    getUnitProductionData(unitType) {
        const productionData = {
            peasant: {
                productionTime: 15.0,
                cost: { gold: 75, food: 1 }
            },
            footman: {
                productionTime: 20.0,
                cost: { gold: 60, food: 1 }
            },
            archer: {
                productionTime: 25.0,
                cost: { gold: 150, wood: 50, food: 1 }
            },
            knight: {
                productionTime: 45.0,
                cost: { gold: 800, food: 4 }
            }
        };
        
        return productionData[unitType];
    }

    completeProduction(item, entityManager) {
        // Находим место для спавна юнита
        const spawnX = this.x + this.width + 10;
        const spawnY = this.y + this.height / 2;
        
        // Создаем юнита
        const game = entityManager.game || window.game;
        if (game) {
            game.createUnit(item.type, this);
        }
        
        // Обновляем еду
        if (game && game.resourceManager && item.cost.food) {
            game.resourceManager.addResource('food', item.cost.food);
        }
    }

    // Исследования
    startResearch(researchType) {
        if (this.research.length > 0) return false;
        
        const researchData = this.getResearchData(researchType);
        if (!researchData) return false;
        
        this.research.push({
            type: researchType,
            researchTime: researchData.researchTime,
            cost: researchData.cost
        });
        
        return true;
    }

    getResearchData(researchType) {
        const researchData = {
            upgrade_armor: {
                researchTime: 60.0,
                cost: { gold: 500, wood: 200 }
            },
            upgrade_damage: {
                researchTime: 60.0,
                cost: { gold: 600, wood: 300 }
            },
            upgrade_speed: {
                researchTime: 45.0,
                cost: { gold: 400, wood: 150 }
            }
        };
        
        return researchData[researchType];
    }

    completeResearch(research, entityManager) {
        const game = entityManager.game || window.game;
        if (!game) return;
        
        // Применяем улучшения ко всем юнитам игрока
        const playerUnits = entityManager.getEntitiesOfPlayer(this.player)
            .filter(entity => !entity.isBuilding);
        
        switch (research.type) {
            case 'upgrade_armor':
                for (const unit of playerUnits) {
                    unit.armor = (unit.armor || 0) + 1;
                }
                break;
            case 'upgrade_damage':
                for (const unit of playerUnits) {
                    unit.damage = (unit.damage || 0) + 2;
                }
                break;
            case 'upgrade_speed':
                for (const unit of playerUnits) {
                    unit.speed = (unit.speed || 0) + 10;
                }
                break;
        }
    }

    // Гарнизон
    garrisonUnit(unit) {
        if (this.garrison.length >= this.maxGarrison) return false;
        
        this.garrison.push(unit);
        // Удаляем юнита с карты
        unit.isGarrisoned = true;
        unit.garrisonBuilding = this;
        
        return true;
    }

    ungarrisonUnit(index) {
        if (index < 0 || index >= this.garrison.length) return null;
        
        const unit = this.garrison.splice(index, 1)[0];
        unit.isGarrisoned = false;
        unit.garrisonBuilding = null;
        
        // Размещаем юнита рядом со зданием
        unit.x = this.x + this.width + 10;
        unit.y = this.y + this.height / 2;
        
        return unit;
    }

    // Боевая система
    performAttack(target, entityManager) {
        const actualDamage = Math.max(1, this.damage - (target.armor || 0));
        target.takeDamage(actualDamage, this);
        
        // Создаем эффект выстрела
        this.createProjectileEffect(target, entityManager);
    }

    createProjectileEffect(target, entityManager) {
        // Простой эффект снаряда для башен
        const startX = this.x + this.width / 2;
        const startY = this.y + this.height / 2;
        const endX = target.x + target.width / 2;
        const endY = target.y + target.height / 2;
        
        // Создаем временный эффект
        const effect = {
            startX, startY, endX, endY,
            duration: 0.5,
            timer: 0,
            type: 'projectile'
        };
        
        // Добавляем эффект в менеджер (если есть система эффектов)
        if (entityManager.addEffect) {
            entityManager.addEffect(effect);
        }
    }

    takeDamage(amount, attacker) {
        this.hp -= amount;
        this.flashTimer = 0.2;
        
        if (this.hp <= 0) {
            this.destroy();
        }
        
        return this.hp <= 0;
    }

    destroy() {
        // Высвобождаем гарнизон
        for (const unit of this.garrison) {
            this.ungarrisonUnit(0);
        }
        
        // Уменьшаем лимит еды если здание его предоставляло
        if (this.providesFood) {
            const game = window.game;
            if (game && game.resourceManager) {
                const currentMaxFood = game.resourceManager.getResource('maxFood');
                game.resourceManager.setResource('maxFood', currentMaxFood - this.providesFood);
            }
        }
        
        this.hp = 0;
        this.canDie = true;
    }

    // Методы интерфейса
    getProductionProgress() {
        if (this.productionQueue.length === 0) return 0;
        
        const currentItem = this.productionQueue[0];
        return this.productionTimer / currentItem.productionTime;
    }

    getResearchProgress() {
        if (this.research.length === 0) return 0;
        
        const currentResearch = this.research[0];
        return this.researchTimer / currentResearch.researchTime;
    }

    cancelProduction(index) {
        if (index < 0 || index >= this.productionQueue.length) return false;
        
        const item = this.productionQueue.splice(index, 1)[0];
        
        // Возвращаем ресурсы
        const game = window.game;
        if (game && game.resourceManager && item.cost) {
            for (const [resource, amount] of Object.entries(item.cost)) {
                game.resourceManager.addResource(resource, amount);
            }
        }
        
        // Сбрасываем таймер если отменили первый элемент
        if (index === 0) {
            this.productionTimer = 0;
        }
        
        return true;
    }

    // Рендеринг
    render(ctx, camera) {
        ctx.save();
        
        // Основное здание
        this.renderBuilding(ctx);
        
        // Полоса здоровья
        if (this.hp < this.maxHp || this.selected) {
            this.renderHealthBar(ctx);
        }
        
        // Полоса производства
        if (this.productionQueue.length > 0) {
            this.renderProductionBar(ctx);
        }
        
        // Эффекты
        this.renderEffects(ctx);
        
        ctx.restore();
    }

    renderBuilding(ctx) {
        // Цвет игрока
        const playerColors = {
            1: '#654321',
            2: '#8b0000',
            3: '#006400',
            4: '#4b0082'
        };
        
        let fillStyle = playerColors[this.player] || '#888888';
        
        // Если здание строится, делаем его полупрозрачным
        if (this.isConstructing) {
            ctx.globalAlpha = 0.6;
        }
        
        ctx.fillStyle = fillStyle;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Детали здания
        this.renderBuildingDetails(ctx);
        
        // Границы
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        ctx.globalAlpha = 1;
    }

    renderBuildingDetails(ctx) {
        ctx.fillStyle = '#ffffff';
        
        switch (this.type) {
            case 'townhall':
                // Флаг на крыше
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(this.x + this.width/2 - 2, this.y - 8, 4, 12);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(this.x + this.width/2 + 2, this.y - 6, 8, 6);
                break;
                
            case 'barracks':
                // Меч на стене
                ctx.fillStyle = '#c0c0c0';
                ctx.fillRect(this.x + this.width/2 - 1, this.y + 10, 2, 20);
                ctx.fillRect(this.x + this.width/2 - 4, this.y + 8, 8, 4);
                break;
                
            case 'farm':
                // Сено на крыше
                ctx.fillStyle = '#daa520';
                ctx.fillRect(this.x + 8, this.y + 8, this.width - 16, this.height - 16);
                break;
                
            case 'lumber':
                // Пила
                ctx.strokeStyle = '#c0c0c0';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(this.x + this.width/2, this.y + this.height/2, 12, 0, Math.PI * 2);
                ctx.stroke();
                break;
                
            case 'tower':
                // Зубцы башни
                for (let i = 0; i < 4; i++) {
                    const x = this.x + (i * this.width / 4) + 2;
                    ctx.fillRect(x, this.y - 4, 4, 8);
                }
                break;
        }
    }

    renderHealthBar(ctx) {
        const barWidth = this.width;
        const barHeight = 6;
        const barY = this.y - 12;
        
        // Фон
        ctx.fillStyle = '#333333';
        ctx.fillRect(this.x, barY, barWidth, barHeight);
        
        // Здоровье
        const healthPercent = this.hp / this.maxHp;
        ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : 
                       healthPercent > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillRect(this.x, barY, barWidth * healthPercent, barHeight);
    }

    renderProductionBar(ctx) {
        const barWidth = this.width;
        const barHeight = 4;
        const barY = this.y + this.height + 2;
        
        // Фон
        ctx.fillStyle = '#333333';
        ctx.fillRect(this.x, barY, barWidth, barHeight);
        
        // Прогресс производства
        const progress = this.getProductionProgress();
        ctx.fillStyle = '#00aaff';
        ctx.fillRect(this.x, barY, barWidth * progress, barHeight);
    }

    renderEffects(ctx) {
        // Эффект вспышки при получении урона
        if (this.flashTimer > 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        
        // Индикатор выделения
        if (this.selected) {
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 3;
            ctx.strokeRect(this.x - 3, this.y - 3, this.width + 6, this.height + 6);
            
            // Радиус атаки для башен
            if (this.canAttack && this.attackRange) {
                ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(
                    this.x + this.width / 2,
                    this.y + this.height / 2,
                    this.attackRange, 0, Math.PI * 2
                );
                ctx.stroke();
            }
        }
        
        // Индикатор строительства
        if (this.isConstructing) {
            ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            ctx.fillStyle = '#000000';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Строится...', this.x + this.width/2, this.y + this.height/2);
        }
    }

    // Сериализация
    serialize() {
        return {
            type: this.type,
            x: this.x,
            y: this.y,
            hp: this.hp,
            player: this.player,
            isConstructing: this.isConstructing,
            productionQueue: this.productionQueue,
            garrison: this.garrison.map(unit => unit.serialize())
        };
    }
}