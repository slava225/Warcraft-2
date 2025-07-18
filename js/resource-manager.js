// Менеджер ресурсов
export class ResourceManager {
    constructor() {
        this.resources = new Map();
        this.listeners = new Map();
        
        // Инициализируем стандартные ресурсы
        this.setResource('gold', 0);
        this.setResource('wood', 0);
        this.setResource('food', 0);
        this.setResource('maxFood', 0);
    }

    setResource(type, amount) {
        const oldAmount = this.resources.get(type) || 0;
        this.resources.set(type, Math.max(0, amount));
        
        // Уведомляем слушателей об изменении
        this.notifyListeners(type, oldAmount, amount);
    }

    getResource(type) {
        return this.resources.get(type) || 0;
    }

    addResource(type, amount) {
        const currentAmount = this.getResource(type);
        this.setResource(type, currentAmount + amount);
    }

    spendResource(type, amount) {
        const currentAmount = this.getResource(type);
        if (currentAmount >= amount) {
            this.setResource(type, currentAmount - amount);
            return true;
        }
        return false;
    }

    canAfford(costs) {
        for (const [resourceType, cost] of Object.entries(costs)) {
            if (this.getResource(resourceType) < cost) {
                return false;
            }
        }
        return true;
    }

    spendResources(costs) {
        if (!this.canAfford(costs)) {
            return false;
        }
        
        for (const [resourceType, cost] of Object.entries(costs)) {
            this.spendResource(resourceType, cost);
        }
        
        return true;
    }

    // Система событий для уведомления об изменении ресурсов
    addListener(resourceType, callback) {
        if (!this.listeners.has(resourceType)) {
            this.listeners.set(resourceType, []);
        }
        this.listeners.get(resourceType).push(callback);
    }

    removeListener(resourceType, callback) {
        const listeners = this.listeners.get(resourceType);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }
    }

    notifyListeners(resourceType, oldAmount, newAmount) {
        const listeners = this.listeners.get(resourceType);
        if (listeners) {
            for (const callback of listeners) {
                callback(resourceType, oldAmount, newAmount);
            }
        }
    }

    getAllResources() {
        const result = {};
        for (const [type, amount] of this.resources) {
            result[type] = amount;
        }
        return result;
    }

    // Сохранение и загрузка состояния
    serialize() {
        return {
            resources: Object.fromEntries(this.resources)
        };
    }

    deserialize(data) {
        if (data.resources) {
            for (const [type, amount] of Object.entries(data.resources)) {
                this.setResource(type, amount);
            }
        }
    }

    // Вспомогательные методы для игровой логики
    hasEnoughFood() {
        return this.getResource('food') < this.getResource('maxFood');
    }

    getFoodUsage() {
        return this.getResource('food');
    }

    getFoodCapacity() {
        return this.getResource('maxFood');
    }

    isFoodLimitReached() {
        return this.getResource('food') >= this.getResource('maxFood');
    }

    // Формат отображения ресурсов
    formatResource(type, amount = null) {
        if (amount === null) {
            amount = this.getResource(type);
        }
        
        const icons = {
            gold: '🪙',
            wood: '🌲',
            food: '🍖',
            maxFood: '🏠'
        };
        
        const icon = icons[type] || '❓';
        
        if (type === 'food') {
            const maxFood = this.getResource('maxFood');
            return `${icon} ${amount}/${maxFood}`;
        }
        
        return `${icon} ${amount}`;
    }

    // Валидация ресурсов
    isValidResourceType(type) {
        const validTypes = ['gold', 'wood', 'food', 'maxFood'];
        return validTypes.includes(type);
    }

    // Автоматическое пополнение ресурсов (для будущего расширения)
    startAutoIncome(type, amount, interval) {
        const intervalId = setInterval(() => {
            this.addResource(type, amount);
        }, interval);
        
        return intervalId;
    }

    stopAutoIncome(intervalId) {
        clearInterval(intervalId);
    }
}