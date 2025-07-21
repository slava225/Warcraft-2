// Генератор звуковых эффектов
export class SoundGenerator {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.sounds = new Map();
    }

    // Создает простой звуковой эффект
    createSound(type, options = {}) {
        if (!this.audioContext) return null;

        const frequency = options.frequency || 440;
        const duration = options.duration || 0.2;
        const volume = options.volume || 0.3;

        return () => {
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            switch (type) {
                case 'attack':
                    this.createAttackSound(oscillator, gainNode, duration, volume);
                    break;
                case 'build':
                    this.createBuildSound(oscillator, gainNode, duration, volume);
                    break;
                case 'select':
                    this.createSelectSound(oscillator, gainNode, duration, volume);
                    break;
                case 'move':
                    this.createMoveSound(oscillator, gainNode, duration, volume);
                    break;
                case 'gather':
                    this.createGatherSound(oscillator, gainNode, duration, volume);
                    break;
                default:
                    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                    oscillator.type = 'sine';
                    break;
            }

            const now = this.audioContext.currentTime;
            gainNode.gain.setValueAtTime(volume, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

            oscillator.start(now);
            oscillator.stop(now + duration);
        };
    }

    createAttackSound(oscillator, gainNode, duration, volume) {
        // Звук атаки - низкочастотный удар
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(80, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(40, this.audioContext.currentTime + duration);
    }

    createBuildSound(oscillator, gainNode, duration, volume) {
        // Звук строительства - молоток
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
        
        // Создаем ритм молотка
        const now = this.audioContext.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.setValueAtTime(volume, now + 0.05);
        gainNode.gain.setValueAtTime(0, now + 0.1);
        gainNode.gain.setValueAtTime(volume, now + 0.15);
        gainNode.gain.setValueAtTime(0, now + duration);
    }

    createSelectSound(oscillator, gainNode, duration, volume) {
        // Звук выделения - короткий сигнал
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + duration);
    }

    createMoveSound(oscillator, gainNode, duration, volume) {
        // Звук движения - низкий гул
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(120, this.audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(100, this.audioContext.currentTime + duration);
    }

    createGatherSound(oscillator, gainNode, duration, volume) {
        // Звук сбора ресурсов - металлический звон
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + duration);
    }

    // Создает все необходимые звуки для игры
    generateGameSounds() {
        const sounds = {
            attack: this.createSound('attack', { duration: 0.3, volume: 0.4 }),
            build: this.createSound('build', { duration: 0.4, volume: 0.3 }),
            select: this.createSound('select', { duration: 0.15, volume: 0.3 }),
            move: this.createSound('move', { duration: 0.2, volume: 0.2 }),
            gather: this.createSound('gather', { duration: 0.25, volume: 0.3 })
        };

        // Сохраняем в кеш
        Object.keys(sounds).forEach(key => {
            this.sounds.set(key, sounds[key]);
        });

        return sounds;
    }

    // Воспроизводит звук
    playSound(name) {
        const sound = this.sounds.get(name);
        if (sound) {
            try {
                sound();
            } catch (error) {
                console.warn('Ошибка воспроизведения звука:', error);
            }
        }
    }
}