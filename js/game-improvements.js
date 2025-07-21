// Улучшения для игры Warcraft 2D
import { SoundGenerator } from './sound-generator.js';

export class GameImprovements {
    constructor(game, Unit, Building) {
        this.game = game;
        this.Unit = Unit;
        this.Building = Building;
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
                // Создаем золотые шахты в фиксированных местах
                this.game.gathering.goldMines = [
                    { x: 200, y: 200, resources: 1500, width: 64, height: 64, type: 'gold' },
                    { x: 1000, y: 300, resources: 1500, width: 64, height: 64, type: 'gold' },
                    { x: 600, y: 600, resources: 1500, width: 64, height: 64, type: 'gold' }
                ];
                
                // Создаем леса в фиксированных местах
                this.game.gathering.forests = [
                    { x: 300, y: 150, resources: 800, width: 32, height: 32, type: 'wood' },
                    { x: 350, y: 150, resources: 800, width: 32, height: 32, type: 'wood' },
                    { x: 300, y: 200, resources: 800, width: 32, height: 32, type: 'wood' },
                    { x: 350, y: 200, resources: 800, width: 32, height: 32, type: 'wood' },
                    { x: 800, y: 400, resources: 800, width: 32, height: 32, type: 'wood' },
                    { x: 850, y: 400, resources: 800, width: 32, height: 32, type: 'wood' },
                    { x: 800, y: 450, resources: 800, width: 32, height: 32, type: 'wood' },
                    { x: 850, y: 450, resources: 800, width: 32, height: 32, type: 'wood' }
                ];
                
                console.log('Созданы ресурсы:', this.game.gathering.goldMines.length, 'рудников,', this.game.gathering.forests.length, 'деревьев');
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
        // Используем встроенный аудио менеджер игры
        if (this.game.audioManager && this.game.audioManager.audioContext) {
            this.soundGenerator = new SoundGenerator(this.game.audioManager.audioContext);
            this.soundGenerator.generateGameSounds();
            
            this.game.audio = {
                play: (name, volume = 0.5) => {
                    this.soundGenerator.playSound(name);
                }
            };
        } else {
            // Заглушка если аудио недоступно
            this.game.audio = {
                play: () => {}
            };
        }
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
                const enemyTownHall = new this.Building({
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
                    const enemyUnit = new this.Unit({
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
        for (const mine of this.game.gathering.goldMines) {
            if (mine.resources > 0) {
                // Основа рудника
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(mine.x, mine.y, mine.width, mine.height);
                
                // Золотые вкрапления
                ctx.fillStyle = '#FFD700';
                ctx.fillRect(mine.x + 5, mine.y + 5, 15, 15);
                ctx.fillRect(mine.x + 25, mine.y + 15, 12, 12);
                ctx.fillRect(mine.x + 10, mine.y + 35, 18, 10);
                
                // Границы
                ctx.strokeStyle = '#654321';
                ctx.lineWidth = 2;
                ctx.strokeRect(mine.x, mine.y, mine.width, mine.height);
                
                // Количество ресурсов
                ctx.fillStyle = '#FFFFFF';
                ctx.font = '12px Arial';
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 1;
                ctx.strokeText(mine.resources.toString(), mine.x + 5, mine.y + 55);
                ctx.fillText(mine.resources.toString(), mine.x + 5, mine.y + 55);
            }
        }
        
        // Рендерим деревья
        for (const tree of this.game.gathering.forests) {
            if (tree.resources > 0) {
                // Ствол дерева
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(tree.x + 12, tree.y + 20, 8, 12);
                
                // Крона дерева
                ctx.fillStyle = '#228B22';
                ctx.beginPath();
                ctx.arc(tree.x + 16, tree.y + 16, 12, 0, Math.PI * 2);
                ctx.fill();
                
                // Тень кроны
                ctx.fillStyle = '#006400';
                ctx.beginPath();
                ctx.arc(tree.x + 18, tree.y + 18, 8, 0, Math.PI * 2);
                ctx.fill();
                
                // Границы
                ctx.strokeStyle = '#004000';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(tree.x + 16, tree.y + 16, 12, 0, Math.PI * 2);
                ctx.stroke();
                
                // Количество ресурсов (если нужно показать)
                if (tree.resources < 600) {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.font = '10px Arial';
                    ctx.strokeStyle = '#000000';
                    ctx.lineWidth = 1;
                    ctx.strokeText(tree.resources.toString(), tree.x + 2, tree.y + 12);
                    ctx.fillText(tree.resources.toString(), tree.x + 2, tree.y + 12);
                }
            }
        }
    }
}