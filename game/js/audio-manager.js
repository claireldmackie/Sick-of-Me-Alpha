class AudioManager {
    constructor() {
        this.tracks = {};
        this.trackVolumes = {};
        this.music = null;
        this.currentTrack = null;
        this.volume = AUDIO.DEFAULT_VOLUME;
        this.fadeInterval = null;
        this.playing = false;
    }

    load(name, src, trackVolume) {
        const audio = new Audio(src);
        audio.loop = true;
        audio.volume = 0;
        this.tracks[name] = audio;
        if (trackVolume !== undefined) this.trackVolumes[name] = trackVolume;
        if (!this.music) {
            this.music = audio;
            this.currentTrack = name;
        }
    }

    switchTo(name, fadeDuration = AUDIO.SWITCH_FADE_MS) {
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
            this.music.play().catch(e => console.warn('Audio play blocked:', e.message));
            this._fadeToVolume(this._effectiveVolume(), fadeDuration);
        }
    }

    play() {
        if (!this.music || this.playing) return;
        this.playing = true;
        this.music.volume = this._effectiveVolume();
        this.music.play().catch(e => console.warn('Audio play blocked:', e.message));
    }

    fadeIn(duration = AUDIO.FADE_IN_MS) {
        if (!this.music || this.playing) return;
        this.playing = true;
        this.music.volume = 0;
        this.music.play().catch(e => console.warn('Audio play blocked:', e.message));
        this._fadeToVolume(this._effectiveVolume(), duration);
    }

    setVolume(value) {
        this.volume = Math.max(0, Math.min(AUDIO.VOLUME_MAX, value));
        if (this.music) {
            this.music.volume = this._effectiveVolume();
        }
    }

    getVolume() {
        return this.volume;
    }

    _effectiveVolume() {
        const scale = this.trackVolumes[this.currentTrack] ?? 1;
        return Math.min(this.volume * scale, 1.0);
    }

    _fadeToVolume(target, duration) {
        clearInterval(this.fadeInterval);
        const steps = AUDIO.FADE_STEPS;
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

    resume(duration = AUDIO.RESUME_MS) {
        if (!this.music || !this.playing) return;
        if (!this.music.paused) return;
        this.music.volume = 0;
        this.music.play().catch(e => console.warn('Audio play blocked:', e.message));
        this._fadeToVolume(this._effectiveVolume(), duration);
    }

    get muted() {
        return this.music ? this.music.muted : false;
    }

    toggleMute() {
        if (!this.music) return false;
        this.music.muted = !this.music.muted;
        return this.music.muted;
    }

    fadeOut(duration = AUDIO.FADE_OUT_MS) {
        if (!this.music || !this.playing) return Promise.resolve();
        return new Promise(resolve => {
            this._fadeToVolume(0, duration);
            setTimeout(() => {
                this.music.pause();
                this.music.currentTime = 0;
                this.playing = false;
                resolve();
            }, duration);
        });
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
