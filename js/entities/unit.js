// Игровой юнит
export class Unit {
    constructor(data) {
        // Основные параметры
        this.type = data.type;
        this.x = data.x;
        this.y = data.y;
        this.width = data.width || 24;
        this.height = data.height || 24;
        this.player = data.player || 1;
        
        // Здоровье
        this.hp = data.hp || 100;
        this.maxHp = data.maxHp || 100;
        
        // Характеристики
        this.speed = data.speed || 50;
        this.damage = data.damage || 10;
        this.attackRange = data.attackRange || 40;
        this.attackSpeed = data.attackSpeed || 1.0; // атак в секунду
        this.armor = data.armor || 0;
        this.sight = data.sight || 100;
        
        // Состояние
        this.selected = false;
        this.hasMoved = false;
        
        // Движение
        this.targetX = this.x;
        this.targetY = this.y;
        this.path = [];
        this.pathIndex = 0;
        this.isMoving = false;
        this.velocity = { x: 0, y: 0 };
        
        // Боевая система
        this.target = null;
        this.lastAttackTime = 0;
        this.isAttacking = false;
        
        // Работа/задания
        this.task = null; // idle, move, attack, gather, build
        this.taskData = {};
        this.gatherTarget = null;
        this.buildTarget = null;
        
        // Анимация
        this.animation = {
            frame: 0,
            timer: 0,
            speed: 0.1
        };
        
        // Специальные способности по типу юнита
        this.initializeUnitType();
    }

    initializeUnitType() {
        const unitTypes = {
            peasant: {
                canGather: true,
                canBuild: true,
                buildTime: 3.0,
                gatherRate: 1.0,
                carryCapacity: 10,
                damage: 5,
                hp: 30,
                speed: 60
            },
            footman: {
                damage: 15,
                armor: 2,
                hp: 60,
                speed: 50,
                attackRange: 30
            },
            archer: {
                damage: 8,
                hp: 40,
                speed: 55,
                attackRange: 80,
                isRanged: true
            },
            knight: {
                damage: 25,
                armor: 4,
                hp: 180,
                speed: 75,
                attackRange: 35,
                trampling: true
            }
        };

        const typeData = unitTypes[this.type];
        if (typeData) {
            Object.assign(this, typeData);
        }
    }

    update(deltaTime, entityManager) {
        this.hasMoved = false;
        
        // Обновляем анимацию
        this.updateAnimation(deltaTime);
        
        // Выполняем текущую задачу
        this.updateTask(deltaTime, entityManager);
        
        // Обновляем движение
        this.updateMovement(deltaTime, entityManager);
        
        // Обновляем боевую систему
        this.updateCombat(deltaTime, entityManager);
        
        // Автоматически ищем врагов поблизости
        this.updateAutoTarget(entityManager);
    }

    updateTask(deltaTime, entityManager) {
        switch (this.task) {
            case 'gather':
                this.updateGathering(deltaTime, entityManager);
                break;
            case 'build':
                this.updateBuilding(deltaTime, entityManager);
                break;
            case 'move':
                // Движение обрабатывается в updateMovement
                if (!this.isMoving && this.path.length === 0) {
                    this.task = 'idle';
                }
                break;
            case 'attack':
                // Атака обрабатывается в updateCombat
                if (!this.target || this.target.hp <= 0) {
                    this.task = 'idle';
                    this.target = null;
                }
                break;
        }
    }

    updateMovement(deltaTime, entityManager) {
        if (!this.isMoving && this.path.length === 0) return;
        
        // Следуем по пути
        if (this.path.length > 0) {
            const currentTarget = this.path[this.pathIndex];
            const distanceToTarget = Math.hypot(
                currentTarget.x - this.x - this.width / 2,
                currentTarget.y - this.y - this.height / 2
            );
            
            if (distanceToTarget < 5) {
                // Достигли текущей точки пути
                this.pathIndex++;
                if (this.pathIndex >= this.path.length) {
                    // Достигли конца пути
                    this.path = [];
                    this.pathIndex = 0;
                    this.isMoving = false;
                    this.velocity = { x: 0, y: 0 };
                    return;
                }
            } else {
                // Двигаемся к текущей точке пути
                const angle = Math.atan2(
                    currentTarget.y - this.y - this.height / 2,
                    currentTarget.x - this.x - this.width / 2
                );
                
                this.velocity.x = Math.cos(angle) * this.speed;
                this.velocity.y = Math.sin(angle) * this.speed;
            }
        }
        
        // Применяем скорость
        if (this.velocity.x !== 0 || this.velocity.y !== 0) {
            const oldX = this.x;
            const oldY = this.y;
            
            this.x += this.velocity.x * deltaTime;
            this.y += this.velocity.y * deltaTime;
            
            // Проверяем коллизии
            const collisions = entityManager.checkCollisions(this);
            if (collisions.length > 0) {
                // Возвращаемся на предыдущую позицию и пытаемся обойти препятствие
                this.x = oldX;
                this.y = oldY;
                this.handleCollision(collisions[0], entityManager);
            } else {
                this.hasMoved = true;
            }
        }
    }

    updateCombat(deltaTime, entityManager) {
        if (!this.target) return;
        
        const distanceToTarget = Math.hypot(
            this.target.x + this.target.width / 2 - this.x - this.width / 2,
            this.target.y + this.target.height / 2 - this.y - this.height / 2
        );
        
        if (distanceToTarget <= this.attackRange) {
            // В радиусе атаки
            this.isMoving = false;
            this.path = [];
            
            const timeSinceLastAttack = Date.now() - this.lastAttackTime;
            const attackCooldown = 1000 / this.attackSpeed;
            
            if (timeSinceLastAttack >= attackCooldown) {
                this.performAttack(this.target, entityManager);
                this.lastAttackTime = Date.now();
            }
        } else if (this.task === 'attack') {
            // Преследуем цель
            this.moveTo(
                this.target.x + this.target.width / 2,
                this.target.y + this.target.height / 2,
                entityManager
            );
        }
    }

    updateGathering(deltaTime, entityManager) {
        if (!this.gatherTarget) {
            this.task = 'idle';
            return;
        }
        
        const distance = Math.hypot(
            this.gatherTarget.x - this.x,
            this.gatherTarget.y - this.y
        );
        
        if (distance <= 40) {
            // Начинаем добычу
            this.taskData.gatherTimer = (this.taskData.gatherTimer || 0) + deltaTime;
            
            if (this.taskData.gatherTimer >= 2.0) { // 2 секунды на добычу
                this.harvestResource(this.gatherTarget, entityManager);
                this.taskData.gatherTimer = 0;
            }
        } else {
            // Идем к ресурсу
            this.moveTo(this.gatherTarget.x, this.gatherTarget.y, entityManager);
        }
    }

    updateBuilding(deltaTime, entityManager) {
        if (!this.buildTarget) {
            this.task = 'idle';
            return;
        }
        
        const distance = Math.hypot(
            this.buildTarget.x + this.buildTarget.width / 2 - this.x - this.width / 2,
            this.buildTarget.y + this.buildTarget.height / 2 - this.y - this.height / 2
        );
        
        if (distance <= 50) {
            // Строим здание
            this.taskData.buildTimer = (this.taskData.buildTimer || 0) + deltaTime;
            
            const buildTime = this.buildTime || 3.0;
            const progress = this.taskData.buildTimer / buildTime;
            
            if (this.buildTarget.hp < this.buildTarget.maxHp) {
                this.buildTarget.hp = Math.min(
                    this.buildTarget.maxHp,
                    this.buildTarget.hp + deltaTime * (this.buildTarget.maxHp / buildTime)
                );
            }
            
            if (progress >= 1.0) {
                // Строительство завершено
                this.buildTarget.isConstructing = false;
                this.buildTarget = null;
                this.task = 'idle';
                this.taskData = {};
            }
        } else {
            // Идем к зданию
            this.moveTo(
                this.buildTarget.x + this.buildTarget.width / 2,
                this.buildTarget.y + this.buildTarget.height / 2,
                entityManager
            );
        }
    }

    updateAutoTarget(entityManager) {
        if (this.task === 'attack' || this.target) return;
        
        // Ищем врагов в радиусе обзора
        const enemies = entityManager.getEntitiesInRadius(
            this.x + this.width / 2,
            this.y + this.height / 2,
            this.sight
        ).filter(entity => entity.player !== this.player && entity.hp > 0);
        
        if (enemies.length > 0) {
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
            
            this.attack(nearest);
        }
    }

    updateAnimation(deltaTime) {
        this.animation.timer += deltaTime;
        if (this.animation.timer >= this.animation.speed) {
            this.animation.frame = (this.animation.frame + 1) % 4;
            this.animation.timer = 0;
        }
    }

    // Команды
    moveTo(x, y, entityManager) {
        this.task = 'move';
        this.target = null;
        
        // Находим путь к цели
        this.path = entityManager.findPath(
            this.x + this.width / 2,
            this.y + this.height / 2,
            x, y,
            Math.max(this.width, this.height)
        );
        
        this.pathIndex = 0;
        this.isMoving = true;
    }

    attack(target) {
        this.task = 'attack';
        this.target = target;
        
        const distance = Math.hypot(
            target.x + target.width / 2 - this.x - this.width / 2,
            target.y + target.height / 2 - this.y - this.height / 2
        );
        
        if (distance > this.attackRange) {
            // Подходим ближе к цели
            this.moveTo(
                target.x + target.width / 2,
                target.y + target.height / 2
            );
        }
    }

    gather(resource, entityManager) {
        if (!this.canGather) return;
        
        this.task = 'gather';
        this.gatherTarget = resource;
        this.taskData = {};
    }

    buildBuilding(building) {
        if (!this.canBuild) return;
        
        this.task = 'build';
        this.buildTarget = building;
        this.taskData = {};
    }

    stop() {
        this.task = 'idle';
        this.target = null;
        this.path = [];
        this.isMoving = false;
        this.velocity = { x: 0, y: 0 };
        this.gatherTarget = null;
        this.buildTarget = null;
        this.taskData = {};
    }

    // Боевые действия
    performAttack(target, entityManager) {
        const actualDamage = Math.max(1, this.damage - (target.armor || 0));
        target.takeDamage(actualDamage, this);
        
        // Создаем эффект атаки
        this.createAttackEffect(target, entityManager);
    }

    takeDamage(amount, attacker) {
        this.hp -= amount;
        
        // Если нас атакуют, и мы не заняты важным делом, атакуем в ответ
        if (attacker && this.task === 'idle' && attacker.player !== this.player) {
            this.attack(attacker);
        }
        
        return this.hp <= 0;
    }

    createAttackEffect(target, entityManager) {
        // Простой эффект вспышки для отображения урона
        if (target.flashTimer === undefined) {
            target.flashTimer = 0.2; // 200мс вспышки
        }
    }

    harvestResource(resource, entityManager) {
        // Собираем ресурс
        const game = entityManager.game || window.game;
        if (game && game.worldMap) {
            const harvestResult = game.worldMap.harvestResource(resource.x, resource.y);
            if (harvestResult && game.resourceManager) {
                game.resourceManager.addResource(harvestResult.type, harvestResult.amount);
            }
        }
    }

    handleCollision(other, entityManager) {
        // Простое избежание коллизий - пытаемся обойти препятствие
        if (other.isBuilding) {
            // Обходим здание
            const angle = Math.atan2(
                this.y - other.y,
                this.x - other.x
            ) + (Math.random() - 0.5) * Math.PI / 2;
            
            this.x += Math.cos(angle) * 10;
            this.y += Math.sin(angle) * 10;
            this.hasMoved = true;
        }
    }

    // Рендеринг
    render(ctx, camera) {
        ctx.save();
        
        // Основное тело юнита
        this.renderBody(ctx);
        
        // Полоса здоровья
        if (this.hp < this.maxHp || this.selected) {
            this.renderHealthBar(ctx);
        }
        
        // Эффекты
        this.renderEffects(ctx);
        
        ctx.restore();
    }

    renderBody(ctx) {
        // Цвет игрока
        const playerColors = {
            1: '#0066cc',
            2: '#cc0000',
            3: '#00cc66',
            4: '#cccc00'
        };
        
        ctx.fillStyle = playerColors[this.player] || '#888888';
        
        // Основная форма
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Детали в зависимости от типа
        this.renderUnitDetails(ctx);
        
        // Направление движения
        if (this.isMoving) {
            const angle = Math.atan2(this.velocity.y, this.velocity.x);
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(
                this.x + this.width / 2 + Math.cos(angle) * 8,
                this.y + this.height / 2 + Math.sin(angle) * 8,
                2, 0, Math.PI * 2
            );
            ctx.fill();
        }
    }

    renderUnitDetails(ctx) {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        ctx.fillStyle = '#ffffff';
        
        switch (this.type) {
            case 'peasant':
                // Простая шляпа
                ctx.fillRect(centerX - 6, this.y - 2, 12, 4);
                break;
            case 'footman':
                // Щит
                ctx.fillRect(this.x - 2, centerY - 4, 4, 8);
                break;
            case 'archer':
                // Лук
                ctx.strokeStyle = '#8b4513';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(this.x + this.width + 2, centerY, 6, 0, Math.PI);
                ctx.stroke();
                break;
            case 'knight':
                // Плюмаж
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(centerX - 2, this.y - 4, 4, 6);
                break;
        }
    }

    renderHealthBar(ctx) {
        const barWidth = this.width;
        const barHeight = 4;
        const barY = this.y - 8;
        
        // Фон
        ctx.fillStyle = '#333333';
        ctx.fillRect(this.x, barY, barWidth, barHeight);
        
        // Здоровье
        const healthPercent = this.hp / this.maxHp;
        ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : 
                       healthPercent > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillRect(this.x, barY, barWidth * healthPercent, barHeight);
    }

    renderEffects(ctx) {
        // Эффект вспышки при получении урона
        if (this.flashTimer > 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            this.flashTimer -= 0.016; // Примерно 60 FPS
        }
        
        // Индикатор выделения
        if (this.selected) {
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);
            
            // Радиус атаки для боевых юнитов
            if (this.damage > 0 && this.task === 'attack') {
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
    }

    // Сериализация
    serialize() {
        return {
            type: this.type,
            x: this.x,
            y: this.y,
            hp: this.hp,
            player: this.player,
            task: this.task
        };
    }
}