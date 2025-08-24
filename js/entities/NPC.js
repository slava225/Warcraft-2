// NPC entity class
export class NPC {
    constructor(scene, x, y, type = 'npc_civilian') {
        this.scene = scene;
        this.type = type;
        this.sprite = scene.physics.add.sprite(x, y, type);
        this.sprite.setCollideWorldBounds(true);
        this.sprite.setDepth(8);
        
        // NPC properties
        this.health = type === 'npc_police' ? 150 : 50;
        this.maxHealth = this.health;
        this.speed = 100;
        this.active = true;
        
        // AI properties
        this.aiState = 'wander';
        this.aiTimer = 0;
        this.targetDirection = Phaser.Math.Between(0, 360) * Math.PI / 180;
        this.fleeTarget = null;
        this.attackTarget = null;
        
        // Combat properties
        this.canShoot = type === 'npc_police' || type === 'npc_gang';
        this.shootCooldown = 1000;
        this.lastShotTime = 0;
        this.detectionRange = type === 'npc_police' ? 400 : 300;
    }

    update(delta, player) {
        if (!this.active) return;
        
        this.aiTimer += delta;
        
        // Update AI based on type and state
        switch (this.type) {
            case 'npc_civilian':
                this.updateCivilianAI(delta, player);
                break;
            case 'npc_police':
                this.updatePoliceAI(delta, player);
                break;
            case 'npc_gang':
                this.updateGangAI(delta, player);
                break;
        }
        
        // Apply movement
        this.applyMovement();
        
        // Check health
        if (this.health <= 0) {
            this.die();
        }
    }

    updateCivilianAI(delta, player) {
        const distanceToPlayer = Phaser.Math.Distance.Between(
            this.sprite.x, this.sprite.y,
            player.sprite.x, player.sprite.y
        );
        
        // Flee from player if they're shooting or have high wanted level
        if (distanceToPlayer < 200 && player.wantedLevel > 2) {
            this.aiState = 'flee';
            this.fleeTarget = player.sprite;
        } else if (this.aiState === 'flee' && distanceToPlayer > 300) {
            this.aiState = 'wander';
            this.fleeTarget = null;
        }
        
        if (this.aiState === 'wander') {
            this.wander(delta);
        } else if (this.aiState === 'flee' && this.fleeTarget) {
            this.flee();
        }
    }

    updatePoliceAI(delta, player) {
        const distanceToPlayer = Phaser.Math.Distance.Between(
            this.sprite.x, this.sprite.y,
            player.sprite.x, player.sprite.y
        );
        
        // Attack player if they have wanted level
        if (player.wantedLevel > 0 && distanceToPlayer < this.detectionRange) {
            this.aiState = 'attack';
            this.attackTarget = player;
            
            // Shoot at player
            if (distanceToPlayer < 250 && this.canShoot) {
                this.shoot(player.sprite.x, player.sprite.y);
            }
        } else if (this.aiState === 'attack' && distanceToPlayer > this.detectionRange * 1.5) {
            this.aiState = 'wander';
            this.attackTarget = null;
        }
        
        if (this.aiState === 'wander') {
            this.wander(delta);
        } else if (this.aiState === 'attack' && this.attackTarget) {
            this.pursue();
        }
    }

    updateGangAI(delta, player) {
        const distanceToPlayer = Phaser.Math.Distance.Between(
            this.sprite.x, this.sprite.y,
            player.sprite.x, player.sprite.y
        );
        
        // Randomly aggressive
        if (distanceToPlayer < this.detectionRange && Phaser.Math.Between(0, 100) < 30) {
            this.aiState = 'attack';
            this.attackTarget = player;
            
            // Shoot at player
            if (distanceToPlayer < 200 && this.canShoot) {
                this.shoot(player.sprite.x, player.sprite.y);
            }
        } else if (this.aiState === 'attack' && distanceToPlayer > this.detectionRange * 1.5) {
            this.aiState = 'wander';
            this.attackTarget = null;
        }
        
        if (this.aiState === 'wander') {
            this.wander(delta);
        } else if (this.aiState === 'attack' && this.attackTarget) {
            this.pursue();
        }
    }

    wander(delta) {
        // Change direction occasionally
        if (this.aiTimer > 2000) {
            this.aiTimer = 0;
            this.targetDirection = Phaser.Math.Between(0, 360) * Math.PI / 180;
        }
        
        // Move in target direction
        const velocityX = Math.cos(this.targetDirection) * this.speed;
        const velocityY = Math.sin(this.targetDirection) * this.speed;
        this.sprite.setVelocity(velocityX, velocityY);
        
        // Change direction if blocked
        if (this.sprite.body.blocked.any) {
            this.targetDirection += Math.PI / 2;
        }
    }

    flee() {
        if (!this.fleeTarget) return;
        
        // Move away from target
        const angle = Phaser.Math.Angle.Between(
            this.fleeTarget.x, this.fleeTarget.y,
            this.sprite.x, this.sprite.y
        );
        
        const velocityX = Math.cos(angle) * this.speed * 1.5;
        const velocityY = Math.sin(angle) * this.speed * 1.5;
        this.sprite.setVelocity(velocityX, velocityY);
        
        this.sprite.rotation = angle;
    }

    pursue() {
        if (!this.attackTarget) return;
        
        const target = this.attackTarget.sprite || this.attackTarget;
        
        // Move towards target
        const angle = Phaser.Math.Angle.Between(
            this.sprite.x, this.sprite.y,
            target.x, target.y
        );
        
        const velocityX = Math.cos(angle) * this.speed * 1.2;
        const velocityY = Math.sin(angle) * this.speed * 1.2;
        this.sprite.setVelocity(velocityX, velocityY);
        
        this.sprite.rotation = angle;
    }

    applyMovement() {
        // Update sprite rotation based on velocity
        if (this.sprite.body.velocity.x !== 0 || this.sprite.body.velocity.y !== 0) {
            this.sprite.rotation = Math.atan2(
                this.sprite.body.velocity.y,
                this.sprite.body.velocity.x
            );
        }
    }

    shoot(targetX, targetY) {
        const currentTime = Date.now();
        
        if (currentTime - this.lastShotTime > this.shootCooldown) {
            const angle = Math.atan2(
                targetY - this.sprite.y,
                targetX - this.sprite.x
            );
            
            // Create bullet
            const bulletX = this.sprite.x + Math.cos(angle) * 20;
            const bulletY = this.sprite.y + Math.sin(angle) * 20;
            
            const bullet = this.scene.createBullet(bulletX, bulletY, angle);
            
            // Add collision with player
            if (bullet && this.scene.player) {
                this.scene.physics.add.overlap(bullet, this.scene.player.sprite, () => {
                    this.scene.player.takeDamage(10);
                    bullet.destroy();
                });
            }
            
            this.lastShotTime = currentTime;
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        
        // Flash when hit
        this.sprite.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => {
            this.sprite.clearTint();
        });
        
        // Civilians flee when hurt
        if (this.type === 'npc_civilian') {
            this.aiState = 'flee';
            this.fleeTarget = this.scene.player.sprite;
        }
        
        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        // Give player score based on NPC type
        if (this.scene.player) {
            if (this.type === 'npc_gang') {
                this.scene.player.addScore(50);
            } else if (this.type === 'npc_police') {
                this.scene.player.addScore(100);
                this.scene.player.increaseWantedLevel(2);
            } else {
                this.scene.player.addScore(10);
                this.scene.player.increaseWantedLevel(1);
            }
        }
        
        // Create death effect
        const deathEffect = this.scene.add.circle(this.sprite.x, this.sprite.y, 10, 0xff0000);
        deathEffect.setDepth(15);
        
        this.scene.tweens.add({
            targets: deathEffect,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                deathEffect.destroy();
            }
        });
        
        this.active = false;
        this.sprite.destroy();
    }
}