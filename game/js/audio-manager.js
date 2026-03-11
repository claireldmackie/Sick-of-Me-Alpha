class AudioManager {
    constructor() {
        this.music = null;
        this.volume = 0.75;
        this.fadeInterval = null;
        this.playing = false;
    }

    load(src) {
        this.music = new Audio(src);
        this.music.loop = true;
        this.music.volume = 0;
    }

    play() {
        if (!this.music || this.playing) return;
        this.playing = true;
        this.music.volume = this.volume;
        this.music.play().catch(() => {});
    }

    fadeIn(duration = 3000) {
        if (!this.music || this.playing) return;
        this.playing = true;
        this.music.volume = 0;
        this.music.play().catch(() => {});

        const steps = 60;
        const stepTime = duration / steps;
        let current = 0;

        clearInterval(this.fadeInterval);
        this.fadeInterval = setInterval(() => {
            current++;
            const progress = current / steps;
            this.music.volume = Math.min(this.volume, progress * this.volume);
            if (current >= steps) {
                clearInterval(this.fadeInterval);
                this.fadeInterval = null;
                this.music.volume = this.volume;
            }
        }, stepTime);
    }

    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
        if (this.music) {
            this.music.volume = this.volume;
        }
    }

    getVolume() {
        return this.volume;
    }

    stop() {
        clearInterval(this.fadeInterval);
        this.fadeInterval = null;
        if (this.music) {
            this.music.pause();
            this.music.currentTime = 0;
            this.music.volume = 0;
        }
        this.playing = false;
    }
}
