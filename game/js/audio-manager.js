class AudioManager {
    constructor() {
        this.tracks = {};
        this.music = null;
        this.currentTrack = null;
        this.volume = 0.15;
        this.fadeInterval = null;
        this.playing = false;
    }

    load(name, src) {
        const audio = new Audio(src);
        audio.loop = true;
        audio.volume = 0;
        this.tracks[name] = audio;
        if (!this.music) {
            this.music = audio;
            this.currentTrack = name;
        }
    }

    switchTo(name, fadeDuration = 3000) {
        const next = this.tracks[name];
        if (!next || name === this.currentTrack) return;

        clearInterval(this.fadeInterval);
        this.fadeInterval = null;

        if (this.music) {
            this.music.pause();
            this.music.currentTime = 0;
            this.music.volume = 0;
        }

        this.music = next;
        this.currentTrack = name;

        if (this.playing) {
            this.music.volume = 0;
            this.music.play().catch(() => {});
            this._fadeToVolume(this.volume, fadeDuration);
        }
    }

    play() {
        if (!this.music || this.playing) return;
        this.playing = true;
        this.music.volume = this.volume;
        this.music.play().catch(() => {});
    }

    fadeIn(duration = 10000) {
        if (!this.music || this.playing) return;
        this.playing = true;
        this.music.volume = 0;
        this.music.play().catch(() => {});
        this._fadeToVolume(this.volume, duration);
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

    _fadeToVolume(target, duration) {
        clearInterval(this.fadeInterval);
        const steps = 60;
        const stepTime = duration / steps;
        const startVol = this.music.volume;
        let current = 0;

        this.fadeInterval = setInterval(() => {
            current++;
            const progress = current / steps;
            this.music.volume = startVol + (target - startVol) * progress;
            if (current >= steps) {
                clearInterval(this.fadeInterval);
                this.fadeInterval = null;
                this.music.volume = target;
            }
        }, stepTime);
    }

    arm() {
        if (!this.music) return;
        this.playing = true;
        this.music.volume = 0;
    }

    pause() {
        if (!this.music || !this.playing) return;
        clearInterval(this.fadeInterval);
        this.fadeInterval = null;
        this.music.pause();
    }

    resume(duration = 3000) {
        if (!this.music || !this.playing) return;
        this.music.volume = 0;
        this.music.play().catch(() => {});
        this._fadeToVolume(this.volume, duration);
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
