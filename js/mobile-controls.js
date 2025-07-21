// Мобильное управление для игры
export class MobileControls {
    constructor(game) {
        this.game = game;
        this.joystick = null;
        this.joystickHandle = null;
        this.joystickActive = false;
        this.joystickCenter = { x: 0, y: 0 };
        this.joystickInput = { x: 0, y: 0 };
        
        this.init();
    }

    init() {
        this.setupJoystick();
        this.setupButtons();
        this.setupTouchEvents();
    }

    setupJoystick() {
        this.joystick = document.getElementById('joystick');
        this.joystickHandle = document.getElementById('joystickHandle');
        
        if (!this.joystick || !this.joystickHandle) return;
        
        const rect = this.joystick.getBoundingClientRect();
        this.joystickCenter = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
        
        // Touch события для джойстика
        this.joystick.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startJoystick(e.touches[0]);
        }, { passive: false });
        
        document.addEventListener('touchmove', (e) => {
            if (this.joystickActive) {
                e.preventDefault();
                this.updateJoystick(e.touches[0]);
            }
        }, { passive: false });
        
        document.addEventListener('touchend', (e) => {
            if (this.joystickActive) {
                this.endJoystick();
            }
        });
        
        // Mouse события для тестирования на ПК
        this.joystick.addEventListener('mousedown', (e) => {
            this.startJoystick(e);
        });
        
        document.addEventListener('mousemove', (e) => {
            if (this.joystickActive) {
                this.updateJoystick(e);
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (this.joystickActive) {
                this.endJoystick();
            }
        });
    }

    startJoystick(pointer) {
        this.joystickActive = true;
        this.updateJoystickCenter();
        this.updateJoystick(pointer);
    }

    updateJoystick(pointer) {
        const deltaX = pointer.clientX - this.joystickCenter.x;
        const deltaY = pointer.clientY - this.joystickCenter.y;
        const distance = Math.hypot(deltaX, deltaY);
        const maxDistance = 25; // Максимальное расстояние от центра
        
        if (distance <= maxDistance) {
            this.joystickInput.x = deltaX / maxDistance;
            this.joystickInput.y = deltaY / maxDistance;
            this.joystickHandle.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        } else {
            const angle = Math.atan2(deltaY, deltaX);
            this.joystickInput.x = Math.cos(angle);
            this.joystickInput.y = Math.sin(angle);
            this.joystickHandle.style.transform = `translate(${Math.cos(angle) * maxDistance}px, ${Math.sin(angle) * maxDistance}px)`;
        }
        
        // Управление камерой с помощью джойстика
        this.handleCameraMovement();
    }

    endJoystick() {
        this.joystickActive = false;
        this.joystickInput = { x: 0, y: 0 };
        this.joystickHandle.style.transform = 'translate(0px, 0px)';
    }

    updateJoystickCenter() {
        const rect = this.joystick.getBoundingClientRect();
        this.joystickCenter = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    }

    handleCameraMovement() {
        if (Math.abs(this.joystickInput.x) > 0.1 || Math.abs(this.joystickInput.y) > 0.1) {
            const speed = 300; // Скорость движения камеры
            this.game.camera.move(
                this.joystickInput.x * speed * this.game.deltaTime,
                this.joystickInput.y * speed * this.game.deltaTime
            );
        }
    }

    setupButtons() {
        // Кнопки строительства
        const buildButtons = document.querySelectorAll('.build-btn');
        buildButtons.forEach(button => {
            button.addEventListener('click', () => {
                const buildingType = button.dataset.building;
                this.handleBuildCommand(buildingType);
            });
            
            // Добавляем тактильную обратную связь
            button.addEventListener('touchstart', () => {
                this.vibrate(50);
            });
        });
        
        // Кнопки юнитов
        const unitButtons = document.querySelectorAll('.unit-btn');
        unitButtons.forEach(button => {
            button.addEventListener('click', () => {
                const unitType = button.dataset.unit;
                this.handleUnitCommand(unitType);
            });
            
            button.addEventListener('touchstart', () => {
                this.vibrate(50);
            });
        });
        
        // Кнопки действий
        const attackBtn = document.getElementById('attackBtn');
        if (attackBtn) {
            attackBtn.addEventListener('click', () => {
                this.setActionMode('attack');
            });
        }
        
        const stopBtn = document.getElementById('stopBtn');
        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                this.handleStopCommand();
            });
        }
        
        const moveBtn = document.getElementById('moveBtn');
        if (moveBtn) {
            moveBtn.addEventListener('click', () => {
                this.setActionMode('move');
            });
        }
        
        const enemyBtn = document.getElementById('enemyBtn');
        if (enemyBtn) {
            enemyBtn.addEventListener('click', () => {
                this.createEnemy();
            });
        }
        
        const gatherBtn = document.getElementById('gatherBtn');
        if (gatherBtn) {
            gatherBtn.addEventListener('click', () => {
                this.setActionMode('gather');
            });
        }
        
        const buildModeBtn = document.getElementById('buildModeBtn');
        if (buildModeBtn) {
            buildModeBtn.addEventListener('click', () => {
                this.toggleBuildMode();
            });
        }
    }

    setupTouchEvents() {
        const canvas = this.game.canvas;
        
        // Обработка касаний на канвасе
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (e.touches.length === 1) {
                this.handleTouchStart(e.touches[0]);
            } else if (e.touches.length === 2) {
                this.handlePinchStart(e.touches);
            }
        }, { passive: false });
        
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (e.touches.length === 1) {
                this.handleTouchMove(e.touches[0]);
            } else if (e.touches.length === 2) {
                this.handlePinchMove(e.touches);
            }
        }, { passive: false });
        
        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleTouchEnd(e);
        }, { passive: false });
    }

    handleTouchStart(touch) {
        this.lastTouch = {
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now()
        };
        this.isDragging = false;
    }

    handleTouchMove(touch) {
        if (!this.lastTouch) return;
        
        const deltaX = touch.clientX - this.lastTouch.x;
        const deltaY = touch.clientY - this.lastTouch.y;
        const distance = Math.hypot(deltaX, deltaY);
        
        if (distance > 10) {
            this.isDragging = true;
            // Панорамирование камеры
            this.game.camera.move(-deltaX, -deltaY);
            this.lastTouch.x = touch.clientX;
            this.lastTouch.y = touch.clientY;
        }
    }

    handleTouchEnd(e) {
        if (!this.lastTouch) return;
        
        const touchDuration = Date.now() - this.lastTouch.time;
        
        if (!this.isDragging && touchDuration < 500) {
            // Короткое касание - клик
            const rect = this.game.canvas.getBoundingClientRect();
            const x = this.lastTouch.x - rect.left;
            const y = this.lastTouch.y - rect.top;
            
            // Если режим сбора ресурсов, симулируем правый клик
            if (this.actionMode === 'gather') {
                this.game.inputManager.simulateRightClick(x, y);
            } else {
                this.game.inputManager.simulateClick(x, y);
            }
        }
        
        this.lastTouch = null;
        this.isDragging = false;
    }

    handlePinchStart(touches) {
        this.pinchStart = {
            distance: this.getDistance(touches[0], touches[1]),
            center: this.getCenter(touches[0], touches[1])
        };
    }

    handlePinchMove(touches) {
        if (!this.pinchStart) return;
        
        const currentDistance = this.getDistance(touches[0], touches[1]);
        const scale = currentDistance / this.pinchStart.distance;
        
        // Масштабирование
        if (scale > 1.1) {
            this.game.camera.zoom(0.1);
            this.pinchStart.distance = currentDistance;
        } else if (scale < 0.9) {
            this.game.camera.zoom(-0.1);
            this.pinchStart.distance = currentDistance;
        }
    }

    getDistance(touch1, touch2) {
        return Math.hypot(
            touch1.clientX - touch2.clientX,
            touch1.clientY - touch2.clientY
        );
    }

    getCenter(touch1, touch2) {
        return {
            x: (touch1.clientX + touch2.clientX) / 2,
            y: (touch1.clientY + touch2.clientY) / 2
        };
    }

    handleBuildCommand(buildingType) {
        if (this.game.buildMode === buildingType) {
            this.game.exitBuildMode();
        } else {
            this.game.enterBuildMode(buildingType);
        }
        
        this.updateBuildButtons();
    }

    handleUnitCommand(unitType) {
        if (this.game.selectedBuilding) {
            this.game.createUnit(unitType, this.game.selectedBuilding);
        }
    }

    handleStopCommand() {
        for (const unit of this.game.selectedUnits) {
            unit.stop();
        }
    }

    setActionMode(mode) {
        this.actionMode = mode;
        this.updateActionButtons();
        
        // Изменяем курсор в зависимости от режима
        switch (mode) {
            case 'attack':
                this.game.canvas.style.cursor = 'crosshair';
                break;
            case 'move':
                this.game.canvas.style.cursor = 'move';
                break;
            default:
                this.game.canvas.style.cursor = 'default';
                break;
        }
    }

    updateBuildButtons() {
        const buildButtons = document.querySelectorAll('.build-btn');
        buildButtons.forEach(button => {
            const buildingType = button.dataset.building;
            if (buildingType === this.game.buildMode) {
                button.classList.add('selected');
            } else {
                button.classList.remove('selected');
            }
        });
    }

    updateActionButtons() {
        const actionButtons = document.querySelectorAll('#actionButtons button');
        actionButtons.forEach(button => {
            button.classList.remove('selected');
        });
        
        if (this.actionMode) {
            const activeButton = document.getElementById(this.actionMode + 'Btn');
            if (activeButton) {
                activeButton.classList.add('selected');
            }
        }
    }

    updateResourceDisplay() {
        const goldElement = document.getElementById('gold');
        const woodElement = document.getElementById('wood');
        const foodElement = document.getElementById('food');
        
        if (goldElement) {
            goldElement.textContent = `🪙 ${this.game.resourceManager.getResource('gold')}`;
        }
        
        if (woodElement) {
            woodElement.textContent = `🌲 ${this.game.resourceManager.getResource('wood')}`;
        }
        
        if (foodElement) {
            const food = this.game.resourceManager.getResource('food');
            const maxFood = this.game.resourceManager.getResource('maxFood');
            foodElement.textContent = `🍖 ${food}/${maxFood}`;
        }
    }

    updateSelectedUnitInfo() {
        const selectedUnitElement = document.getElementById('selectedUnit');
        if (!selectedUnitElement) return;
        
        if (this.game.selectedUnits.size > 0) {
            const unit = Array.from(this.game.selectedUnits)[0];
            selectedUnitElement.innerHTML = `
                <div class="unit-info">
                    <div class="unit-name">${this.getUnitName(unit.type)}</div>
                    <div class="unit-hp">${unit.hp}/${unit.maxHp} HP</div>
                </div>
            `;
        } else if (this.game.selectedBuilding) {
            const building = this.game.selectedBuilding;
            selectedUnitElement.innerHTML = `
                <div class="building-info">
                    <div class="building-name">${this.getBuildingName(building.type)}</div>
                    <div class="building-hp">${building.hp}/${building.maxHp} HP</div>
                </div>
            `;
        } else {
            selectedUnitElement.innerHTML = '';
        }
    }

    getUnitName(type) {
        const names = {
            peasant: 'Крестьянин',
            footman: 'Пехотинец',
            archer: 'Лучник',
            knight: 'Рыцарь'
        };
        return names[type] || type;
    }

    getBuildingName(type) {
        const names = {
            townhall: 'Ратуша',
            barracks: 'Казарма',
            farm: 'Ферма',
            lumber: 'Лесопилка'
        };
        return names[type] || type;
    }

    vibrate(duration) {
        if (navigator.vibrate) {
            navigator.vibrate(duration);
        }
    }

    update() {
        this.updateResourceDisplay();
        this.updateSelectedUnitInfo();
        
        // Обновляем доступность кнопок
        this.updateButtonAvailability();
    }

    updateButtonAvailability() {
        // Обновляем кнопки строительства
        const buildButtons = document.querySelectorAll('.build-btn');
        buildButtons.forEach(button => {
            const buildingType = button.dataset.building;
            const ghost = this.game.createBuildingGhost(buildingType);
            const canAfford = this.game.resourceManager.canAfford(ghost.cost);
            
            button.disabled = !canAfford;
        });
        
        // Обновляем кнопки юнитов
        const unitButtons = document.querySelectorAll('.unit-btn');
        unitButtons.forEach(button => {
            const unitType = button.dataset.unit;
            button.disabled = !this.game.selectedBuilding;
        });
    }

    createEnemy() {
        if (this.game.multiplayer && this.game.multiplayer.createLobby) {
            this.game.multiplayer.createLobby();
            this.vibrate(100);
        }
    }

    toggleBuildMode() {
        const buildButtons = document.getElementById('buildingButtons');
        if (buildButtons) {
            buildButtons.style.display = buildButtons.style.display === 'none' ? 'grid' : 'none';
        }
        this.vibrate(50);
    }
}