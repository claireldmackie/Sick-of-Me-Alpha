class ImageLoader {
    constructor() {
        this.cache = {};
        this.loading = new Map();
    }

    load(src) {
        if (this.cache[src]) {
            return Promise.resolve(this.cache[src]);
        }
        if (this.loading.has(src)) {
            return this.loading.get(src);
        }

        const promise = new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.cache[src] = img;
                this.loading.delete(src);
                resolve(img);
            };
            img.onerror = () => {
                this.loading.delete(src);
                reject(new Error(`Failed to load image: ${src}`));
            };
            img.src = src;
        });

        this.loading.set(src, promise);
        return promise;
    }

    async loadMultiple(sources) {
        const results = await Promise.allSettled(sources.map(src => this.load(src)));
        const failed = results.filter(r => r.status === 'rejected');
        if (failed.length > 0) {
            console.warn('Some images failed to load:', failed.map(r => r.reason.message));
        }
        return results
            .filter(r => r.status === 'fulfilled')
            .map(r => r.value);
    }

    get(src) {
        return this.cache[src] || null;
    }
}

class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    drawBackground(img) {
        if (!img) return;
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.drawImage(img, 0, 0, this.width, this.height);
    }

    drawSprite(img, x, y, scale = 1, anchorX = 0.5, anchorY = 1.0, flipX = false) {
        if (!img) return;
        const w = img.naturalWidth * scale;
        const h = img.naturalHeight * scale;
        const drawX = x - w * anchorX;
        const drawY = y - h * anchorY;

        if (flipX) {
            this.ctx.save();
            this.ctx.translate(drawX + w, drawY);
            this.ctx.scale(-1, 1);
            this.ctx.drawImage(img, 0, 0, w, h);
            this.ctx.restore();
        } else {
            this.ctx.drawImage(img, drawX, drawY, w, h);
        }
    }

    drawDarkOverlay(opacity = 0.6) {
        this.ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    drawTVGlow(x, y, radius) {
        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, 'rgba(100, 130, 180, 0.15)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    drawHoverGlow(x, y, width, height) {
        const ctx = this.ctx;
        const pad = 8;
        const gx = x - pad;
        const gy = y - pad;
        const gw = width + pad * 2;
        const gh = height + pad * 2;
        const radius = 12;

        ctx.save();
        ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
        ctx.shadowBlur = 20;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(gx, gy, gw, gh, radius);
        ctx.stroke();
        ctx.restore();
    }

    drawArrow(x, y, direction, size, color) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = color || 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();

        const s = size || 30;
        if (direction === 'right') {
            ctx.moveTo(0, -s);
            ctx.lineTo(s * 1.2, 0);
            ctx.lineTo(0, s);
        } else if (direction === 'left') {
            ctx.moveTo(0, -s);
            ctx.lineTo(-s * 1.2, 0);
            ctx.lineTo(0, s);
        } else if (direction === 'down') {
            ctx.moveTo(-s, 0);
            ctx.lineTo(0, s * 1.2);
            ctx.lineTo(s, 0);
        } else if (direction === 'up') {
            ctx.moveTo(-s, 0);
            ctx.lineTo(0, -s * 1.2);
            ctx.lineTo(s, 0);
        }

        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}
