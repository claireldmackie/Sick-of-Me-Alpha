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
            img.src = src + '?v=' + Date.now();
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
        const drawX = x - w * anchorX | 0;
        const drawY = y - h * anchorY | 0;

        if (flipX) {
            this.ctx.save();
            this.ctx.translate(x + w * anchorX | 0, drawY);
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

        const s = size || 30;
        const r = s * 0.35;

        ctx.beginPath();
        if (direction === 'right') {
            this._roundedArrowPath(ctx, [[0, -s], [s * 1.2, 0], [0, s]], r);
        } else if (direction === 'left') {
            this._roundedArrowPath(ctx, [[0, -s], [-s * 1.2, 0], [0, s]], r);
        } else if (direction === 'down') {
            this._roundedArrowPath(ctx, [[-s, 0], [0, s * 1.2], [s, 0]], r);
        } else if (direction === 'up') {
            this._roundedArrowPath(ctx, [[-s, 0], [0, -s * 1.2], [s, 0]], r);
        }

        ctx.fillStyle = 'rgba(0, 0, 0, 0)';
        ctx.strokeStyle = color || 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
    }

    _roundedArrowPath(ctx, pts, r) {
        const len = pts.length;
        ctx.beginPath();
        for (let i = 0; i < len; i++) {
            const prev = pts[(i - 1 + len) % len];
            const curr = pts[i];
            const next = pts[(i + 1) % len];
            const dx1 = curr[0] - prev[0], dy1 = curr[1] - prev[1];
            const dx2 = next[0] - curr[0], dy2 = next[1] - curr[1];
            const l1 = Math.hypot(dx1, dy1), l2 = Math.hypot(dx2, dy2);
            const t = Math.min(r, l1 / 2, l2 / 2);
            const x1 = curr[0] - (dx1 / l1) * t, y1 = curr[1] - (dy1 / l1) * t;
            const x2 = curr[0] + (dx2 / l2) * t, y2 = curr[1] + (dy2 / l2) * t;
            if (i === 0) ctx.moveTo(x1, y1);
            else ctx.lineTo(x1, y1);
            ctx.quadraticCurveTo(curr[0], curr[1], x2, y2);
        }
        ctx.closePath();
    }
}
