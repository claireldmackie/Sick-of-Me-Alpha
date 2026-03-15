class InputManager {
    constructor(canvas, container) {
        this.canvas = canvas;
        this.container = container;
        this.clickCallbacks = [];
        this.hoveredTarget = null;
        this.onHoverChange = null;
        this.blocked = false;
        this.keysDown = new Set();
        this.lastHorizontal = null;

        this.container.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            e.preventDefault();
            this.keysDown.add(key);
            if (key === 'a' || key === 'arrowleft') this.lastHorizontal = 'left';
            else if (key === 'd' || key === 'arrowright') this.lastHorizontal = 'right';
        });
        document.addEventListener('keyup', (e) => {
            e.preventDefault();
            this.keysDown.delete(e.key.toLowerCase());
        });
        document.addEventListener('visibilitychange', () => {
            this.keysDown.clear();
        });
        window.addEventListener('blur', () => {
            this.keysDown.clear();
        });
    }

    isKeyDown(key) {
        return this.keysDown.has(key);
    }

    getCanvasCoords(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    handleClick(e) {
        if (this.blocked) return;
        const coords = this.getCanvasCoords(e);
        for (const cb of this.clickCallbacks) {
            cb(coords);
        }
    }

    handleMouseMove(e) {
        const coords = this.getCanvasCoords(e);
        const prevHovered = this.hoveredTarget;
        this.hoveredTarget = null;

        if (this._hitTargets) {
            for (const target of this._hitTargets) {
                if (this.isInsideTarget(coords, target)) {
                    this.hoveredTarget = target.id;
                    break;
                }
            }
        }

        this.canvas.classList.toggle('clickable', this.hoveredTarget !== null);

        if (this.hoveredTarget !== prevHovered && this.onHoverChange) {
            this.onHoverChange(this.hoveredTarget);
        }
    }

    onClick(callback) {
        this.clickCallbacks.push(callback);
    }

    removeClickCallback(callback) {
        this.clickCallbacks = this.clickCallbacks.filter(cb => cb !== callback);
    }

    setHitTargets(targets) {
        this._hitTargets = targets;
    }

    checkHit(coords, targets) {
        for (const target of targets) {
            if (this.isInsideTarget(coords, target)) {
                return target;
            }
        }
        return null;
    }

    isInsideTarget(coords, target) {
        if (target.hitbox) {
            return coords.x >= target.hitbox.x &&
                   coords.x <= target.hitbox.x + target.hitbox.width &&
                   coords.y >= target.hitbox.y &&
                   coords.y <= target.hitbox.y + target.hitbox.height;
        }

        if (target.x !== undefined && target.width !== undefined) {
            return coords.x >= target.x &&
                   coords.x <= target.x + target.width &&
                   coords.y >= target.y &&
                   coords.y <= target.y + target.height;
        }

        return false;
    }
}
