// Car entity class
export class Car {
    constructor(scene, x, y, type = 'car_red') {
        this.scene = scene;
        this.type = type;
        this.sprite = scene.physics.add.sprite(x, y, type);
        this.sprite.setCollideWorldBounds(true);
        this.sprite.setDepth(5);
        
        // Car properties
        this.maxSpeed = type === 'car_sport' ? 500 : 350;
        this.acceleration = type === 'car_sport' ? 400 : 250;
        this.turnSpeed = 3;
        this.currentSpeed = 0;
        this.health = 100;
        this.active = true;
        
        // Driver
        this.hasDriver = false;
        this.driver = null;
        
        // AI properties
        this.isAI = false;
        this.aiTarget = null;
        this.aiState = 'wander';
        this.aiTimer = 0;
        this.aiDirection = 0;
    }

    update(delta) {
        if (!this.active) return;
        
        if (this.isAI && !this.hasDriver) {
            this.updateAI(delta);
        }
        
        // Apply drag
        if (!this.hasDriver && this.currentSpeed > 0) {
            this.currentSpeed *= 0.95;
            if (this.currentSpeed < 1) {
                this.currentSpeed = 0;
            }
        }
        
        // Update velocity based on rotation and speed
        if (this.currentSpeed !== 0) {
            const velocityX = Math.cos(this.sprite.rotation) * this.currentSpeed;
            const velocityY = Math.sin(this.sprite.rotation) * this.currentSpeed;
            this.sprite.setVelocity(velocityX, velocityY);
        } else {
            this.sprite.setVelocity(0, 0);
        }
        
        // Check health
        if (this.health <= 0) {
            this.destroy();
        }
    }

    setDriver(driver) {
        this.hasDriver = true;
        this.driver = driver;
    }

    removeDriver() {
        this.hasDriver = false;
        this.driver = null;
    }

    accelerate(delta) {
        this.currentSpeed = Math.min(this.maxSpeed, this.currentSpeed + this.acceleration * (delta / 1000));
    }

    brake(delta) {
        this.currentSpeed = Math.max(-this.maxSpeed / 2, this.currentSpeed - this.acceleration * 1.5 * (delta / 1000));
    }

    turnLeft(delta) {
        if (Math.abs(this.currentSpeed) > 10) {
            this.sprite.rotation -= this.turnSpeed * (delta / 1000) * (this.currentSpeed / this.maxSpeed);
        }
    }

    turnRight(delta) {
        if (Math.abs(this.currentSpeed) > 10) {
            this.sprite.rotation += this.turnSpeed * (delta / 1000) * (this.currentSpeed / this.maxSpeed);
        }
    }

    setAI(enabled) {
        this.isAI = enabled;
        if (enabled) {
            this.aiTimer = 0;
            this.aiDirection = Phaser.Math.Between(0, 360) * Math.PI / 180;
            this.sprite.rotation = this.aiDirection;
        }
    }

    setTarget(target) {
        this.aiTarget = target;
        this.aiState = 'chase';
    }

    updateAI(delta) {
        this.aiTimer += delta;
        
        if (this.aiState === 'wander') {
            // Wander around randomly
            this.accelerate(delta);
            
            // Change direction occasionally
            if (this.aiTimer > 2000) {
                this.aiTimer = 0;
                const turnChance = Phaser.Math.Between(0, 100);
                
                if (turnChance < 30) {
                    this.aiDirection += (Phaser.Math.Between(-45, 45) * Math.PI / 180);
                }
            }
            
            // Smooth turn towards direction
            const angleDiff = Phaser.Math.Angle.Wrap(this.aiDirection - this.sprite.rotation);
            if (Math.abs(angleDiff) > 0.1) {
                if (angleDiff > 0) {
                    this.turnRight(delta);
                } else {
                    this.turnLeft(delta);
                }
            }
            
            // Avoid walls by turning
            if (this.sprite.body.blocked.any) {
                this.aiDirection += Math.PI / 2;
                this.currentSpeed *= 0.5;
            }
            
        } else if (this.aiState === 'chase' && this.aiTarget) {
            // Chase target
            const target = this.aiTarget.sprite || this.aiTarget;
            
            if (target && target.active) {
                const angle = Phaser.Math.Angle.Between(
                    this.sprite.x, this.sprite.y,
                    target.x, target.y
                );
                
                this.aiDirection = angle;
                this.accelerate(delta);
                
                // Turn towards target
                const angleDiff = Phaser.Math.Angle.Wrap(this.aiDirection - this.sprite.rotation);
                if (Math.abs(angleDiff) > 0.1) {
                    if (angleDiff > 0) {
                        this.turnRight(delta * 2);
                    } else {
                        this.turnLeft(delta * 2);
                    }
                }
                
                // Stop chasing if too far
                const distance = Phaser.Math.Distance.Between(
                    this.sprite.x, this.sprite.y,
                    target.x, target.y
                );
                
                if (distance > 800) {
                    this.aiState = 'wander';
                    this.aiTarget = null;
                }
            } else {
                this.aiState = 'wander';
                this.aiTarget = null;
            }
        }
        
        // Police behavior
        if (this.type === 'car_police') {
            // Look for player if they have wanted level
            if (this.scene.player && this.scene.player.wantedLevel > 0) {
                const distance = Phaser.Math.Distance.Between(
                    this.sprite.x, this.sprite.y,
                    this.scene.player.sprite.x, this.scene.player.sprite.y
                );
                
                if (distance < 500) {
                    this.setTarget(this.scene.player);
                }
            }
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        
        // Flash when hit
        this.sprite.setTint(0xff8888);
        this.scene.time.delayedCall(100, () => {
            this.sprite.clearTint();
        });
        
        if (this.health <= 0) {
            this.explode();
        }
    }

    explode() {
        // Create explosion effect
        const explosion = this.scene.add.circle(this.sprite.x, this.sprite.y, 30, 0xff6600);
        explosion.setDepth(20);
        
        this.scene.tweens.add({
            targets: explosion,
            scaleX: 3,
            scaleY: 3,
            alpha: 0,
            duration: 500,
            onComplete: () => {
                explosion.destroy();
            }
        });
        
        // Eject driver if any
        if (this.hasDriver && this.driver) {
            if (this.driver === this.scene.player) {
                this.driver.exitCar();
                this.driver.takeDamage(20);
            }
        }
        
        this.destroy();
    }

    destroy() {
        this.active = false;
        this.sprite.destroy();
    }
}