class SceneManager {
    constructor(renderer, imageLoader, inputManager, dialogueManager, letterManager) {
        this.renderer = renderer;
        this.imageLoader = imageLoader;
        this.input = inputManager;
        this.dialogue = dialogueManager;
        this.letterManager = letterManager || null;
        this.uiManager = null;

        this.currentScene = null;
        this.sceneState = {};
        this.sequenceIndex = 0;
        this.waitingForTarget = null;
        this.isProcessing = false;
        this.stopped = false;
        this.onSceneEnd = null;
        this.onStepAdvance = null;
        this.config = null;
        this.skipRequested = false;
        this._skipResolve = null;
        this.audioManager = null;
        this.playerChoices = [];
        this.fading = false;

        const skipBtn = document.getElementById('skip-btn');
        if (skipBtn) {
            skipBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.skipRequested = true;
                this.dialogue.hide();
                this.dialogue.hideCloseup();
                if (this._skipResolve) {
                    const resolve = this._skipResolve;
                    this._skipResolve = null;
                    resolve();
                }
            });
        }
    }

    async loadConfig(configFile) {
        const response = await fetch(configFile + '?v=' + Date.now());
        this.config = await response.json();
    }

    applyCharacterDefaults(sceneData) {
        if (!this.config || !this.config.characters || !sceneData.characters) return;

        for (const char of sceneData.characters) {
            const defaults = this.config.characters[char.id];
            if (!defaults) continue;

            if (char.image === undefined) char.image = defaults.image;
            if (char.scale === undefined) char.scale = defaults.scale;
            if (char.anchorX === undefined) char.anchorX = defaults.anchorX;
            if (char.anchorY === undefined) char.anchorY = defaults.anchorY;
        }
    }

    async loadScene(sceneFile) {
        const response = await fetch(sceneFile + '?v=' + Date.now());
        const sceneData = await response.json();
        this.applyCharacterDefaults(sceneData);
        this.currentScene = sceneData;
        this.sceneState = { ...(sceneData.initialState || {}) };
        this.sequenceIndex = 0;
        this.waitingForTarget = null;

        const imageSources = [];
        if (sceneData.background) imageSources.push(sceneData.background);
        if (sceneData.characters) {
            for (const char of sceneData.characters) {
                if (char.image) imageSources.push(char.image);
            }
        }
        if (sceneData.objects) {
            for (const obj of sceneData.objects) {
                if (obj.image) imageSources.push(obj.image);
            }
        }
        if (sceneData.closeupImage) {
            imageSources.push(sceneData.closeupImage);
        }
        if (sceneData.sequence) {
            for (const step of sceneData.sequence) {
                if (step.type === 'setCharacterImage' && step.image) {
                    imageSources.push(step.image);
                }
            }
        }

        await this.imageLoader.loadMultiple(imageSources);

        this.updateHitTargets();
        this.render();
        const ctx = this.renderer.ctx;
        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.fillRect(0, 0, this.renderer.width, this.renderer.height);
    }

    getState() {
        return {
            sequenceIndex: this.sequenceIndex
        };
    }

    fastForwardTo(targetIndex) {
        if (!this.currentScene || !this.currentScene.sequence) return;

        const seq = this.currentScene.sequence;
        const stateTypes = ['showCharacter', 'hideCharacter', 'showObject', 'hideObject', 'setState', 'collectLetter', 'setCharacterImage'];

        for (let i = 0; i < targetIndex && i < seq.length; i++) {
            const step = seq[i];
            if (!stateTypes.includes(step.type)) continue;

            if (step.type === 'showCharacter') this.setCharacterVisible(step.target, true);
            else if (step.type === 'hideCharacter') this.setCharacterVisible(step.target, false);
            else if (step.type === 'showObject') this.setObjectVisible(step.target, true);
            else if (step.type === 'hideObject') this.setObjectVisible(step.target, false);
            else if (step.type === 'setState') Object.assign(this.sceneState, step.state);
            else if (step.type === 'collectLetter' && this.letterManager) {
                this.letterManager.collect(step.letterId);
            }
            else if (step.type === 'setCharacterImage') {
                const char = this.currentScene.characters?.find(c => c.id === step.target);
                if (char) char.image = step.image;
            }
        }

        this.sequenceIndex = targetIndex;
        this.updateHitTargets();
        this.render();
    }

    stop() {
        this.stopped = true;
        this.isProcessing = false;
        this.input.clickCallbacks = [];
        this.dialogue.hide();
        this.dialogue.hideCloseup();
        if (this._resolveWait) {
            this._resolveWait();
            this._resolveWait = null;
        }
        if (this._skipResolve) {
            const resolve = this._skipResolve;
            this._skipResolve = null;
            resolve();
        }
    }

    async runSequence() {
        const scene = this.currentScene;
        if (!scene || !scene.sequence) return;

        this.isProcessing = true;
        this.stopped = false;
        this.skipRequested = false;

        while (this.sequenceIndex < scene.sequence.length) {
            if (this.stopped) return;
            const step = scene.sequence[this.sequenceIndex];

            if (this.skipRequested) {
                const skippable = ['dialogue', 'narration', 'pause', 'closeup', 'closeupDialogue', 'hideCloseup'];
                if (skippable.includes(step.type)) {
                    if (step.type === 'hideCloseup') this.dialogue.hideCloseup();
                    this.sequenceIndex++;
                    continue;
                }
                if (step.type === 'showCharacter') {
                    this.setCharacterVisible(step.target, true);
                    this.sequenceIndex++;
                    continue;
                }
                if (step.type === 'showObject') {
                    this.setObjectVisible(step.target, true);
                    this.sequenceIndex++;
                    continue;
                }
                if (step.type === 'setState') {
                    Object.assign(this.sceneState, step.state);
                    this.sequenceIndex++;
                    continue;
                }
                if (step.type === 'collectLetter') {
                    if (this.letterManager) this.letterManager.collect(step.letterId);
                    this.sequenceIndex++;
                    continue;
                }
                this.skipRequested = false;
                this.showSkipButton(false);
                this.dialogue.hide();
                this.dialogue.hideCloseup();
                this.updateHitTargets();
                this.render();
            }

            await this.executeStep(step);
            this.sequenceIndex++;
            if (this.onStepAdvance) this.onStepAdvance(this.sequenceIndex);
        }

        this.isProcessing = false;

        if (this.onSceneEnd) {
            this.onSceneEnd(scene.nextScene);
        }
    }

    updateHitTargets() {
        if (!this.currentScene) return;

        const targets = [];

        if (this.currentScene.characters) {
            for (const char of this.currentScene.characters) {
                if (!char.interactive || char.visible === false) continue;
                if (char.hitbox) {
                    targets.push({ id: char.id, ...char.hitbox });
                } else if (char.x !== undefined) {
                    const img = this.imageLoader.get(char.image);
                    const scale = char.scale || 1;
                    const w = img ? img.naturalWidth * scale : 100;
                    const h = img ? img.naturalHeight * scale : 100;
                    const anchorX = char.anchorX ?? 0.5;
                    const anchorY = char.anchorY ?? 1.0;
                    targets.push({
                        id: char.id,
                        x: char.x - w * anchorX,
                        y: char.y - h * anchorY,
                        width: w,
                        height: h
                    });
                }
            }
        }

        if (this.currentScene.objects) {
            for (const obj of this.currentScene.objects) {
                if (!obj.interactive || obj.visible === false) continue;
                if (obj.type === 'hotspot') {
                    targets.push({
                        id: obj.id,
                        x: obj.x,
                        y: obj.y,
                        width: obj.width,
                        height: obj.height
                    });
                } else if (obj.type === 'arrow') {
                    const s = obj.size || 30;
                    targets.push({
                        id: obj.id,
                        x: obj.x - s * 0.5,
                        y: obj.y - s,
                        width: s * 1.7,
                        height: s * 2
                    });
                } else if (obj.image) {
                    if (obj.hitbox) {
                        targets.push({ id: obj.id, ...obj.hitbox });
                    } else {
                        const img = this.imageLoader.get(obj.image);
                        const scale = obj.scale || 1;
                        const w = img ? img.naturalWidth * scale : 50;
                        const h = img ? img.naturalHeight * scale : 50;
                        targets.push({
                            id: obj.id,
                            x: obj.x,
                            y: obj.y,
                            width: w,
                            height: h
                        });
                    }
                }
            }
        }

        this.input.setHitTargets(targets);
    }

    render() {
        const scene = this.currentScene;
        if (!scene) return;

        this.renderer.clear();

        const bgImg = this.imageLoader.get(scene.background);
        if (bgImg) {
            this.renderer.drawBackground(bgImg);
        }

        if (this.sceneState.dark) {
            this.renderer.drawDarkOverlay(this.sceneState.darkOpacity || 0.6);
            if (this.sceneState.tvGlow) {
                this.renderer.drawTVGlow(
                    this.sceneState.tvGlow.x,
                    this.sceneState.tvGlow.y,
                    this.sceneState.tvGlow.radius
                );
            }
        }

        const drawables = [];

        if (scene.objects) {
            for (const obj of scene.objects) {
                if (obj.visible === false) continue;
                if (obj.type === 'hotspot') continue;
                if (obj.type === 'arrow') {
                    drawables.push({
                        type: 'arrow',
                        data: obj,
                        y: obj.y,
                        zIndex: obj.zIndex || 10
                    });
                    continue;
                }
                drawables.push({
                    type: 'object',
                    data: obj,
                    y: obj.y + (obj.height || 0),
                    zIndex: obj.zIndex || 0
                });
            }
        }

        if (scene.characters) {
            for (const char of scene.characters) {
                if (char.visible === false) continue;
                drawables.push({
                    type: 'character',
                    data: char,
                    y: char.y,
                    zIndex: char.zIndex || 1
                });
            }
        }

        drawables.sort((a, b) => a.zIndex - b.zIndex || a.y - b.y);

        for (const d of drawables) {
            const item = d.data;
            if (d.type === 'arrow') {
                this.renderer.drawArrow(
                    item.x, item.y,
                    item.direction || 'right',
                    item.size || 30,
                    item.color
                );
                continue;
            }
            const img = this.imageLoader.get(item.image);
            if (!img) continue;
            const scale = item.scale || 1;
            const anchorX = item.anchorX ?? (d.type === 'character' ? 0.5 : 0);
            const anchorY = item.anchorY ?? (d.type === 'character' ? 1.0 : 0);
            const flipX = item.flipX || false;
            const opacity = item.opacity ?? 1.0;
            const brightness = item.brightness ?? null;
            const customFilter = item.filter || null;
            const ctx = this.renderer.ctx;
            if (opacity < 1.0) ctx.globalAlpha = opacity;
            if (customFilter) ctx.filter = customFilter;
            else if (brightness !== null) ctx.filter = `brightness(${brightness})`;
            this.renderer.drawSprite(img, item.x, item.y, scale, anchorX, anchorY, flipX);
            if (customFilter || brightness !== null) ctx.filter = 'none';
            if (opacity < 1.0) ctx.globalAlpha = 1.0;
        }

        this.drawHoverGlow();
    }

    drawHoverGlow() {
        if (!this.waitingForTarget || !this.input.hoveredTarget) return;
        const waiting = Array.isArray(this.waitingForTarget) ? this.waitingForTarget : [this.waitingForTarget];
        if (!waiting.includes(this.input.hoveredTarget)) return;

        const targets = this.input._hitTargets || [];
        const target = targets.find(t => t.id === this.input.hoveredTarget);
        if (!target) return;

        this.renderer.drawHoverGlow(target.x, target.y, target.width, target.height);
    }

    async executeStep(step) {
        switch (step.type) {
            case 'dialogue': {
                const remaining = this.countConsecutiveDialogueSteps(this.sequenceIndex);
                this.showSkipButton(remaining >= 3);
                this.dialogue.show(step.speaker, step.text);
                await this.waitForAnyClick();
                this.dialogue.hide();
                this.showSkipButton(false);
                break;
            }

            case 'narration': {
                const remaining = this.countConsecutiveDialogueSteps(this.sequenceIndex);
                this.showSkipButton(remaining >= 3);
                this.dialogue.showNarrationText(step.text);
                await this.waitForAnyClick();
                this.dialogue.hide();
                this.showSkipButton(false);
                break;
            }

            case 'waitForClick':
                this.waitingForTarget = step.target;
                this.updateHitTargets();
                this.render();
                await this.waitForTargetClick(step.target);
                this.waitingForTarget = null;
                break;

            case 'waitForClickBranch': {
                const targets = Object.keys(step.branches);
                this.waitingForTarget = targets;
                this.updateHitTargets();
                this.render();
                const clicked = await this.waitForTargetClick(targets);
                this.waitingForTarget = null;
                const branchSteps = step.branches[clicked];
                if (branchSteps) {
                    for (const s of branchSteps) {
                        if (this.stopped) break;
                        await this.executeStep(s);
                    }
                }
                break;
            }

            case 'showCharacter':
                this.setCharacterVisible(step.target, true);
                this.updateHitTargets();
                this.render();
                break;

            case 'setCharacterImage': {
                const char = this.currentScene?.characters?.find(c => c.id === step.target);
                if (char && step.image) {
                    await this.imageLoader.loadMultiple([step.image]);
                    char.image = step.image;
                    this.render();
                }
                break;
            }

            case 'hideCharacter':
                this.setCharacterVisible(step.target, false);
                this.updateHitTargets();
                this.render();
                break;

            case 'showObject':
                this.setObjectVisible(step.target, true);
                this.updateHitTargets();
                this.render();
                break;

            case 'hideObject':
                this.setObjectVisible(step.target, false);
                this.updateHitTargets();
                this.render();
                break;

            case 'setState':
                Object.assign(this.sceneState, step.state);
                this.render();
                break;

            case 'closeup':
                this.dialogue.showCloseup(step.image || null);
                break;

            case 'closeupDialogue': {
                const remaining = this.countConsecutiveDialogueSteps(this.sequenceIndex);
                this.showSkipButton(remaining >= 3);
                this.dialogue.showCloseupText(step.speaker, step.text, step.html);
                await this.waitForAnyClick();
                this.dialogue.hide();
                this.showSkipButton(false);
                break;
            }

            case 'hideCloseup':
                this.dialogue.hideCloseup();
                break;

            case 'pause':
                await this.sleep(step.duration || 1000);
                break;

            case 'collectLetter':
                if (this.letterManager) {
                    this.letterManager.collect(step.letterId);
                    if (this.uiManager) {
                        this.uiManager.addUnreadLetter();
                        await this.uiManager.showSingleLetter(step.letterId);
                    }
                }
                break;

            case 'tutorial': {
                await this.showTutorial(step.text);
                break;
            }

            case 'showTutorial': {
                const el = document.getElementById('tutorial-prompt');
                if (el) {
                    el.classList.remove('hidden', 'fading-out', 'visible');
                    el.offsetHeight;
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => el.classList.add('visible'));
                    });
                }
                break;
            }

            case 'hideTutorial': {
                const el = document.getElementById('tutorial-prompt');
                if (el) {
                    el.classList.remove('visible');
                    el.classList.add('fading-out');
                    setTimeout(() => {
                        el.classList.add('hidden');
                        el.classList.remove('fading-out');
                    }, 500);
                }
                break;
            }

            case 'dialogueOptions': {
                const chosen = await this.showDialogueOptions(step.speaker, step.prompt, step.options);
                this.playerChoices.push(chosen.category);
                if (chosen.followUp) {
                    this.dialogue.show(step.speaker, chosen.followUp);
                    await this.waitForAnyClick();
                    this.dialogue.hide();
                }
                break;
            }

            case 'determineEnding': {
                const ending = this.determineEnding();
                const endingMap = step.endings || {};
                const nextScene = endingMap[ending];
                if (nextScene) {
                    this.currentScene.nextScene = nextScene;
                }
                break;
            }

            case 'showNote': {
                if (this.uiManager) {
                    await this.uiManager.showNote(step.title || '', step.text || '', step.cssClass || '');
                }
                break;
            }

            case 'startMusic': {
                if (this.audioManager) {
                    this.audioManager.fadeIn(step.fadeDuration || 3000);
                }
                break;
            }

            case 'showCredits': {
                await this.showCreditsOverlay();
                break;
            }

            case 'transition':
                await this.fadeOut();
                break;

            default:
                console.warn('Unknown step type:', step.type);
        }
    }

    setCharacterVisible(id, visible) {
        if (!this.currentScene || !this.currentScene.characters) return;
        const char = this.currentScene.characters.find(c => c.id === id);
        if (char) char.visible = visible;
    }

    setObjectVisible(id, visible) {
        if (!this.currentScene || !this.currentScene.objects) return;
        const obj = this.currentScene.objects.find(o => o.id === id);
        if (obj) obj.visible = visible;
    }

    countConsecutiveDialogueSteps(fromIndex) {
        const seq = this.currentScene.sequence;
        let count = 0;
        const dialogueTypes = ['dialogue', 'narration', 'closeupDialogue'];
        for (let i = fromIndex; i < seq.length; i++) {
            if (dialogueTypes.includes(seq[i].type)) {
                count++;
            } else if (seq[i].type === 'closeup' || seq[i].type === 'hideCloseup' || seq[i].type === 'showCharacter' || seq[i].type === 'showObject' || seq[i].type === 'pause') {
                continue;
            } else {
                break;
            }
        }
        return count;
    }

    showSkipButton(visible) {
        const btn = document.getElementById('skip-btn');
        const devCheck = document.getElementById('dev-toggle-check');
        const devOn = devCheck && devCheck.checked;
        if (btn) btn.style.display = (visible && devOn) ? 'block' : 'none';
    }

    waitForAnyClick() {
        return new Promise((resolve) => {
            this._skipResolve = resolve;
            const handler = () => {
                this._skipResolve = null;
                this.input.removeClickCallback(handler);
                resolve();
            };
            this.input.onClick(handler);
        });
    }

    waitForTargetClick(targetId) {
        const ids = Array.isArray(targetId) ? targetId : [targetId];
        return new Promise((resolve) => {
            this._resolveWait = () => {
                this.input.removeClickCallback(handler);
                resolve();
            };
            const handler = (coords) => {
                const targets = (this.input._hitTargets || []).filter(t => ids.includes(t.id));
                const hit = this.input.checkHit(coords, targets);
                if (hit) {
                    this._resolveWait = null;
                    this.input.removeClickCallback(handler);
                    resolve(hit.id);
                }
            };
            this.input.onClick(handler);
        });
    }

    forceResolveWait() {
        if (this._resolveWait) {
            this._resolveWait();
            this._resolveWait = null;
        }
    }

    showDialogueOptions(speaker, prompt, options) {
        return new Promise((resolve) => {
            const container = document.getElementById('dialogue-options');
            const promptEl = document.getElementById('options-prompt');
            const buttonsEl = document.getElementById('options-buttons');

            promptEl.textContent = (speaker ? speaker + ': ' : '') + prompt;
            buttonsEl.innerHTML = '';

            for (const opt of options) {
                const btn = document.createElement('button');
                btn.textContent = opt.label;
                btn.addEventListener('click', () => {
                    container.classList.add('hidden');
                    resolve(opt);
                });
                buttonsEl.appendChild(btn);
            }

            container.classList.remove('hidden');
        });
    }

    showTutorial() {
        return new Promise((resolve) => {
            const el = document.getElementById('tutorial-prompt');
            if (!el) { resolve(); return; }

            el.classList.remove('hidden', 'fading-out', 'visible');
            el.classList.remove('hidden');
            requestAnimationFrame(() => {
                el.classList.add('visible');
            });

            const keys = ['a', 'd', 'arrowleft', 'arrowright'];
            const handler = (e) => {
                if (keys.includes(e.key.toLowerCase())) {
                    document.removeEventListener('keydown', handler);
                    el.classList.remove('visible');
                    el.classList.add('fading-out');
                    setTimeout(() => {
                        el.classList.add('hidden');
                        el.classList.remove('fading-out');
                        resolve();
                    }, 500);
                }
            };
            document.addEventListener('keydown', handler);
        });
    }

    showCreditsOverlay() {
        return new Promise((resolve) => {
            const overlay = document.getElementById('credits-overlay');
            if (!overlay) { resolve(); return; }
            overlay.classList.remove('hidden');
            const closeBtn = overlay.querySelector('.credits-close');
            const handler = () => {
                closeBtn.removeEventListener('click', handler);
                overlay.classList.add('hidden');
                resolve();
            };
            if (closeBtn) closeBtn.addEventListener('click', handler);
        });
    }

    determineEnding() {
        const counts = {};
        for (const cat of this.playerChoices) {
            counts[cat] = (counts[cat] || 0) + 1;
        }
        let best = 'connect';
        let bestCount = 0;
        for (const [cat, count] of Object.entries(counts)) {
            if (count > bestCount) {
                bestCount = count;
                best = cat;
            }
        }
        return best;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async fadeOut() {
        const ctx = this.renderer.ctx;
        const w = this.renderer.width;
        const h = this.renderer.height;
        const duration = (this.currentScene && this.currentScene.fadeDuration) || 1000;
        const startTime = performance.now();
        this.fading = true;

        return new Promise((resolve) => {
            const animate = (now) => {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);

                this.render();
                ctx.fillStyle = `rgba(0, 0, 0, ${progress})`;
                ctx.fillRect(0, 0, w, h);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            requestAnimationFrame(animate);
        });
    }

    async fadeIn() {
        const ctx = this.renderer.ctx;
        const w = this.renderer.width;
        const h = this.renderer.height;
        const duration = (this.currentScene && this.currentScene.fadeDuration) || 1000;
        const startTime = performance.now();
        this.fading = true;

        return new Promise((resolve) => {
            const animate = (now) => {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);

                this.render();
                ctx.fillStyle = `rgba(0, 0, 0, ${1 - progress})`;
                ctx.fillRect(0, 0, w, h);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    this.fading = false;
                    resolve();
                }
            };
            requestAnimationFrame(animate);
        });
    }
}
