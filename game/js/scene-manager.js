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
        this._bgOverlayImage = null;
        this._bgOverlayOpacity = 0;
        this._bgOffsetY = 0;
        this._nightFade = 0;
        this._phoneVideo = null;
        this._phoneVideoRect = null;
        this._phoneVideoCrop = null;
        this.manualTrackOverride = false;
        this._dialogueHistory = [];
        this._originalCharacters = [];
        this._originalObjects = [];
        this.heroName = 'Hero';

        this._initStepHandlers();

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

    _initStepHandlers() {
        this._stepHandlers = {
            dialogue: (step) => this._handleDialogue(step),
            showDialogueBox: (step) => { this._hideDialogueNav(); this.dialogue.show(this._substituteHeroName(step.speaker), this._substituteHeroName(step.text)); },
            hideDialogueBox: () => this.dialogue.hide(),
            narration: (step) => this._handleNarration(step),
            waitForClick: (step) => this._handleWaitForClick(step),
            waitForClickBranch: (step) => this._handleWaitForClickBranch(step),
            showCharacter: (step) => this._handleShowCharacter(step),
            setCharacterImage: (step) => this._handleSetCharacterImage(step),
            hideCharacter: (step) => this._handleHideCharacter(step),
            showObject: (step) => this._handleShowObject(step),
            hideObject: (step) => this._handleHideObject(step),
            setState: (step) => this._handleSetState(step),
            closeup: (step) => this._handleCloseup(step),
            closeupDialogue: (step) => this._handleCloseupDialogue(step),
            hideCloseup: () => this.dialogue.hideCloseup(),
            pause: (step) => this.sleep(step.duration || 1000),
            collectLetter: (step) => this._handleCollectLetter(step),
            tutorial: () => this.showTutorial(),
            showTutorial: () => this._handleShowTutorial(),
            hideTutorial: () => this._handleHideTutorial(),
            showInteractTutorial: () => this._handleShowInteractTutorial(),
            hideInteractTutorial: () => this._handleHideInteractTutorial(),
            showMoveTutorial: () => this._handleShowMoveTutorial(),
            dialogueOptions: (step) => this._handleDialogueOptions(step),
            determineEnding: (step) => this._handleDetermineEnding(step),
            showNote: (step) => this._handleShowNote(step),
            showBgOverlay: (step) => this._handleShowBgOverlay(step),
            hideBgOverlay: () => this._handleHideBgOverlay(),
            panDown: (step) => this._handlePanDown(step),
            nameHero: () => this._handleNameHero(),
            clickToStart: () => this._handleClickToStart(),
            playPhoneVideo: (step) => this._handlePlayPhoneVideo(step),
            hidePhoneVideo: () => this._handleHidePhoneVideo(),
            switchTrack: (step) => this._handleSwitchTrack(step),
            startMusic: (step) => this._handleStartMusic(step),
            stopMusic: (step) => this._handleStopMusic(step),
            showCredits: () => this.showCreditsOverlay(),
            transition: () => this.fadeOut(),
        };
    }

    /* ── Scene Loading ── */

    async loadConfig(configFile) {
        try {
            const response = await fetch(configFile + '?v=' + Date.now());
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            this.config = await response.json();
        } catch (e) {
            console.error('Failed to load config:', e);
            this.config = {};
        }
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

    _resetUIState() {
        this.waitingForTarget = null;
        this._bgOverlayImage = null;
        this._bgOverlayOpacity = 0;
        this._bgOffsetY = 0;
        this._nightFade = 0;
        this.skipRequested = false;
        this._dialogueHistory = [];
        this._hideDialogueNav();
        this._stopPhoneVideo();
        this.showSkipButton(false);
        this.dialogue.hide();
        this.dialogue.hideCloseup?.();

        const ids = ['click-to-start', 'tutorial-interact', 'tutorial-move', 'tutorial-prompt', 'edge-glow-right', 'name-hero-prompt'];
        for (const id of ids) {
            const el = document.getElementById(id);
            if (el) {
                el.classList.add('hidden');
                el.classList.remove('visible', 'fading-out');
                el.style.pointerEvents = '';
            }
        }
    }

    async loadScene(sceneFile) {
        const response = await fetch(sceneFile + '?v=' + Date.now());
        if (!response.ok) throw new Error(`Failed to load scene ${sceneFile}: HTTP ${response.status}`);
        const sceneData = await response.json();
        this.applyCharacterDefaults(sceneData);
        this.currentScene = sceneData;
        this._originalCharacters = JSON.parse(JSON.stringify(sceneData.characters || []));
        this._originalObjects = JSON.parse(JSON.stringify(sceneData.objects || []));
        this.sceneState = { ...(sceneData.initialState || {}) };
        this.sequenceIndex = 0;
        this._resetUIState();
        if (this.renderer._glowCache) this.renderer._glowCache.clear();

        const imageSources = this._collectImageSources(sceneData);
        await this.imageLoader.loadMultiple(imageSources);

        this.updateHitTargets();
        this.render();
        const ctx = this.renderer.ctx;
        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.fillRect(0, 0, this.renderer.width, this.renderer.height);
    }

    _collectImageSources(sceneData) {
        const sources = [];
        if (sceneData.background) sources.push(sceneData.background);
        if (sceneData.nightBackground) sources.push(sceneData.nightBackground);
        if (sceneData.characters) {
            for (const char of sceneData.characters) {
                if (char.image) sources.push(char.image);
            }
        }
        if (sceneData.objects) {
            for (const obj of sceneData.objects) {
                if (obj.image) sources.push(obj.image);
            }
        }
        if (sceneData.closeupImage) sources.push(sceneData.closeupImage);
        if (sceneData.sequence) {
            for (const step of sceneData.sequence) {
                if ((step.type === 'setCharacterImage' || step.type === 'showBgOverlay') && step.image) {
                    sources.push(step.image);
                }
            }
        }
        return sources;
    }

    getState() {
        return { sequenceIndex: this.sequenceIndex };
    }

    /* ── Fast Forward ── */

    fastForwardTo(targetIndex) {
        if (!this.currentScene || !this.currentScene.sequence) return;

        const seq = this.currentScene.sequence;
        const stateTypes = [
            'showCharacter', 'hideCharacter', 'showObject', 'hideObject',
            'setState', 'collectLetter', 'setCharacterImage',
            'switchTrack', 'startMusic', 'stopMusic', 'showBgOverlay', 'hideBgOverlay'
        ];

        for (let i = 0; i < targetIndex && i < seq.length; i++) {
            const step = seq[i];
            if (!stateTypes.includes(step.type)) continue;
            this._fastForwardStep(step);
        }

        this.sequenceIndex = targetIndex;
        this.updateHitTargets();
        this.render();
    }

    _fastForwardStep(step) {
        switch (step.type) {
            case 'showCharacter': this.setCharacterVisible(step.target, true); break;
            case 'hideCharacter': this.setCharacterVisible(step.target, false); break;
            case 'showObject': this.setObjectVisible(step.target, true); break;
            case 'hideObject': this.setObjectVisible(step.target, false); break;
            case 'setState': Object.assign(this.sceneState, step.state); break;
            case 'collectLetter':
                if (this.letterManager) this.letterManager.collect(step.letterId);
                break;
            case 'setCharacterImage': {
                const char = this.currentScene.characters?.find(c => c.id === step.target);
                if (char) char.image = step.image;
                break;
            }
            case 'switchTrack':
                if (this.audioManager && step.track) this.audioManager.switchTo(step.track);
                break;
            case 'startMusic':
                if (this.audioManager) this.audioManager.play();
                break;
            case 'stopMusic':
                if (this.audioManager) this.audioManager.stop();
                break;
            case 'showBgOverlay':
                this._bgOverlayImage = this.imageLoader.get(step.image) || null;
                this._bgOverlayOpacity = this._bgOverlayImage ? 1 : 0;
                break;
            case 'hideBgOverlay':
                this._bgOverlayImage = null;
                this._bgOverlayOpacity = 0;
                break;
            case 'closeup':
                this.dialogue.showCloseup(step.image || null);
                break;
            case 'hideCloseup':
                this.dialogue.hideCloseup();
                break;
            case 'panDown':
                this._bgOffsetY = 0;
                this._nightFade = 0;
                break;
            case 'clickToStart': {
                const el = document.getElementById('click-to-start');
                if (el) { el.classList.add('hidden'); el.classList.remove('visible'); el.style.pointerEvents = 'none'; }
                break;
            }
            case 'showInteractTutorial': {
                const el = document.getElementById('tutorial-interact');
                if (el) { el.classList.remove('hidden', 'fading-out'); el.classList.add('visible'); }
                break;
            }
            case 'hideInteractTutorial': {
                const el = document.getElementById('tutorial-interact');
                if (el) { el.classList.add('hidden'); el.classList.remove('visible', 'fading-out'); }
                break;
            }
            case 'showMoveTutorial': {
                const el = document.getElementById('tutorial-move');
                if (el) { el.classList.add('hidden'); el.classList.remove('visible', 'fading-out'); }
                break;
            }
            case 'playPhoneVideo':
            case 'hidePhoneVideo':
                this._stopPhoneVideo();
                break;
            case 'showDialogueBox':
            case 'hideDialogueBox':
                this.dialogue.hide();
                break;
        }
    }

    /* ── Sequence Runner ── */

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

        const nextArrow = scene.objects?.find(o => o.id === 'next-arrow');
        if (nextArrow && nextArrow.visible === true && nextArrow.interactive) {
            this._showEdgeGlow();
        }

        while (this.sequenceIndex < scene.sequence.length) {
            if (this.stopped) return;
            const step = scene.sequence[this.sequenceIndex];

            if (this.skipRequested && this._trySkipStep(step)) {
                this.sequenceIndex++;
                continue;
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

    _trySkipStep(step) {
        const skippable = ['dialogue', 'narration', 'pause', 'closeup', 'closeupDialogue', 'hideCloseup', 'showBgOverlay', 'hideBgOverlay', 'panDown', 'clickToStart', 'showInteractTutorial', 'hideInteractTutorial', 'showMoveTutorial', 'showDialogueBox', 'hideDialogueBox', 'playPhoneVideo', 'hidePhoneVideo'];
        if (skippable.includes(step.type)) {
            if (step.type === 'hideCloseup') this.dialogue.hideCloseup();
            if (step.type === 'hideBgOverlay') {
                this._bgOverlayImage = null;
                this._bgOverlayOpacity = 0;
            }
            if (step.type === 'panDown') { this._bgOffsetY = 0; this._nightFade = 0; }
            if (step.type === 'clickToStart') {
                const el = document.getElementById('click-to-start');
                if (el) { el.classList.add('hidden'); el.classList.remove('visible'); el.style.pointerEvents = 'none'; }
            }
            if (step.type === 'hideInteractTutorial') {
                const el = document.getElementById('tutorial-interact');
                if (el) { el.classList.add('hidden'); el.classList.remove('visible', 'fading-out'); }
            }
            if (step.type === 'hidePhoneVideo' || step.type === 'playPhoneVideo') {
                this._stopPhoneVideo();
            }
            return true;
        }
        if (step.type === 'showCharacter') {
            this.setCharacterVisible(step.target, true);
            return true;
        }
        if (step.type === 'showObject') {
            this.setObjectVisible(step.target, true);
            return true;
        }
        if (step.type === 'setState') {
            Object.assign(this.sceneState, step.state);
            return true;
        }
        if (step.type === 'collectLetter') {
            if (this.letterManager) this.letterManager.collect(step.letterId);
            return true;
        }
        this.skipRequested = false;
        this.showSkipButton(false);
        this.dialogue.hide();
        this.dialogue.hideCloseup();
        this.updateHitTargets();
        this.render();
        return false;
    }

    /* ── Hit Targets ── */

    updateHitTargets() {
        if (!this.currentScene) return;
        const targets = [
            ...this._buildCharacterTargets(),
            ...this._buildObjectTargets(),
        ];
        this.input.setHitTargets(targets);
    }

    _buildCharacterTargets() {
        const targets = [];
        if (!this.currentScene.characters) return targets;

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
        return targets;
    }

    _buildObjectTargets() {
        const targets = [];
        if (!this.currentScene.objects) return targets;

        for (const obj of this.currentScene.objects) {
            if (!obj.interactive || obj.visible === false) continue;
            if (obj.type === 'hotspot') {
                targets.push({ id: obj.id, x: obj.x, y: obj.y, width: obj.width, height: obj.height });
            } else if (obj.type === 'arrow') {
                const s = obj.size || RENDER.DEFAULT_ARROW_SIZE;
                targets.push({ id: obj.id, x: obj.x - s * 0.5, y: obj.y - s, width: s * 1.7, height: s * 2 });
            } else if (obj.image) {
                if (obj.hitbox) {
                    targets.push({ id: obj.id, ...obj.hitbox });
                } else {
                    const img = this.imageLoader.get(obj.image);
                    const scale = obj.scale || 1;
                    const w = img ? img.naturalWidth * scale : 50;
                    const h = img ? img.naturalHeight * scale : 50;
                    targets.push({ id: obj.id, x: obj.x, y: obj.y, width: w, height: h });
                }
            }
        }
        return targets;
    }

    /* ── Rendering ── */

    render() {
        const scene = this.currentScene;
        if (!scene) return;

        this.renderer.clear();
        this._renderBackground(scene);
        this._renderDarkOverlay();
        this._renderDrawables(scene);
    }

    _renderBackground(scene) {
        const bgImg = this.imageLoader.get(scene.background);
        const nightImg = scene.nightBackground ? this.imageLoader.get(scene.nightBackground) : null;
        const ctx = this.renderer.ctx;
        const w = this.renderer.width;
        const h = this.renderer.height;

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);

        if (bgImg) {
            if (this._bgOffsetY > 0) {
                ctx.drawImage(bgImg, 0, this._bgOffsetY, w, h);

                if (nightImg && this._nightFade > 0) {
                    ctx.save();
                    ctx.globalAlpha = this._nightFade;
                    ctx.drawImage(nightImg, 0, this._bgOffsetY, w, h);
                    ctx.restore();
                }

                const edgeY = this._bgOffsetY;
                const gradH = Math.min(200, h - edgeY);
                const grad = ctx.createLinearGradient(0, edgeY, 0, edgeY + gradH);
                grad.addColorStop(0, 'rgba(0,0,0,1)');
                grad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = grad;
                ctx.fillRect(0, edgeY, w, gradH);
            } else {
                ctx.drawImage(bgImg, 0, 0, w, h);

                if (nightImg && this._nightFade > 0) {
                    ctx.save();
                    ctx.globalAlpha = this._nightFade;
                    ctx.drawImage(nightImg, 0, 0, w, h);
                    ctx.restore();
                }
            }
        }
    }

    _renderDarkOverlay() {
        if (!this.sceneState.dark) return;
        this.renderer.drawDarkOverlay(this.sceneState.darkOpacity || 0.6);
        if (this.sceneState.tvGlow) {
            this.renderer.drawTVGlow(
                this.sceneState.tvGlow.x,
                this.sceneState.tvGlow.y,
                this.sceneState.tvGlow.radius
            );
        }
    }

    _renderDrawables(scene) {
        const drawables = [];

        if (scene.objects) {
            for (const obj of scene.objects) {
                if (obj.visible === false) continue;
                if (obj.type === 'hotspot') continue;
                if (obj.type === 'arrow') {
                    drawables.push({ type: 'arrow', data: obj, y: obj.y, zIndex: obj.zIndex || 10 });
                    continue;
                }
                drawables.push({ type: 'object', data: obj, y: obj.y + (obj.height || 0), zIndex: obj.zIndex || 0 });
            }
        }

        if (scene.characters) {
            for (const char of scene.characters) {
                if (char.visible === false) continue;
                drawables.push({ type: 'character', data: char, y: char.y, zIndex: char.zIndex || 1 });
            }
        }

        if (this._bgOverlayImage && this._bgOverlayOpacity > 0) {
            drawables.push({ type: 'bgOverlay', data: null, y: 0, zIndex: 4 });
        }

        if (this._phoneVideo && this._phoneVideoRect && !this._phoneVideo.paused) {
            drawables.push({ type: 'phoneVideo', data: null, y: 0, zIndex: 6 });
        }

        const glowTarget = this._getHoverGlowTarget(scene);
        if (glowTarget) {
            drawables.push({ type: 'hoverGlow', data: glowTarget, y: glowTarget.y, zIndex: (glowTarget.zIndex || 1) - 0.1 });
        }

        drawables.sort((a, b) => a.zIndex - b.zIndex || a.y - b.y);

        for (const d of drawables) {
            if (d.type === 'bgOverlay') {
                const ctx = this.renderer.ctx;
                ctx.save();
                ctx.globalAlpha = this._bgOverlayOpacity;
                ctx.drawImage(this._bgOverlayImage, 0, 0, this.renderer.width, this.renderer.height);
                ctx.restore();
                continue;
            }
            if (d.type === 'hoverGlow') {
                const g = d.data;
                const glowColor = scene.glowColor || null;
                const glowAlpha = scene.glowAlpha || null;
                if (g.img) {
                    this.renderer.drawSilhouetteGlow(g.img, g.x, g.y, g.scale, g.anchorX, g.anchorY, g.flipX, glowColor, glowAlpha);
                } else if (g.rect) {
                    this.renderer.drawHoverGlow(g.rect.x, g.rect.y, g.rect.width, g.rect.height, glowColor, glowAlpha);
                }
                continue;
            }
            if (d.type === 'phoneVideo') {
                const ctx = this.renderer.ctx;
                const r = this._phoneVideoRect;
                try {
                    ctx.save();
                    ctx.beginPath();
                    const rad = 8;
                    ctx.moveTo(r.x + rad, r.y);
                    ctx.lineTo(r.x + r.w - rad, r.y);
                    ctx.quadraticCurveTo(r.x + r.w, r.y, r.x + r.w, r.y + rad);
                    ctx.lineTo(r.x + r.w, r.y + r.h - rad);
                    ctx.quadraticCurveTo(r.x + r.w, r.y + r.h, r.x + r.w - rad, r.y + r.h);
                    ctx.lineTo(r.x + rad, r.y + r.h);
                    ctx.quadraticCurveTo(r.x, r.y + r.h, r.x, r.y + r.h - rad);
                    ctx.lineTo(r.x, r.y + rad);
                    ctx.quadraticCurveTo(r.x, r.y, r.x + rad, r.y);
                    ctx.closePath();
                    ctx.clip();
                    const crop = this._phoneVideoCrop;
                    if (crop) {
                        ctx.drawImage(this._phoneVideo, crop.x, crop.y, crop.w, crop.h, r.x, r.y, r.w, r.h);
                    } else {
                        ctx.drawImage(this._phoneVideo, r.x, r.y, r.w, r.h);
                    }
                    ctx.restore();
                } catch (e) { /* video not ready yet */ }
                continue;
            }
            const item = d.data;
            if (d.type === 'arrow') {
                this.renderer.drawArrow(item.x, item.y, item.direction || 'right', item.size || RENDER.DEFAULT_ARROW_SIZE, item.color);
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
    }

    _getHoverGlowTarget(scene) {
        if (!this.waitingForTarget || !this.input.hoveredTarget) return null;
        const waiting = Array.isArray(this.waitingForTarget) ? this.waitingForTarget : [this.waitingForTarget];
        if (!waiting.includes(this.input.hoveredTarget)) return null;

        const hoverId = this.input.hoveredTarget;
        if (!scene) return null;

        const glowInfo = this._findGlowSource(hoverId, scene);
        if (glowInfo) {
            const src = scene.characters?.find(c => c.id === hoverId) || scene.objects?.find(o => o.id === hoverId);
            return { img: glowInfo.img, x: glowInfo.x, y: glowInfo.y, scale: glowInfo.scale, anchorX: glowInfo.anchorX, anchorY: glowInfo.anchorY, flipX: glowInfo.flipX, zIndex: src?.zIndex || 1 };
        }

        const targets = this.input._hitTargets || [];
        const target = targets.find(t => t.id === hoverId);
        if (target) {
            const src = scene.characters?.find(c => c.id === hoverId) || scene.objects?.find(o => o.id === hoverId);
            return { rect: target, y: target.y, zIndex: src?.zIndex || 1 };
        }

        return null;
    }

    _findGlowSource(hoverId, scene) {
        const char = scene.characters?.find(c => c.id === hoverId && c.visible !== false);
        if (char?.image) {
            const img = this.imageLoader.get(char.image);
            if (img) return {
                img, x: char.x, y: char.y,
                scale: char.scale || 1,
                anchorX: char.anchorX ?? 0.5,
                anchorY: char.anchorY ?? 1.0,
                flipX: char.flipX || false,
            };
        }

        const obj = scene.objects?.find(o => o.id === hoverId && o.visible !== false);
        if (obj) {
            if (obj.image) {
                const img = this.imageLoader.get(obj.image);
                if (img) return {
                    img, x: obj.x, y: obj.y,
                    scale: obj.scale || 1,
                    anchorX: obj.anchorX ?? 0,
                    anchorY: obj.anchorY ?? 0,
                    flipX: obj.flipX || false,
                };
            }
            if (obj.glowTarget) {
                const ref = scene.characters?.find(c => c.id === obj.glowTarget && c.visible !== false)
                         || scene.objects?.find(o => o.id === obj.glowTarget && o.visible !== false);
                if (ref?.image) {
                    const img = this.imageLoader.get(ref.image);
                    if (img) return {
                        img, x: ref.x, y: ref.y,
                        scale: ref.scale || 1,
                        anchorX: ref.anchorX ?? (scene.characters?.includes(ref) ? 0.5 : 0),
                        anchorY: ref.anchorY ?? (scene.characters?.includes(ref) ? 1.0 : 0),
                        flipX: ref.flipX || false,
                    };
                }
            }
        }

        return null;
    }

    /* ── Step Execution ── */

    async executeStep(step) {
        const handler = this._stepHandlers[step.type];
        if (handler) {
            await handler(step);
        } else {
            console.warn('Unknown step type:', step.type);
        }
    }

    async _handleDialogue(step) {
        this._dialogueHistory.push({ index: this.sequenceIndex, step });
        const remaining = this.countConsecutiveDialogueSteps(this.sequenceIndex);
        this.showSkipButton(remaining >= 3);
        this.dialogue.show(this._substituteHeroName(step.speaker), this._substituteHeroName(step.text));
        this._showDialogueNav();
        const action = await this.waitForDialogueNav();
        this.dialogue.hide();
        this.showSkipButton(false);
        if (action === 'prev' && this._dialogueHistory.length >= 2) {
            this._dialogueHistory.pop();
            const prevEntry = this._dialogueHistory.pop();
            this._rewindToStep(prevEntry.index);
        }
    }

    async _handleNarration(step) {
        this._dialogueHistory.push({ index: this.sequenceIndex, step });
        const remaining = this.countConsecutiveDialogueSteps(this.sequenceIndex);
        this.showSkipButton(remaining >= 3);
        this.dialogue.showNarrationText(this._substituteHeroName(step.text));
        this._showDialogueNav();
        const action = await this.waitForDialogueNav();
        this.dialogue.hide();
        this.showSkipButton(false);
        if (action === 'prev' && this._dialogueHistory.length >= 2) {
            this._dialogueHistory.pop();
            const prevEntry = this._dialogueHistory.pop();
            this._rewindToStep(prevEntry.index);
        }
    }

    async _handleWaitForClick(step) {
        this.waitingForTarget = step.target;
        this.updateHitTargets();
        this.render();
        await this.waitForTargetClick(step.target);
        this.waitingForTarget = null;
    }

    async _handleWaitForClickBranch(step) {
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
    }

    _handleShowCharacter(step) {
        this.setCharacterVisible(step.target, true);
        this.updateHitTargets();
        this.render();
    }

    async _handleSetCharacterImage(step) {
        const char = this.currentScene?.characters?.find(c => c.id === step.target);
        if (char && step.image) {
            await this.imageLoader.loadMultiple([step.image]);
            char.image = step.image;
            this.render();
        }
    }

    _handleHideCharacter(step) {
        this.setCharacterVisible(step.target, false);
        this.updateHitTargets();
        this.render();
    }

    _handleShowObject(step) {
        this.setObjectVisible(step.target, true);
        this.updateHitTargets();
        this.render();
        if (step.target === 'next-arrow') this._showEdgeGlow();
    }

    _handleHideObject(step) {
        this.setObjectVisible(step.target, false);
        this.updateHitTargets();
        this.render();
    }

    _handleSetState(step) {
        Object.assign(this.sceneState, step.state);
        this.render();
    }

    _handleCloseup(step) {
        this.dialogue.showCloseup(step.image || null);
    }

    async _handleCloseupDialogue(step) {
        this._dialogueHistory.push({ index: this.sequenceIndex, step });
        const remaining = this.countConsecutiveDialogueSteps(this.sequenceIndex);
        this.showSkipButton(remaining >= 3);
        this.dialogue.showCloseupText(this._substituteHeroName(step.speaker), this._substituteHeroName(step.text), step.html);
        this._showDialogueNav();
        const action = await this.waitForDialogueNav();
        this.dialogue.hide();
        this.showSkipButton(false);
        if (action === 'prev' && this._dialogueHistory.length >= 2) {
            this._dialogueHistory.pop();
            const prevEntry = this._dialogueHistory.pop();
            this._rewindToStep(prevEntry.index);
        }
    }

    async _handleCollectLetter(step) {
        if (!this.letterManager) return;
        this.letterManager.collect(step.letterId);
        if (this.uiManager) {
            this.uiManager.addUnreadLetter();
            await this.uiManager.showSingleLetter(step.letterId);
        }
    }

    _handleShowTutorial() {
        const el = document.getElementById('tutorial-prompt');
        if (el) {
            el.classList.remove('hidden', 'fading-out', 'visible');
            el.offsetHeight;
            requestAnimationFrame(() => {
                requestAnimationFrame(() => el.classList.add('visible'));
            });
        }
    }

    _handleHideTutorial() {
        const el = document.getElementById('tutorial-prompt');
        if (el) {
            el.classList.remove('visible');
            el.classList.add('fading-out');
            setTimeout(() => {
                el.classList.add('hidden');
                el.classList.remove('fading-out');
            }, 500);
        }
    }

    _handleShowInteractTutorial() {
        const el = document.getElementById('tutorial-interact');
        if (el) {
            el.classList.remove('hidden', 'fading-out', 'visible');
            el.offsetHeight;
            requestAnimationFrame(() => {
                requestAnimationFrame(() => el.classList.add('visible'));
            });
        }
    }

    _handleShowMoveTutorial() {
        return new Promise((resolve) => {
            const keysPrompt = document.getElementById('tutorial-prompt');
            const movePrompt = document.getElementById('tutorial-move');
            if (!keysPrompt && !movePrompt) { resolve(); return; }

            const keys = ['a', 'd', 'arrowleft', 'arrowright'];

            if (keysPrompt) {
                keysPrompt.classList.remove('hidden', 'fading-out', 'visible');
                keysPrompt.offsetHeight;
                requestAnimationFrame(() => keysPrompt.classList.add('visible'));
            }

            const handler = (e) => {
                if (!keys.includes(e.key.toLowerCase())) return;
                document.removeEventListener('keydown', handler);

                if (keysPrompt) {
                    keysPrompt.classList.remove('visible');
                    keysPrompt.classList.add('fading-out');
                    setTimeout(() => {
                        keysPrompt.classList.add('hidden');
                        keysPrompt.classList.remove('fading-out');

                        if (movePrompt) {
                            movePrompt.classList.remove('hidden', 'fading-out', 'visible');
                            requestAnimationFrame(() => movePrompt.classList.add('visible'));
                        }
                        const glow = document.getElementById('edge-glow-right');
                        if (glow) { glow.classList.remove('hidden'); glow.classList.add('visible'); }
                        resolve();
                    }, 1200);
                } else {
                    if (movePrompt) {
                        movePrompt.classList.remove('hidden', 'fading-out', 'visible');
                        requestAnimationFrame(() => movePrompt.classList.add('visible'));
                    }
                    const glow = document.getElementById('edge-glow-right');
                    if (glow) { glow.classList.remove('hidden'); glow.classList.add('visible'); }
                    resolve();
                }
            };
            document.addEventListener('keydown', handler);
        });
    }

    _handleHideInteractTutorial() {
        const el = document.getElementById('tutorial-interact');
        if (el) {
            el.classList.remove('visible');
            el.classList.add('fading-out');
            setTimeout(() => {
                el.classList.add('hidden');
                el.classList.remove('fading-out');
            }, 500);
        }
    }

    async _handleDialogueOptions(step) {
        const chosen = await this.showDialogueOptions(step.speaker, step.prompt, step.options);
        this.playerChoices.push(chosen.category);
        if (chosen.followUp) {
            this.dialogue.show(step.speaker, chosen.followUp);
            await this.waitForAnyClick();
            this.dialogue.hide();
        }
    }

    _handleDetermineEnding(step) {
        const ending = this.determineEnding();
        const endingMap = step.endings || {};
        const nextScene = endingMap[ending];
        if (nextScene) this.currentScene.nextScene = nextScene;
    }

    async _handleShowNote(step) {
        if (this.uiManager) {
            await this.uiManager.showNote(step.title || '', step.text || '', step.cssClass || '');
        }
    }

    async _handleShowBgOverlay(step) {
        const img = this.imageLoader.get(step.image);
        if (img) {
            this._bgOverlayImage = img;
            this._bgOverlayOpacity = 0;
            await this._animateOverlay(0, 1, step.fadeDuration || RENDER.OVERLAY_FADE_MS);
        }
    }

    async _handleHideBgOverlay() {
        if (this._bgOverlayImage) {
            await this._animateOverlay(1, 0, RENDER.OVERLAY_FADE_MS);
            this._bgOverlayImage = null;
            this._bgOverlayOpacity = 0;
            this.render();
        }
    }

    _substituteHeroName(str) {
        if (!str || this.heroName === 'Hero') return str;
        return str.replace(/\bHero\b/g, this.heroName);
    }

    _handleNameHero() {
        return new Promise(resolve => {
            const el = document.getElementById('name-hero-prompt');
            const input = document.getElementById('hero-name-input');
            const btn = document.getElementById('hero-name-confirm');
            if (!el || !input || !btn) { resolve(); return; }

            el.classList.remove('hidden');
            requestAnimationFrame(() => {
                el.classList.add('visible');
                input.focus();
            });

            const confirm = () => {
                btn.removeEventListener('click', confirm);
                input.removeEventListener('keydown', onKey);
                const name = input.value.trim() || 'Hero';
                this.heroName = name;
                if (this.uiManager) this.uiManager.heroName = name;

                el.classList.remove('visible');
                el.classList.add('fading-out');
                setTimeout(() => {
                    el.classList.add('hidden');
                    el.classList.remove('fading-out');
                    resolve();
                }, 800);
            };

            const onKey = (e) => {
                if (e.key === 'Enter') confirm();
            };

            btn.addEventListener('click', confirm);
            input.addEventListener('keydown', onKey);
        });
    }

    _handlePanDown(step) {
        const duration = step.duration || RENDER.PAN_DOWN_MS;
        const hasNight = !!this.currentScene?.nightBackground;
        return new Promise(resolve => {
            this._bgOffsetY = GAME.HEIGHT;
            if (hasNight) this._nightFade = 1;
            const start = performance.now();
            const animate = (now) => {
                const t = Math.min((now - start) / duration, 1);
                const eased = 1 - Math.pow(1 - t, 3);
                this._bgOffsetY = GAME.HEIGHT * (1 - eased);
                if (hasNight) {
                    const fadeT = Math.max(0, (t - 0.4) / 0.6);
                    this._nightFade = 1 - fadeT;
                }
                if (t < 1) {
                    requestAnimationFrame(animate);
                } else {
                    this._bgOffsetY = 0;
                    this._nightFade = 0;
                    resolve();
                }
            };
            requestAnimationFrame(animate);
        });
    }

    _handleClickToStart() {
        return new Promise(resolve => {
            const el = document.getElementById('click-to-start');
            if (!el) { resolve(); return; }

            const hasNight = !!this.currentScene?.nightBackground;
            let cycling = hasNight;
            let cycleStart = performance.now();
            const cycleDuration = 8000;
            let cycleRAF;

            if (cycling) {
                this._nightFade = 0;
                const holdDayPct = 0.15;
                const dayToNightPct = 0.25;
                const holdNightPct = 0.20;
                const nightToDayPct = 0.25;

                const animateCycle = (now) => {
                    if (!cycling) return;
                    const p = ((now - cycleStart) / cycleDuration) % 1;

                    if (p < holdDayPct) {
                        this._nightFade = 0;
                    } else if (p < holdDayPct + dayToNightPct) {
                        this._nightFade = (p - holdDayPct) / dayToNightPct;
                    } else if (p < holdDayPct + dayToNightPct + holdNightPct) {
                        this._nightFade = 1;
                    } else if (p < holdDayPct + dayToNightPct + holdNightPct + nightToDayPct) {
                        this._nightFade = 1 - (p - holdDayPct - dayToNightPct - holdNightPct) / nightToDayPct;
                    } else {
                        this._nightFade = 0;
                    }

                    cycleRAF = requestAnimationFrame(animateCycle);
                };
                cycleRAF = requestAnimationFrame(animateCycle);
            }

            setTimeout(() => {
                el.classList.remove('hidden');
                requestAnimationFrame(() => el.classList.add('visible'));
            }, 2500);

            let started = false;
            const onClick = () => {
                if (!started) return;
                document.removeEventListener('click', onClick);
                cycling = false;
                if (cycleRAF) cancelAnimationFrame(cycleRAF);

                el.classList.remove('visible');
                el.classList.add('fading-out');

                if (hasNight && this._nightFade > 0.01) {
                    const fadeFrom = this._nightFade;
                    const fadeStart = performance.now();
                    const fadeDur = 800;
                    const fadeOut = (now) => {
                        const ft = Math.min((now - fadeStart) / fadeDur, 1);
                        this._nightFade = fadeFrom * (1 - ft);
                        if (ft < 1) {
                            requestAnimationFrame(fadeOut);
                        } else {
                            this._nightFade = 0;
                            el.classList.add('hidden');
                            el.classList.remove('fading-out');
                            resolve();
                        }
                    };
                    requestAnimationFrame(fadeOut);
                } else {
                    this._nightFade = 0;
                    setTimeout(() => {
                        el.classList.add('hidden');
                        el.classList.remove('fading-out');
                        resolve();
                    }, 800);
                }
            };
            document.addEventListener('click', onClick);
            setTimeout(() => { started = true; }, 2500);
        });
    }

    async _handlePlayPhoneVideo(step) {
        const videoEl = document.getElementById('phone-video');
        if (!videoEl) return;

        videoEl.src = step.src + '?v=' + Date.now();
        videoEl.loop = step.loop !== false;
        videoEl.muted = step.muted !== false;

        const phoneRect = step.phoneRect || { x: 714, y: 259, w: 92, h: 112 };
        const charId = step.character || 'drew-closeup';
        const char = this.currentScene?.characters?.find(c => c.id === charId);

        if (char) {
            const img = this.imageLoader.get(char.image);
            const scale = char.scale || 1;
            const anchorX = char.anchorX ?? 0.5;
            const anchorY = char.anchorY ?? 1.0;
            const imgW = img ? img.width : 1206;
            const imgH = img ? img.height : 685;
            const drawX = char.x - imgW * scale * anchorX;
            const drawY = char.y - imgH * scale * anchorY;

            this._phoneVideoRect = {
                x: drawX + phoneRect.x * scale,
                y: drawY + phoneRect.y * scale,
                w: phoneRect.w * scale,
                h: phoneRect.h * scale,
            };
        }

        this._phoneVideoCrop = step.videoCrop || null;
        this._phoneVideo = videoEl;
        try { await videoEl.play(); } catch (e) {
            console.warn('Phone video autoplay blocked:', e);
        }
    }

    _handleHidePhoneVideo() {
        this._stopPhoneVideo();
    }

    _stopPhoneVideo() {
        if (this._phoneVideo) {
            this._phoneVideo.pause();
            this._phoneVideo.removeAttribute('src');
            this._phoneVideo.load();
        }
        this._phoneVideo = null;
        this._phoneVideoRect = null;
        this._phoneVideoCrop = null;
    }

    _handleSwitchTrack(step) {
        if (this.audioManager && step.track) {
            this.audioManager.switchTo(step.track);
            this.manualTrackOverride = true;
        }
    }

    _handleStartMusic(step) {
        if (this.audioManager) this.audioManager.fadeIn(step.fadeDuration || AUDIO.START_MUSIC_MS);
    }

    async _handleStopMusic(step) {
        if (this.audioManager) await this.audioManager.fadeOut(step.fadeDuration || AUDIO.FADE_OUT_MS);
    }

    /* ── Helpers ── */

    setCharacterVisible(id, visible) {
        if (!this.currentScene || !this.currentScene.characters) return;
        const char = this.currentScene.characters.find(c => c.id === id);
        if (char) char.visible = visible;
    }

    setObjectVisible(id, visible) {
        if (!this.currentScene || !this.currentScene.objects) return;
        const obj = this.currentScene.objects.find(o => o.id === id);
        if (obj) {
            obj.visible = visible;
            obj.interactive = visible;
        }
    }

    countConsecutiveDialogueSteps(fromIndex) {
        const seq = this.currentScene.sequence;
        let count = 0;
        const dialogueTypes = ['dialogue', 'narration', 'closeupDialogue'];
        const passthrough = ['closeup', 'hideCloseup', 'showCharacter', 'showObject', 'pause'];
        for (let i = fromIndex; i < seq.length; i++) {
            if (dialogueTypes.includes(seq[i].type)) count++;
            else if (passthrough.includes(seq[i].type)) continue;
            else break;
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

    waitForDialogueNav() {
        return new Promise((resolve) => {
            let resolved = false;
            const allPrevBtns = ['dialogue-prev', 'closeup-prev', 'narration-prev'].map(id => document.getElementById(id));
            const allNextBtns = ['dialogue-next', 'closeup-next', 'narration-next'].map(id => document.getElementById(id));
            const listeners = [];

            const finish = (action) => {
                if (resolved) return;
                resolved = true;
                this._skipResolve = null;
                this.input.removeClickCallback(clickHandler);
                for (const { el, fn } of listeners) el.removeEventListener('click', fn);
                resolve(action);
            };

            const clickHandler = () => finish('next');
            this._skipResolve = () => finish('next');
            this.input.onClick(clickHandler);

            for (const btn of allPrevBtns) {
                if (!btn) continue;
                const fn = (e) => { e.stopPropagation(); finish('prev'); };
                btn.addEventListener('click', fn);
                listeners.push({ el: btn, fn });
            }
            for (const btn of allNextBtns) {
                if (!btn) continue;
                const fn = (e) => { e.stopPropagation(); finish('next'); };
                btn.addEventListener('click', fn);
                listeners.push({ el: btn, fn });
            }
        });
    }

    _showDialogueNav() {
        const hasPrev = this._dialogueHistory.length >= 2;
        for (const id of ['dialogue-nav', 'narration-nav', 'closeup-dialogue-nav']) {
            const el = document.getElementById(id);
            if (el) el.classList.toggle('hidden', !hasPrev);
        }
    }

    _hideDialogueNav() {
        for (const id of ['dialogue-nav', 'narration-nav', 'closeup-dialogue-nav']) {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        }
    }

    _showEdgeGlow() {
        const glow = document.getElementById('edge-glow-right');
        if (glow) { glow.classList.remove('hidden'); glow.classList.add('visible'); }
    }

    _restoreSceneDefaults() {
        this.currentScene.characters = JSON.parse(JSON.stringify(this._originalCharacters));
        this.currentScene.objects = JSON.parse(JSON.stringify(this._originalObjects));
        this.sceneState = { ...(this.currentScene.initialState || {}) };
        this._bgOverlayImage = null;
        this._bgOverlayOpacity = 0;
        this._bgOffsetY = 0;
    }

    _rewindToStep(targetIndex) {
        this._restoreSceneDefaults();
        const seq = this.currentScene.sequence;
        for (let i = 0; i < targetIndex && i < seq.length; i++) {
            this._fastForwardStep(seq[i]);
        }
        this.sequenceIndex = targetIndex - 1;
        this.updateHitTargets();
        this.render();
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

    _animateOverlay(from, to, duration) {
        return new Promise(resolve => {
            const start = performance.now();
            const tick = (now) => {
                const progress = Math.min((now - start) / duration, 1);
                this._bgOverlayOpacity = from + (to - from) * progress;
                this.render();
                if (progress < 1) {
                    requestAnimationFrame(tick);
                } else {
                    resolve();
                }
            };
            requestAnimationFrame(tick);
        });
    }

    async fadeOut() {
        const ctx = this.renderer.ctx;
        const w = this.renderer.width;
        const h = this.renderer.height;
        const duration = (this.currentScene && this.currentScene.fadeDuration) || RENDER.DEFAULT_FADE_MS;
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
        const duration = (this.currentScene && this.currentScene.fadeDuration) || RENDER.DEFAULT_FADE_MS;
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
