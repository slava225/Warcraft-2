// Улучшения для игры Warcraft 2D
export class GameImprovements {
    constructor(game) {
        this.game = game;
        this.setupImprovements();
    }

    setupImprovements() {
        this.addCombatSystem();
        this.addEnemyAI();
        this.addResourceGathering();
        this.addSoundEffects();
        this.addParticleSystem();
        this.addMultiplayer();
    }

    // Боевая система
    addCombatSystem() {
        this.game.combat = {
            // Проверка атак
            update: (deltaTime) => {
                for (const entity of this.game.entityManager.entities) {
                    if (entity.type === 'unit' && entity.target && entity.attackCooldown <= 0) {
                        this.performAttack(entity, entity.target);
                    }
                    
                    if (entity.attackCooldown > 0) {
                        entity.attackCooldown -= deltaTime;
                    }
                }
            },
            
            // Выполнение атаки
            performAttack: (attacker, target) => {
                const distance = this.getDistance(attacker, target);
                const attackRange = attacker.attackRange || 50;
                
                if (distance <= attackRange) {
                    const damage = attacker.attack || 10;
                    target.takeDamage(damage);
                    attacker.attackCooldown = 1.0; // 1 секунда между атаками
                    
                    // Эффекты атаки
                    this.createAttackEffect(attacker, target);
                    this.playSound('attack');
                }
            }
        };
    }

    // Простой AI для врагов
    addEnemyAI() {
        this.game.ai = {
            update: (deltaTime) => {
                const playerUnits = this.game.entityManager.getPlayerUnits(1);
                const enemyUnits = this.game.entityManager.getPlayerUnits(2);
                
                for (const enemy of enemyUnits) {
                    if (!enemy.target || enemy.target.isDead) {
                        // Ищем ближайшую цель
                        const nearestTarget = this.findNearestTarget(enemy, playerUnits);
                        if (nearestTarget) {
                            enemy.setTarget(nearestTarget);
                        }
                    }
                    
                    // Движение к цели
                    if (enemy.target) {
                        const distance = this.getDistance(enemy, enemy.target);
                        const attackRange = enemy.attackRange || 50;
                        
                        if (distance > attackRange) {
                            enemy.moveToTarget(enemy.target);
                        }
                    }
                }
            }
        };
    }

    // Система сбора ресурсов
    addResourceGathering() {
        this.game.gathering = {
            goldMines: [],
            forests: [],
            
            init: () => {
                // Создаем золотые шахты
                for (let i = 0; i < 5; i++) {
                    this.game.gathering.goldMines.push({
                        x: Math.random() * this.game.worldMap.width * 32,
                        y: Math.random() * this.game.worldMap.height * 32,
                        resources: 1000
                    });
                }
                
                // Создаем леса
                for (let i = 0; i < 10; i++) {
                    this.game.gathering.forests.push({
                        x: Math.random() * this.game.worldMap.width * 32,
                        y: Math.random() * this.game.worldMap.height * 32,
                        resources: 500
                    });
                }
            },
            
            gatherGold: (peasant, mine) => {
                if (mine.resources > 0) {
                    const amount = Math.min(10, mine.resources);
                    mine.resources -= amount;
                    peasant.carriedGold = (peasant.carriedGold || 0) + amount;
                    
                    if (peasant.carriedGold >= 50) {
                        // Идем к ратуше
                        peasant.returnToTownHall();
                    }
                }
            },
            
            gatherWood: (peasant, forest) => {
                if (forest.resources > 0) {
                    const amount = Math.min(10, forest.resources);
                    forest.resources -= amount;
                    peasant.carriedWood = (peasant.carriedWood || 0) + amount;
                    
                    if (peasant.carriedWood >= 50) {
                        // Идем к ратуше
                        peasant.returnToTownHall();
                    }
                }
            }
        };
        
        this.game.gathering.init();
    }

    // Звуковые эффекты
    addSoundEffects() {
        this.game.audio = {
            sounds: new Map(),
            
            load: async (name, url) => {
                try {
                    const audio = new Audio(url);
                    this.game.audio.sounds.set(name, audio);
                } catch (error) {
                    console.warn(`Не удалось загрузить звук: ${name}`);
                }
            },
            
            play: (name, volume = 0.5) => {
                const sound = this.game.audio.sounds.get(name);
                if (sound) {
                    sound.volume = volume;
                    sound.currentTime = 0;
                    sound.play().catch(() => {});
                }
            }
        };
        
        // Загружаем базовые звуки (создаем тишину если файлы отсутствуют)
        ['attack', 'build', 'select', 'move', 'gather'].forEach(name => {
            this.game.audio.sounds.set(name, new Audio());
        });
    }

    // Система частиц
    addParticleSystem() {
        this.game.particles = {
            particles: [],
            
            create: (x, y, type, options = {}) => {
                const particle = {
                    x: x,
                    y: y,
                    vx: (Math.random() - 0.5) * 100,
                    vy: (Math.random() - 0.5) * 100,
                    life: options.life || 1.0,
                    maxLife: options.life || 1.0,
                    size: options.size || 4,
                    color: options.color || '#ffff00',
                    type: type
                };
                
                this.game.particles.particles.push(particle);
            },
            
            update: (deltaTime) => {
                for (let i = this.game.particles.particles.length - 1; i >= 0; i--) {
                    const particle = this.game.particles.particles[i];
                    
                    particle.x += particle.vx * deltaTime;
                    particle.y += particle.vy * deltaTime;
                    particle.life -= deltaTime;
                    
                    if (particle.life <= 0) {
                        this.game.particles.particles.splice(i, 1);
                    }
                }
            },
            
            render: (ctx) => {
                for (const particle of this.game.particles.particles) {
                    const alpha = particle.life / particle.maxLife;
                    ctx.globalAlpha = alpha;
                    ctx.fillStyle = particle.color;
                    ctx.fillRect(
                        particle.x - particle.size / 2,
                        particle.y - particle.size / 2,
                        particle.size,
                        particle.size
                    );
                }
                ctx.globalAlpha = 1.0;
            }
        };
    }

    // Упрощенная мультиплеерная функциональность
    addMultiplayer() {
        this.game.multiplayer = {
            isHost: false,
            isConnected: false,
            
            // Симуляция сетевой игры (локально)
            createLobby: () => {
                this.game.multiplayer.isHost = true;
                console.log('Создана игровая комната');
                this.spawnEnemyPlayer();
            },
            
            // Создаем вражеского игрока (AI)
            spawnEnemyPlayer: () => {
                // Создаем вражескую базу
                const enemyTownHall = new this.game.entityManager.Building({
                    type: 'townhall',
                    x: this.game.worldMap.width * 32 - 150,
                    y: 100,
                    width: 96,
                    height: 96,
                    hp: 1200,
                    maxHp: 1200,
                    player: 2
                });
                this.game.entityManager.addEntity(enemyTownHall);
                
                // Создаем вражеских юнитов
                for (let i = 0; i < 3; i++) {
                    const enemyUnit = new this.game.entityManager.Unit({
                        type: 'footman',
                        x: this.game.worldMap.width * 32 - 200 + (i * 30),
                        y: 150,
                        width: 24,
                        height: 24,
                        hp: 60,
                        maxHp: 60,
                        speed: 50,
                        attack: 15,
                        attackRange: 30,
                        player: 2
                    });
                    this.game.entityManager.addEntity(enemyUnit);
                }
                
                console.log('Противник добавлен в игру');
            }
        };
    }

    // Вспомогательные методы
    getDistance(entity1, entity2) {
        const dx = entity1.x - entity2.x;
        const dy = entity1.y - entity2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    findNearestTarget(entity, targets) {
        let nearest = null;
        let nearestDistance = Infinity;
        
        for (const target of targets) {
            if (target.isDead) continue;
            
            const distance = this.getDistance(entity, target);
            if (distance < nearestDistance) {
                nearest = target;
                nearestDistance = distance;
            }
        }
        
        return nearest;
    }

    createAttackEffect(attacker, target) {
        // Создаем эффект попадания
        for (let i = 0; i < 5; i++) {
            this.game.particles.create(
                target.x + target.width / 2,
                target.y + target.height / 2,
                'hit',
                {
                    life: 0.5,
                    size: 3,
                    color: '#ff4444'
                }
            );
        }
    }

    playSound(name) {
        if (this.game.audio) {
            this.game.audio.play(name);
        }
    }

    // Интеграция улучшений в основной игровой цикл
    update(deltaTime) {
        if (this.game.combat) {
            this.game.combat.update(deltaTime);
        }
        
        if (this.game.ai) {
            this.game.ai.update(deltaTime);
        }
        
        if (this.game.particles) {
            this.game.particles.update(deltaTime);
        }
    }

    render(ctx) {
        if (this.game.particles) {
            this.game.particles.render(ctx);
        }
        
        // Рендерим ресурсы на карте
        if (this.game.gathering) {
            this.renderResources(ctx);
        }
    }

    renderResources(ctx) {
        // Рендерим золотые шахты
        ctx.fillStyle = '#ffd700';
        for (const mine of this.game.gathering.goldMines) {
            if (mine.resources > 0) {
                ctx.fillRect(mine.x, mine.y, 32, 32);
                ctx.fillStyle = '#000';
                ctx.font = '12px Arial';
                ctx.fillText(mine.resources.toString(), mine.x + 5, mine.y + 20);
                ctx.fillStyle = '#ffd700';
            }
        }
        
        // Рендерим леса
        ctx.fillStyle = '#228b22';
        for (const forest of this.game.gathering.forests) {
            if (forest.resources > 0) {
                ctx.fillRect(forest.x, forest.y, 32, 32);
                ctx.fillStyle = '#000';
                ctx.font = '12px Arial';
                ctx.fillText(forest.resources.toString(), forest.x + 5, forest.y + 20);
                ctx.fillStyle = '#228b22';
            }
        }
    }
}