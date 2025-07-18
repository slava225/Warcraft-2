// Пользовательский интерфейс
export class UI {
    constructor(game) {
        this.game = game;
        this.messages = [];
        this.messageTimer = 0;
    }

    update(deltaTime) {
        // Обновляем сообщения
        for (let i = this.messages.length - 1; i >= 0; i--) {
            this.messages[i].timer -= deltaTime;
            if (this.messages[i].timer <= 0) {
                this.messages.splice(i, 1);
            }
        }
    }

    render(ctx) {
        // Рендерим сообщения
        this.renderMessages(ctx);
    }

    renderMessages(ctx) {
        ctx.save();
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        
        for (let i = 0; i < this.messages.length; i++) {
            const message = this.messages[i];
            const y = 100 + i * 25;
            
            // Фон сообщения
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(this.game.width / 2 - 100, y - 15, 200, 20);
            
            // Текст сообщения
            ctx.fillStyle = message.color || '#ffffff';
            ctx.fillText(message.text, this.game.width / 2, y);
        }
        
        ctx.restore();
    }

    showMessage(text, color = '#ffffff', duration = 3.0) {
        this.messages.push({
            text,
            color,
            timer: duration
        });
    }

    updateSelection() {
        // Обновляем информацию о выделенных объектах
        if (this.game.mobileControls) {
            this.game.mobileControls.update();
        }
    }

    showPauseMenu() {
        const pauseMenu = document.getElementById('pauseMenu');
        if (pauseMenu) {
            pauseMenu.classList.remove('hidden');
        }
    }

    hidePauseMenu() {
        const pauseMenu = document.getElementById('pauseMenu');
        if (pauseMenu) {
            pauseMenu.classList.add('hidden');
        }
    }
}