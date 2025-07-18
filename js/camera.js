// Система камеры
export class Camera {
    constructor(viewportWidth, viewportHeight) {
        this.x = 0;
        this.y = 0;
        this.zoom = 1;
        this.targetZoom = 1;
        this.viewport = {
            width: viewportWidth,
            height: viewportHeight
        };
        
        // Ограничения камеры
        this.bounds = {
            minX: -500,
            maxX: 2500,
            minY: -500,
            maxY: 2500
        };
        
        // Параметры плавности
        this.smoothing = 0.1;
        this.zoomSpeed = 0.1;
        this.minZoom = 0.5;
        this.maxZoom = 3.0;
        
        // Скорость движения
        this.moveSpeed = 300;
    }

    move(deltaX, deltaY) {
        this.x += deltaX / this.zoom;
        this.y += deltaY / this.zoom;
        this.constrainToBounds();
    }

    moveTo(x, y, smooth = false) {
        if (smooth) {
            this.targetX = x;
            this.targetY = y;
        } else {
            this.x = x;
            this.y = y;
            this.constrainToBounds();
        }
    }

    zoom(delta) {
        const oldZoom = this.targetZoom;
        this.targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.targetZoom + delta));
        
        // Корректируем позицию камеры при масштабировании, чтобы масштабирование происходило от центра
        if (this.targetZoom !== oldZoom) {
            const centerX = this.viewport.width / 2;
            const centerY = this.viewport.height / 2;
            
            const worldCenterX = this.screenToWorldX(centerX);
            const worldCenterY = this.screenToWorldY(centerY);
            
            // После применения нового масштаба корректируем позицию
            setTimeout(() => {
                const newScreenCenterX = this.worldToScreenX(worldCenterX);
                const newScreenCenterY = this.worldToScreenY(worldCenterY);
                
                this.x += (centerX - newScreenCenterX) / this.zoom;
                this.y += (centerY - newScreenCenterY) / this.zoom;
                this.constrainToBounds();
            }, 0);
        }
    }

    setZoom(zoom) {
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
        this.targetZoom = this.zoom;
        this.constrainToBounds();
    }

    centerOn(x, y) {
        this.x = x - (this.viewport.width / 2) / this.zoom;
        this.y = y - (this.viewport.height / 2) / this.zoom;
        this.constrainToBounds();
    }

    followEntity(entity, offset = { x: 0, y: 0 }) {
        const entityCenterX = entity.x + entity.width / 2;
        const entityCenterY = entity.y + entity.height / 2;
        
        this.centerOn(entityCenterX + offset.x, entityCenterY + offset.y);
    }

    constrainToBounds() {
        // Учитываем масштаб при ограничении движения
        const scaledViewportWidth = this.viewport.width / this.zoom;
        const scaledViewportHeight = this.viewport.height / this.zoom;
        
        this.x = Math.max(this.bounds.minX, Math.min(this.bounds.maxX - scaledViewportWidth, this.x));
        this.y = Math.max(this.bounds.minY, Math.min(this.bounds.maxY - scaledViewportHeight, this.y));
    }

    setBounds(minX, minY, maxX, maxY) {
        this.bounds = { minX, minY, maxX, maxY };
        this.constrainToBounds();
    }

    setViewport(width, height) {
        this.viewport.width = width;
        this.viewport.height = height;
        this.constrainToBounds();
    }

    // Преобразование координат
    worldToScreenX(worldX) {
        return (worldX - this.x) * this.zoom;
    }

    worldToScreenY(worldY) {
        return (worldY - this.y) * this.zoom;
    }

    worldToScreen(worldX, worldY) {
        return {
            x: this.worldToScreenX(worldX),
            y: this.worldToScreenY(worldY)
        };
    }

    screenToWorldX(screenX) {
        return screenX / this.zoom + this.x;
    }

    screenToWorldY(screenY) {
        return screenY / this.zoom + this.y;
    }

    screenToWorld(screenX, screenY) {
        return {
            x: this.screenToWorldX(screenX),
            y: this.screenToWorldY(screenY)
        };
    }

    // Проверка видимости
    isVisible(x, y, width = 0, height = 0) {
        const screenX = this.worldToScreenX(x);
        const screenY = this.worldToScreenY(y);
        const screenWidth = width * this.zoom;
        const screenHeight = height * this.zoom;
        
        return screenX + screenWidth >= 0 &&
               screenX <= this.viewport.width &&
               screenY + screenHeight >= 0 &&
               screenY <= this.viewport.height;
    }

    getVisibleBounds() {
        return {
            left: this.x,
            top: this.y,
            right: this.x + this.viewport.width / this.zoom,
            bottom: this.y + this.viewport.height / this.zoom
        };
    }

    // Применение трансформации к контексту канваса
    apply(ctx) {
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-this.x, -this.y);
    }

    // Плавное движение и масштабирование
    update(deltaTime) {
        // Плавное масштабирование
        if (Math.abs(this.zoom - this.targetZoom) > 0.01) {
            const zoomDiff = this.targetZoom - this.zoom;
            this.zoom += zoomDiff * this.zoomSpeed;
            this.constrainToBounds();
        }
        
        // Плавное движение к цели (если установлена)
        if (this.targetX !== undefined && this.targetY !== undefined) {
            const distanceX = this.targetX - this.x;
            const distanceY = this.targetY - this.y;
            
            if (Math.abs(distanceX) > 1 || Math.abs(distanceY) > 1) {
                this.x += distanceX * this.smoothing;
                this.y += distanceY * this.smoothing;
                this.constrainToBounds();
            } else {
                this.x = this.targetX;
                this.y = this.targetY;
                this.targetX = undefined;
                this.targetY = undefined;
            }
        }
    }

    // Тряска камеры для эффектов
    shake(intensity = 5, duration = 0.5) {
        this.shakeIntensity = intensity;
        this.shakeDuration = duration;
        this.shakeTimer = 0;
        this.originalX = this.x;
        this.originalY = this.y;
    }

    updateShake(deltaTime) {
        if (this.shakeDuration > 0) {
            this.shakeTimer += deltaTime;
            
            if (this.shakeTimer < this.shakeDuration) {
                const progress = this.shakeTimer / this.shakeDuration;
                const intensity = this.shakeIntensity * (1 - progress);
                
                this.x = this.originalX + (Math.random() - 0.5) * intensity;
                this.y = this.originalY + (Math.random() - 0.5) * intensity;
            } else {
                this.x = this.originalX;
                this.y = this.originalY;
                this.shakeDuration = 0;
                this.shakeIntensity = 0;
            }
        }
    }

    // Анимированный переход к позиции
    panTo(x, y, duration = 1.0, easing = 'easeOutCubic') {
        this.panStartX = this.x;
        this.panStartY = this.y;
        this.panTargetX = x;
        this.panTargetY = y;
        this.panDuration = duration;
        this.panTimer = 0;
        this.panEasing = easing;
        this.isPanning = true;
    }

    updatePan(deltaTime) {
        if (this.isPanning) {
            this.panTimer += deltaTime;
            const progress = Math.min(this.panTimer / this.panDuration, 1);
            
            // Применяем функцию easing
            const easedProgress = this.applyEasing(progress, this.panEasing);
            
            this.x = this.panStartX + (this.panTargetX - this.panStartX) * easedProgress;
            this.y = this.panStartY + (this.panTargetY - this.panStartY) * easedProgress;
            
            if (progress >= 1) {
                this.isPanning = false;
                this.x = this.panTargetX;
                this.y = this.panTargetY;
            }
            
            this.constrainToBounds();
        }
    }

    applyEasing(t, type) {
        switch (type) {
            case 'linear':
                return t;
            case 'easeInCubic':
                return t * t * t;
            case 'easeOutCubic':
                return 1 - Math.pow(1 - t, 3);
            case 'easeInOutCubic':
                return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
            default:
                return t;
        }
    }

    // Полное обновление камеры
    fullUpdate(deltaTime) {
        this.update(deltaTime);
        this.updateShake(deltaTime);
        this.updatePan(deltaTime);
    }

    // Сброс камеры
    reset() {
        this.x = 0;
        this.y = 0;
        this.zoom = 1;
        this.targetZoom = 1;
        this.targetX = undefined;
        this.targetY = undefined;
        this.isPanning = false;
        this.shakeDuration = 0;
    }

    // Сериализация состояния камеры
    serialize() {
        return {
            x: this.x,
            y: this.y,
            zoom: this.zoom
        };
    }

    deserialize(data) {
        this.x = data.x || 0;
        this.y = data.y || 0;
        this.zoom = data.zoom || 1;
        this.targetZoom = this.zoom;
        this.constrainToBounds();
    }
}