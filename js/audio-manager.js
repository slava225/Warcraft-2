// Менеджер аудио
export class AudioManager {
    constructor() {
        this.sounds = new Map();
        this.music = null;
        this.masterVolume = 1.0;
        this.musicVolume = 0.5;
        this.sfxVolume = 0.7;
        this.enabled = true;
        
        // Создаем аудио контекст
        this.audioContext = null;
        this.initializeAudioContext();
    }

    initializeAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.warn('Аудио контекст не поддерживается:', error);
            this.enabled = false;
        }
    }

    async loadSound(name, url) {
        if (!this.enabled) return;
        
        try {
            const audio = new Audio(url);
            audio.volume = this.sfxVolume * this.masterVolume;
            this.sounds.set(name, audio);
        } catch (error) {
            console.warn(`Не удалось загрузить звук ${name}:`, error);
        }
    }

    async loadMusic(url) {
        if (!this.enabled) return;
        
        try {
            this.music = new Audio(url);
            this.music.loop = true;
            this.music.volume = this.musicVolume * this.masterVolume;
        } catch (error) {
            console.warn('Не удалось загрузить музыку:', error);
        }
    }

    playSound(name, volume = 1.0) {
        if (!this.enabled || !this.sounds.has(name)) return;
        
        try {
            const sound = this.sounds.get(name).cloneNode();
            sound.volume = volume * this.sfxVolume * this.masterVolume;
            sound.play().catch(e => console.warn('Ошибка воспроизведения звука:', e));
        } catch (error) {
            console.warn(`Ошибка воспроизведения звука ${name}:`, error);
        }
    }

    playMusic() {
        if (!this.enabled || !this.music) return;
        
        try {
            this.music.play().catch(e => console.warn('Ошибка воспроизведения музыки:', e));
        } catch (error) {
            console.warn('Ошибка воспроизведения музыки:', error);
        }
    }

    stopMusic() {
        if (this.music) {
            this.music.pause();
            this.music.currentTime = 0;
        }
    }

    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        this.updateVolumes();
    }

    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.music) {
            this.music.volume = this.musicVolume * this.masterVolume;
        }
    }

    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        this.updateVolumes();
    }

    updateVolumes() {
        for (const sound of this.sounds.values()) {
            sound.volume = this.sfxVolume * this.masterVolume;
        }
        
        if (this.music) {
            this.music.volume = this.musicVolume * this.masterVolume;
        }
    }

    mute() {
        this.enabled = false;
        this.stopMusic();
    }

    unmute() {
        this.enabled = true;
        if (this.music && !this.music.paused) {
            this.playMusic();
        }
    }
}