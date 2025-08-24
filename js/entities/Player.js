// Player entity class
export class Player {
    constructor(scene, x, y) {
        this.scene = scene;
        this.sprite = scene.physics.add.sprite(x, y, 'player');
        this.sprite.setCollideWorldBounds(true);
        this.sprite.setDepth(10);
        
        // Player properties
        this.health = 100;
        this.maxHealth = 100;
        this.speed = 200;
        this.isInCar = false;
        this.currentCar = null;
        this.wantedLevel = 0;
        this.score = 0;
        
        // Shooting properties
        this.canShoot = true;
        this.shootCooldown = 250;
        this.lastShotTime = 0;
        
        // Movement state
        this.velocity = { x: 0, y: 0 };
    }

    update(delta) {
        if (!this.isInCar) {
            // Update on-foot movement
            this.sprite.setVelocity(this.velocity.x * this.speed, this.velocity.y * this.speed);
            
            // Update rotation based on movement
            if (this.velocity.x !== 0 || this.velocity.y !== 0) {
                this.sprite.rotation = Math.atan2(this.velocity.y, this.velocity.x);
            }
        } else if (this.currentCar) {
            // Follow car position
            this.sprite.x = this.currentCar.sprite.x;
            this.sprite.y = this.currentCar.sprite.y;
            this.sprite.setVelocity(0, 0);
        }
        
        // Check health
        if (this.health <= 0) {
            this.die();
        }
        
        // Reduce wanted level over time
        if (this.wantedLevel > 0 && Phaser.Math.Between(0, 1000) < 2) {
            this.wantedLevel = Math.max(0, this.wantedLevel - 1);
        }
    }

    setVelocity(x, y) {
        this.velocity.x = x;
        this.velocity.y = y;
    }

    enterCar(car) {
        if (!this.isInCar && car && !car.hasDriver) {
            this.isInCar = true;
            this.currentCar = car;
            car.setDriver(this);
            this.sprite.setVisible(false);
            
            // Increase speed when in car
            this.speed = 400;
        }
    }

    exitCar() {
        if (this.isInCar && this.currentCar) {
            const car = this.currentCar;
            
            // Position player next to car
            this.sprite.x = car.sprite.x + 50;
            this.sprite.y = car.sprite.y;
            this.sprite.setVisible(true);
            
            // Reset car
            car.removeDriver();
            
            // Reset player state
            this.isInCar = false;
            this.currentCar = null;
            this.speed = 200;
        }
    }

    shoot(targetX, targetY) {
        const currentTime = Date.now();
        
        if (this.canShoot && currentTime - this.lastShotTime > this.shootCooldown) {
            const angle = Math.atan2(
                targetY - this.sprite.y,
                targetX - this.sprite.x
            );
            
            // Create bullet
            const bulletX = this.sprite.x + Math.cos(angle) * 30;
            const bulletY = this.sprite.y + Math.sin(angle) * 30;
            
            this.scene.createBullet(bulletX, bulletY, angle);
            
            this.lastShotTime = currentTime;
            
            // Increase wanted level for shooting
            this.increaseWantedLevel(1);
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        
        // Flash red when hit
        this.sprite.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => {
            this.sprite.clearTint();
        });
        
        if (this.health <= 0) {
            this.die();
        }
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    increaseWantedLevel(amount) {
        this.wantedLevel = Math.min(5, this.wantedLevel + amount);
        
        // Spawn police if wanted level is high
        if (this.wantedLevel >= 3) {
            this.spawnPolice();
        }
    }

    spawnPolice() {
        // Spawn police cars near player
        const distance = 400;
        const angle = Phaser.Math.Between(0, 360) * Math.PI / 180;
        const x = this.sprite.x + Math.cos(angle) * distance;
        const y = this.sprite.y + Math.sin(angle) * distance;
        
        // Check if we can access the Car class
        if (this.scene.cars) {
            const Car = this.scene.cars[0]?.constructor;
            if (Car) {
                const policeCar = new Car(this.scene, x, y, 'car_police');
                policeCar.setAI(true);
                policeCar.setTarget(this);
                this.scene.cars.push(policeCar);
            }
        }
    }

    addScore(points) {
        this.score += points;
    }

    die() {
        if (this.isInCar) {
            this.exitCar();
        }
        
        this.sprite.setTint(0xff0000);
        this.sprite.setActive(false);
        
        // Game over
        this.scene.gameOver();
    }

    getNearestCar() {
        let nearestCar = null;
        let nearestDistance = 100; // Max distance to enter car
        
        this.scene.cars.forEach(car => {
            if (car.active && !car.hasDriver) {
                const distance = Phaser.Math.Distance.Between(
                    this.sprite.x, this.sprite.y,
                    car.sprite.x, car.sprite.y
                );
                
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestCar = car;
                }
            }
        });
        
        return nearestCar;
    }
}