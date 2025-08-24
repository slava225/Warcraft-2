// Mobile Controls class - virtual joystick and buttons
export class MobileControls {
    constructor() {
        this.joystick = null;
        this.joystickBase = null;
        this.joystickStick = null;
        this.shootButton = null;
        this.enterCarButton = null;
        this.sprintButton = null;
        this.pauseButton = null;
        
        this.isActive = false;
        this.joystickData = {
            isDown: false,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0
        };
        
        this.onInput = null; // Callback for input changes
        
        this.init();
    }

    init() {
        // Check if we're on mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                        (window.innerWidth <= 768);
        
        if (!isMobile) {
            return;
        }
        
        this.isActive = true;
        
        // Get DOM elements
        this.joystickBase = document.getElementById('joystick-base');
        this.joystickStick = document.getElementById('joystick-stick');
        this.shootButton = document.getElementById('shoot-btn');
        this.enterCarButton = document.getElementById('enter-car-btn');
        this.sprintButton = document.getElementById('sprint-btn');
        this.pauseButton = document.getElementById('pause-btn');
        
        if (!this.joystickBase || !this.joystickStick) {
            return;
        }
        
        // Setup joystick
        this.setupJoystick();
        
        // Setup buttons
        this.setupButtons();
    }

    setupJoystick() {
        const container = document.getElementById('joystick-container');
        if (!container) return;
        
        // Touch start
        container.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.joystickBase.getBoundingClientRect();
            
            this.joystickData.isDown = true;
            this.joystickData.startX = rect.left + rect.width / 2;
            this.joystickData.startY = rect.top + rect.height / 2;
            
            this.handleJoystickMove(touch.clientX, touch.clientY);
        });
        
        // Touch move
        container.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.joystickData.isDown) {
                const touch = e.touches[0];
                this.handleJoystickMove(touch.clientX, touch.clientY);
            }
        });
        
        // Touch end
        container.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.joystickData.isDown = false;
            this.resetJoystick();
        });
        
        // Mouse controls for testing on desktop
        container.addEventListener('mousedown', (e) => {
            e.preventDefault();
            const rect = this.joystickBase.getBoundingClientRect();
            
            this.joystickData.isDown = true;
            this.joystickData.startX = rect.left + rect.width / 2;
            this.joystickData.startY = rect.top + rect.height / 2;
            
            this.handleJoystickMove(e.clientX, e.clientY);
        });
        
        document.addEventListener('mousemove', (e) => {
            if (this.joystickData.isDown) {
                e.preventDefault();
                this.handleJoystickMove(e.clientX, e.clientY);
            }
        });
        
        document.addEventListener('mouseup', (e) => {
            if (this.joystickData.isDown) {
                e.preventDefault();
                this.joystickData.isDown = false;
                this.resetJoystick();
            }
        });
    }

    handleJoystickMove(clientX, clientY) {
        const deltaX = clientX - this.joystickData.startX;
        const deltaY = clientY - this.joystickData.startY;
        
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const maxDistance = 70; // Maximum joystick movement radius
        
        let normalizedX = deltaX;
        let normalizedY = deltaY;
        
        if (distance > maxDistance) {
            const angle = Math.atan2(deltaY, deltaX);
            normalizedX = Math.cos(angle) * maxDistance;
            normalizedY = Math.sin(angle) * maxDistance;
        }
        
        // Update stick position
        this.joystickStick.style.transform = `translate(${normalizedX}px, ${normalizedY}px)`;
        
        // Calculate input values (-1 to 1)
        const inputX = normalizedX / maxDistance;
        const inputY = normalizedY / maxDistance;
        
        // Send input to game
        if (this.onInput) {
            this.onInput({
                moveX: inputX,
                moveY: inputY,
                shoot: false,
                enterCar: false
            });
        }
    }

    resetJoystick() {
        this.joystickStick.style.transform = 'translate(0px, 0px)';
        
        if (this.onInput) {
            this.onInput({
                moveX: 0,
                moveY: 0,
                shoot: false,
                enterCar: false
            });
        }
    }

    setupButtons() {
        // Shoot button
        if (this.shootButton) {
            this.shootButton.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (this.onInput) {
                    const currentInput = this.getCurrentInput();
                    currentInput.shoot = true;
                    this.onInput(currentInput);
                }
            });
            
            this.shootButton.addEventListener('mousedown', (e) => {
                e.preventDefault();
                if (this.onInput) {
                    const currentInput = this.getCurrentInput();
                    currentInput.shoot = true;
                    this.onInput(currentInput);
                }
            });
        }
        
        // Enter car button
        if (this.enterCarButton) {
            this.enterCarButton.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (this.onInput) {
                    const currentInput = this.getCurrentInput();
                    currentInput.enterCar = true;
                    this.onInput(currentInput);
                }
            });
            
            this.enterCarButton.addEventListener('mousedown', (e) => {
                e.preventDefault();
                if (this.onInput) {
                    const currentInput = this.getCurrentInput();
                    currentInput.enterCar = true;
                    this.onInput(currentInput);
                }
            });
        }
        
        // Sprint button
        if (this.sprintButton) {
            const handleSprintStart = (e) => {
                e.preventDefault();
                if (this.onInput) {
                    const currentInput = this.getCurrentInput();
                    currentInput.sprint = true;
                    this.onInput(currentInput);
                }
            };
            
            const handleSprintEnd = (e) => {
                e.preventDefault();
                if (this.onInput) {
                    const currentInput = this.getCurrentInput();
                    currentInput.sprint = false;
                    this.onInput(currentInput);
                }
            };
            
            this.sprintButton.addEventListener('touchstart', handleSprintStart);
            this.sprintButton.addEventListener('touchend', handleSprintEnd);
            this.sprintButton.addEventListener('mousedown', handleSprintStart);
            this.sprintButton.addEventListener('mouseup', handleSprintEnd);
        }
        
        // Pause button
        if (this.pauseButton) {
            this.pauseButton.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (this.onInput) {
                    const currentInput = this.getCurrentInput();
                    currentInput.pause = true;
                    this.onInput(currentInput);
                }
            });
            
            this.pauseButton.addEventListener('mousedown', (e) => {
                e.preventDefault();
                if (this.onInput) {
                    const currentInput = this.getCurrentInput();
                    currentInput.pause = true;
                    this.onInput(currentInput);
                }
            });
        }
    }

    getCurrentInput() {
        // Get current joystick position
        const transform = this.joystickStick.style.transform;
        const match = transform.match(/translate\((-?\d+(?:\.\d+)?)px,\s*(-?\d+(?:\.\d+)?)px\)/);
        
        let moveX = 0;
        let moveY = 0;
        
        if (match) {
            moveX = parseFloat(match[1]) / 50; // 50 is max distance
            moveY = parseFloat(match[2]) / 50;
        }
        
        return {
            moveX: moveX,
            moveY: moveY,
            shoot: false,
            enterCar: false,
            sprint: false,
            pause: false
        };
    }
}