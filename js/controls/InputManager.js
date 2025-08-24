// Input Manager class - handles keyboard and mobile controls
export class InputManager {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        
        // Keyboard controls
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.wasd = scene.input.keyboard.addKeys('W,S,A,D');
        this.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.enterKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.shiftKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
        
        // Mouse/touch controls
        this.setupPointerControls();
        
        // Mobile controls state
        this.mobileInput = {
            moveX: 0,
            moveY: 0,
            shoot: false,
            enterCar: false,
            sprint: false,
            pause: false
        };
        
        // Check if mobile controls are available
        if (window.mobileControls) {
            window.mobileControls.onInput = (input) => {
                this.mobileInput = input;
            };
        }
    }

    setupPointerControls() {
        // Mouse click to shoot
        this.scene.input.on('pointerdown', (pointer) => {
            // Only shoot with left click on desktop
            if (!this.isMobile() && pointer.leftButtonDown()) {
                const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
                this.player.shoot(worldPoint.x, worldPoint.y);
            }
        });
    }

    update() {
        // Handle movement
        let moveX = 0;
        let moveY = 0;
        
        // Keyboard input
        if (this.cursors.left.isDown || this.wasd.A.isDown) {
            moveX = -1;
        } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
            moveX = 1;
        }
        
        if (this.cursors.up.isDown || this.wasd.W.isDown) {
            moveY = -1;
        } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
            moveY = 1;
        }
        
        // Mobile input override
        if (this.isMobile() || (this.mobileInput.moveX !== 0 || this.mobileInput.moveY !== 0)) {
            moveX = this.mobileInput.moveX;
            moveY = this.mobileInput.moveY;
        }
        
        // Handle sprint/boost
        const isSprinting = this.shiftKey.isDown || this.mobileInput.sprint;
        const speedMultiplier = isSprinting ? 1.5 : 1.0;
        
        // Handle player in car vs on foot
        if (this.player.isInCar && this.player.currentCar) {
            // Car controls
            const car = this.player.currentCar;
            
            if (moveY < 0) {
                car.accelerate(16 * speedMultiplier);
            } else if (moveY > 0) {
                car.brake(16);
            }
            
            if (moveX < 0) {
                car.turnLeft(16);
            } else if (moveX > 0) {
                car.turnRight(16);
            }
        } else {
            // On foot controls
            // Normalize diagonal movement
            if (moveX !== 0 && moveY !== 0) {
                moveX *= 0.707;
                moveY *= 0.707;
            }
            
            // Apply sprint multiplier
            moveX *= speedMultiplier;
            moveY *= speedMultiplier;
            
            this.player.setVelocity(moveX, moveY);
        }
        
        // Handle enter/exit car
        if (Phaser.Input.Keyboard.JustDown(this.enterKey) || this.mobileInput.enterCar) {
            this.handleEnterExitCar();
            this.mobileInput.enterCar = false;
        }
        
        // Handle pause
        if (this.mobileInput.pause) {
            if (this.scene.scene.isPaused()) {
                this.scene.scene.resume();
            } else {
                this.scene.scene.pause();
            }
            this.mobileInput.pause = false;
        }
        
        // Handle shooting
        if (this.spaceKey.isDown || this.mobileInput.shoot) {
            // Auto-aim at nearest enemy when using keyboard/mobile shoot button
            const nearestEnemy = this.findNearestEnemy();
            if (nearestEnemy) {
                this.player.shoot(nearestEnemy.x, nearestEnemy.y);
            } else {
                // Shoot forward
                const angle = this.player.sprite.rotation;
                const targetX = this.player.sprite.x + Math.cos(angle) * 100;
                const targetY = this.player.sprite.y + Math.sin(angle) * 100;
                this.player.shoot(targetX, targetY);
            }
            this.mobileInput.shoot = false;
        }
    }

    handleEnterExitCar() {
        if (this.player.isInCar) {
            // Exit car
            this.player.exitCar();
        } else {
            // Try to enter nearest car
            const nearestCar = this.player.getNearestCar();
            if (nearestCar) {
                this.player.enterCar(nearestCar);
            }
        }
    }

    findNearestEnemy() {
        let nearestEnemy = null;
        let nearestDistance = 400; // Max targeting distance
        
        // Check NPCs
        this.scene.npcs.forEach(npc => {
            if (npc.active && (npc.type === 'npc_police' || npc.type === 'npc_gang')) {
                const distance = Phaser.Math.Distance.Between(
                    this.player.sprite.x, this.player.sprite.y,
                    npc.sprite.x, npc.sprite.y
                );
                
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestEnemy = npc.sprite;
                }
            }
        });
        
        return nearestEnemy;
    }

    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (window.innerWidth <= 768);
    }
}