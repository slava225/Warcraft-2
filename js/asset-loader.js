// Загрузчик ресурсов для игры
export class AssetLoader {
    constructor() {
        this.assets = new Map();
        this.loadedAssets = new Map();
        this.loadingPromises = new Map();
    }

    async load(path) {
        // Если ресурс уже загружен, возвращаем его
        if (this.loadedAssets.has(path)) {
            return this.loadedAssets.get(path);
        }

        // Если ресурс уже загружается, ждем завершения
        if (this.loadingPromises.has(path)) {
            return this.loadingPromises.get(path);
        }

        // Определяем тип ресурса по расширению
        const extension = path.split('.').pop().toLowerCase();
        let loadPromise;

        switch (extension) {
            case 'png':
            case 'jpg':
            case 'jpeg':
            case 'gif':
            case 'webp':
                loadPromise = this.loadImage(path);
                break;
            case 'mp3':
            case 'wav':
            case 'ogg':
                loadPromise = this.loadAudio(path);
                break;
            case 'json':
                loadPromise = this.loadJSON(path);
                break;
            default:
                loadPromise = this.loadText(path);
                break;
        }

        this.loadingPromises.set(path, loadPromise);

        try {
            const asset = await loadPromise;
            this.loadedAssets.set(path, asset);
            this.loadingPromises.delete(path);
            return asset;
        } catch (error) {
            this.loadingPromises.delete(path);
            console.warn(`Не удалось загрузить ресурс: ${path}`, error);
            // Возвращаем заглушку в зависимости от типа
            return this.createFallback(extension);
        }
    }

    async loadImage(path) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load image: ${path}`));
            img.src = path;
        });
    }

    async loadAudio(path) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.addEventListener('canplaythrough', () => resolve(audio), false);
            audio.addEventListener('error', () => reject(new Error(`Failed to load audio: ${path}`)), false);
            audio.src = path;
        });
    }

    async loadJSON(path) {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`Failed to load JSON: ${path}`);
        }
        return response.json();
    }

    async loadText(path) {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`Failed to load text: ${path}`);
        }
        return response.text();
    }

    createFallback(extension) {
        switch (extension) {
            case 'png':
            case 'jpg':
            case 'jpeg':
            case 'gif':
            case 'webp':
                return this.createPlaceholderImage();
            case 'mp3':
            case 'wav':
            case 'ogg':
                return this.createSilentAudio();
            case 'json':
                return {};
            default:
                return '';
        }
    }

    createPlaceholderImage() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // Создаем простую заглушку - шахматная доска
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                ctx.fillStyle = (x + y) % 2 === 0 ? '#ff00ff' : '#ffffff';
                ctx.fillRect(x * 8, y * 8, 8, 8);
            }
        }
        
        return canvas;
    }

    createSilentAudio() {
        // Создаем тихий аудио-объект
        const audio = new Audio();
        audio.volume = 0;
        return audio;
    }

    get(path) {
        return this.loadedAssets.get(path);
    }

    has(path) {
        return this.loadedAssets.has(path);
    }

    preload(paths) {
        return Promise.all(paths.map(path => this.load(path)));
    }

    clear() {
        this.loadedAssets.clear();
        this.loadingPromises.clear();
    }
}