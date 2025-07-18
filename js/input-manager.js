// Менеджер ввода
export class InputManager {
    constructor(canvas, isMobile = false) {
        this.canvas = canvas;
        this.isMobile = isMobile;
        this.events = new Map();
        this.listeners = new Map();
        
        // Состояние мыши/касания
        this.mousePosition = { x: 0, y: 0 };
        this.isMouseDown = false;
        this.isDragging = false;
        this.dragStart = null;
        this.dragThreshold = 5;
        
        // Состояние клавиатуры
        this.keys = new Set();
        this.keyBindings = new Map();
        
        // Касания
        this.touches = new Map();
        this.lastTouchEnd = 0;
        
        this.init();
    }

    init() {
        this.setupMouseEvents();
        this.setupKeyboardEvents();
        this.setupTouchEvents();
        this.setupDefaultBindings();
    }

    setupMouseEvents() {
        // Движение мыши
        this.canvas.addEventListener('mousemove', (e) => {
            this.updateMousePosition(e);
            
            if (this.isMouseDown && !this.isDragging) {
                const distance = Math.hypot(
                    e.clientX - this.dragStart.x,
                    e.clientY - this.dragStart.y
                );
                
                if (distance > this.dragThreshold) {
                    this.isDragging = true;
                    this.emit('dragstart', {
                        x: this.dragStart.x,
                        y: this.dragStart.y,
                        originalEvent: e
                    });
                }
            }
            
            if (this.isDragging) {
                this.emit('drag', {
                    x: e.clientX,
                    y: e.clientY,
                    deltaX: e.movementX,
                    deltaY: e.movementY,
                    originalEvent: e
                });
            }
        });

        // Нажатие мыши
        this.canvas.addEventListener('mousedown', (e) => {
            this.isMouseDown = true;
            this.dragStart = { x: e.clientX, y: e.clientY };
            this.updateMousePosition(e);
            
            // Предотвращаем контекстное меню на правой кнопке
            if (e.button === 2) {
                e.preventDefault();
            }
        });

        // Отпускание мыши
        document.addEventListener('mouseup', (e) => {
            if (this.isMouseDown) {
                this.updateMousePosition(e);
                
                if (this.isDragging) {
                    this.emit('dragend', {
                        x: e.clientX,
                        y: e.clientY,
                        originalEvent: e
                    });
                    this.isDragging = false;
                } else {
                    // Обычный клик
                    if (e.button === 0) {
                        this.emit('click', {
                            x: e.clientX - this.canvas.offsetLeft,
                            y: e.clientY - this.canvas.offsetTop,
                            ctrlKey: e.ctrlKey,
                            shiftKey: e.shiftKey,
                            altKey: e.altKey,
                            originalEvent: e
                        });
                    } else if (e.button === 2) {
                        this.emit('rightclick', {
                            x: e.clientX - this.canvas.offsetLeft,
                            y: e.clientY - this.canvas.offsetTop,
                            ctrlKey: e.ctrlKey,
                            shiftKey: e.shiftKey,
                            altKey: e.altKey,
                            originalEvent: e
                        });
                    }
                }
                
                this.isMouseDown = false;
                this.dragStart = null;
            }
        });

        // Колесо мыши для масштабирования
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            this.emit('zoom', {
                delta,
                x: e.clientX - this.canvas.offsetLeft,
                y: e.clientY - this.canvas.offsetTop,
                originalEvent: e
            });
        }, { passive: false });

        // Отключаем контекстное меню
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }

    setupKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            this.keys.add(e.code);
            
            // Проверяем привязки клавиш
            const binding = this.keyBindings.get(e.code);
            if (binding) {
                e.preventDefault();
                this.emit(binding.event, binding.data);
            }
            
            this.emit('keydown', {
                code: e.code,
                key: e.key,
                ctrlKey: e.ctrlKey,
                shiftKey: e.shiftKey,
                altKey: e.altKey,
                originalEvent: e
            });
        });

        document.addEventListener('keyup', (e) => {
            this.keys.delete(e.code);
            
            this.emit('keyup', {
                code: e.code,
                key: e.key,
                originalEvent: e
            });
        });
    }

    setupTouchEvents() {
        if (!this.isMobile) return;

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            
            for (const touch of e.touches) {
                this.touches.set(touch.identifier, {
                    x: touch.clientX,
                    y: touch.clientY,
                    startX: touch.clientX,
                    startY: touch.clientY,
                    startTime: Date.now()
                });
            }
            
            if (e.touches.length === 1) {
                const touch = e.touches[0];
                this.mousePosition.x = touch.clientX - this.canvas.offsetLeft;
                this.mousePosition.y = touch.clientY - this.canvas.offsetTop;
            }
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            
            if (e.touches.length === 1) {
                const touch = e.touches[0];
                const stored = this.touches.get(touch.identifier);
                
                if (stored) {
                    const deltaX = touch.clientX - stored.x;
                    const deltaY = touch.clientY - stored.y;
                    
                    this.emit('pan', {
                        deltaX,
                        deltaY,
                        originalEvent: e
                    });
                    
                    stored.x = touch.clientX;
                    stored.y = touch.clientY;
                }
            } else if (e.touches.length === 2) {
                // Жест масштабирования
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                const distance = Math.hypot(
                    touch1.clientX - touch2.clientX,
                    touch1.clientY - touch2.clientY
                );
                
                if (this.lastPinchDistance) {
                    const delta = (distance - this.lastPinchDistance) * 0.01;
                    this.emit('zoom', {
                        delta,
                        x: (touch1.clientX + touch2.clientX) / 2 - this.canvas.offsetLeft,
                        y: (touch1.clientY + touch2.clientY) / 2 - this.canvas.offsetTop,
                        originalEvent: e
                    });
                }
                
                this.lastPinchDistance = distance;
            }
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            
            // Обрабатываем завершенные касания
            for (const touch of e.changedTouches) {
                const stored = this.touches.get(touch.identifier);
                
                if (stored) {
                    const duration = Date.now() - stored.startTime;
                    const distance = Math.hypot(
                        touch.clientX - stored.startX,
                        touch.clientY - stored.startY
                    );
                    
                    // Если это был короткий тап без движения
                    if (duration < 500 && distance < this.dragThreshold) {
                        // Предотвращаем двойной тап на масштабирование
                        const now = Date.now();
                        if (now - this.lastTouchEnd <= 300) {
                            return;
                        }
                        this.lastTouchEnd = now;
                        
                        this.emit('click', {
                            x: touch.clientX - this.canvas.offsetLeft,
                            y: touch.clientY - this.canvas.offsetTop,
                            originalEvent: e
                        });
                    }
                }
                
                this.touches.delete(touch.identifier);
            }
            
            if (e.touches.length < 2) {
                this.lastPinchDistance = null;
            }
        }, { passive: false });
    }

    setupDefaultBindings() {
        // Стандартные привязки клавиш
        this.bindKey('Space', 'pause');
        this.bindKey('Escape', 'menu');
        this.bindKey('KeyH', 'home');
        this.bindKey('Delete', 'delete');
        this.bindKey('KeyS', 'stop');
        this.bindKey('KeyA', 'attack');
        this.bindKey('KeyM', 'move');
        
        // Цифры для групп юнитов
        for (let i = 1; i <= 9; i++) {
            this.bindKey(`Digit${i}`, 'selectGroup', { group: i });
        }
        
        // Клавиши строительства
        this.bindKey('KeyB', 'build', { building: 'barracks' });
        this.bindKey('KeyF', 'build', { building: 'farm' });
        this.bindKey('KeyT', 'build', { building: 'townhall' });
        this.bindKey('KeyL', 'build', { building: 'lumber' });
    }

    updateMousePosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mousePosition.x = e.clientX - rect.left;
        this.mousePosition.y = e.clientY - rect.top;
    }

    // Система событий
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        const listeners = this.listeners.get(event);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }
    }

    emit(event, data = {}) {
        const listeners = this.listeners.get(event);
        if (listeners) {
            for (const callback of listeners) {
                callback(data);
            }
        }
    }

    // Привязка клавиш
    bindKey(keyCode, event, data = {}) {
        this.keyBindings.set(keyCode, { event, data });
    }

    unbindKey(keyCode) {
        this.keyBindings.delete(keyCode);
    }

    // Проверка состояния клавиш
    isKeyPressed(keyCode) {
        return this.keys.has(keyCode);
    }

    isKeyComboPressed(...keyCodes) {
        return keyCodes.every(keyCode => this.keys.has(keyCode));
    }

    // Получение позиции мыши
    getMousePosition() {
        return { ...this.mousePosition };
    }

    // Симуляция клика (для мобильных контролов)
    simulateClick(x, y, button = 0) {
        const event = button === 0 ? 'click' : 'rightclick';
        this.emit(event, {
            x,
            y,
            simulated: true
        });
    }

    // Симуляция нажатия клавиши
    simulateKeyPress(keyCode, event = null, data = {}) {
        if (event) {
            this.emit(event, data);
        } else {
            const binding = this.keyBindings.get(keyCode);
            if (binding) {
                this.emit(binding.event, binding.data);
            }
        }
    }

    // Обновление (вызывается каждый кадр)
    update() {
        // Обработка удерживаемых клавиш
        if (this.isKeyPressed('ArrowLeft') || this.isKeyPressed('KeyA')) {
            this.emit('cameramove', { direction: 'left' });
        }
        if (this.isKeyPressed('ArrowRight') || this.isKeyPressed('KeyD')) {
            this.emit('cameramove', { direction: 'right' });
        }
        if (this.isKeyPressed('ArrowUp') || this.isKeyPressed('KeyW')) {
            this.emit('cameramove', { direction: 'up' });
        }
        if (this.isKeyPressed('ArrowDown') || this.isKeyPressed('KeyS')) {
            this.emit('cameramove', { direction: 'down' });
        }
    }

    // Очистка состояния
    clear() {
        this.keys.clear();
        this.touches.clear();
        this.isMouseDown = false;
        this.isDragging = false;
        this.dragStart = null;
    }

    // Включение/отключение ввода
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.clear();
        }
    }

    // Получение информации о поддержке касаний
    touchSupported() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    // Настройка чувствительности
    setDragThreshold(threshold) {
        this.dragThreshold = threshold;
    }

    // Отладочная информация
    getDebugInfo() {
        return {
            mousePosition: this.mousePosition,
            isMouseDown: this.isMouseDown,
            isDragging: this.isDragging,
            keysPressed: Array.from(this.keys),
            touchCount: this.touches.size,
            isMobile: this.isMobile
        };
    }
}