class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.container = document.getElementById('game-container');

        this.renderer = new Renderer(this.canvas);
        this.imageLoader = new ImageLoader();
        this.input = new InputManager(this.canvas, this.container);
        this.dialogue = new DialogueManager();
        this.saveManager = new SaveManager();
        this.letterManager = new LetterManager();
        this.audioManager = new AudioManager();
        this.sceneManager = new SceneManager(
            this.renderer, this.imageLoader, this.input, this.dialogue, this.letterManager
        );
        this.sceneManager.audioManager = this.audioManager;
        this.ui = new UIManager(this.saveManager, this.letterManager, this.input, this.audioManager);
        this.sceneManager.uiManager = this.ui;

        this.scenes = [
            'data/scene1.json', 'data/scene1-5.json', 'data/scene2.json', 'data/scene3.json',
            'data/scene4.json', 'data/scene5.json', 'data/scene6.json',
            'data/scene7.json', 'data/scene8.json', 'data/scene9.json',
            'data/scene10.json', 'data/scene11.json', 'data/scene12.json',
            'data/scene13.json', 'data/scene14.json', 'data/scene15.json',
            'data/scene16.json', 'data/scene17.json', 'data/scene18.json',
            'data/scene19.json', 'data/scene20.json', 'data/scene21.json',
            'data/scene22.json'
        ];
        this.sceneNames = [
            'Bedroom', 'Stairwell', 'Living Room', 'House Exterior',
            'House Lane', 'Dirt Path', "Neighbour's Lane",
            'Cows', 'Dirt Road 2', 'Bus Stop',
            'Town Entrance', 'Town', 'Convenience Store',
            'Store Shelves', 'Store (Counter)', 'Convenience Store (Cont.)',
            'Town (After Store)', 'Town Continued (Drew)', 'Town Continued (Lady)',
            'Front of Bridge', 'End of Bridge', 'Forest',
            'Grave'
        ];
        this.currentSceneIndex = 0;
        this.activeSlot = null;
        this.sceneProgress = {};
        this.browsingCompleted = false;
        this._transitioning = false;
        this.outdoorChain = [3, 4, 5, 6, 7, 8, 9, 10, 11, 16, 17, 18, 19, 20, 21];

        this.sceneManager.onSceneEnd = (nextScene) => {
            this._saveSceneProgress(this.sceneManager.sequenceIndex);
            if (nextScene) {
                this.loadSceneByFile(nextScene);
            } else {
                this.nextScene();
            }
        };

        this.sceneManager.onStepAdvance = (stepIndex) => {
            this._saveSceneProgress(stepIndex);
        };

        this.input.onHoverChange = () => {
            if (this.sceneManager.waitingForTarget) {
                this.sceneManager.render();
            }
        };

        this._wireUI();
        this._wireReset();
        this._wireSceneSelector();
        this._startGameLoop();
        this.fitToWindow();
        window.addEventListener('resize', () => this.fitToWindow());
    }

    _wireUI() {
        this.ui.onNewGame = () => {
            this.activeSlot = null;
            this.sceneProgress = {};
            this.browsingCompleted = false;
            this.letterManager.setCollected([]);
            this.loadSceneByIndex(0);
        };

        this.ui.onLoadSave = (saveData, slotIndex) => {
            this.activeSlot = slotIndex;
            this.letterManager.setCollected(saveData.letters || []);
            this.sceneProgress = saveData.sceneProgress || {};
            this.browsingCompleted = false;
            if (saveData.sceneIndex >= 4) {
                this.audioManager.play();
            }
            this.loadSceneByIndex(saveData.sceneIndex, saveData.sequenceIndex);
        };

        this.ui.onSaveGame = (slotIndex) => {
            const state = this.sceneManager.getState();
            this._saveSceneProgress(state.sequenceIndex);
            this.saveManager.save(slotIndex, {
                sceneIndex: this.currentSceneIndex,
                sequenceIndex: state.sequenceIndex,
                sceneName: this.sceneNames[this.currentSceneIndex] || '',
                letters: this.letterManager.getCollectedIds(),
                sceneProgress: this.sceneProgress
            });
            this.activeSlot = slotIndex;
        };

        this.ui.onResume = () => {};

        this.ui.onQuitToMenu = () => {
            this.sceneManager.stop();
            this.audioManager.stop();
            this.browsingCompleted = false;
            this.activeSlot = null;
        };
    }

    _wireReset() {
        const btn = document.getElementById('btn-reset-sim');
        if (!btn) return;
        btn.addEventListener('click', () => {
            this.sceneManager.stop();
            this.audioManager.stop();
            this.saveManager.delete(0);
            this.saveManager.delete(1);
            this.saveManager.delete(2);
            this.letterManager.setCollected([]);
            this.sceneProgress = {};
            this.browsingCompleted = false;
            this.activeSlot = null;
            this.currentSceneIndex = 0;
            this.ui.hideAll();
            this.ui.showHomepage();
        });
    }

    _wireSceneSelector() {
        const btn = document.getElementById('btn-select-scene');
        const list = document.getElementById('scene-list');
        if (!btn || !list) return;

        this.sceneNames.forEach((name, i) => {
            const option = document.createElement('button');
            option.textContent = `${i + 1}. ${name}`;
            option.addEventListener('click', () => {
                list.classList.add('hidden');
                this.sceneManager.stop();
                this.ui.hideAll();
                this.ui.showHUD();
                this.loadSceneByIndex(i);
            });
            list.appendChild(option);
        });

        btn.addEventListener('click', () => {
            list.classList.toggle('hidden');
        });

        document.addEventListener('click', (e) => {
            if (!list.classList.contains('hidden') && !list.contains(e.target) && e.target !== btn) {
                list.classList.add('hidden');
            }
        });
    }

    _startGameLoop() {
        const speed = 7;
        const tick = () => {
            requestAnimationFrame(tick);
            if (this._transitioning) return;
            if (this.sceneManager.fading) return;
            if (!this.sceneManager.currentScene) return;
            if (this.input.blocked) return;
            const hero = this.sceneManager.currentScene.characters?.find(c => c.id === 'hero');
            if (!hero || hero.visible === false) return;

            const wantLeft = this.input.isKeyDown('a') || this.input.isKeyDown('arrowleft');
            const wantRight = this.input.isKeyDown('d') || this.input.isKeyDown('arrowright');

            let dir = null;
            if (wantLeft && wantRight) {
                dir = this.input.lastHorizontal;
            } else if (wantLeft) {
                dir = 'left';
            } else if (wantRight) {
                dir = 'right';
            }

            if (dir === 'left') {
                hero.x -= speed;
                hero.flipX = true;
            } else if (dir === 'right') {
                hero.x += speed;
                hero.flipX = false;
            }

            if (dir) {
                hero.x = Math.round(Math.max(0, Math.min(1920, hero.x)));
                this._checkEdgeTransition(hero, dir);
                this._checkBackwardTransition(hero);
            }
            this.sceneManager.render();
        };
        requestAnimationFrame(tick);
    }

    _checkEdgeTransition(hero, dir) {
        const sm = this.sceneManager;

        if (this.browsingCompleted) {
            if (dir === 'right' && hero.x >= 1900) {
                this._navigateForward();
            }
            return;
        }

        if (!sm.waitingForTarget) return;

        const waiting = Array.isArray(sm.waitingForTarget) ? sm.waitingForTarget : [sm.waitingForTarget];
        const scene = sm.currentScene;
        if (!scene || !scene.objects) return;

        for (const targetId of waiting) {
            const obj = scene.objects.find(o => o.id === targetId && o.type === 'arrow' && o.visible !== false);
            if (!obj) continue;

            const atRightEdge = dir === 'right' && hero.x >= 1900;
            const atLeftEdge = dir === 'left' && hero.x <= 20;
            const arrowIsRight = obj.direction === 'right' || obj.x > 960;
            const arrowIsLeft = obj.direction === 'left' || obj.x < 960;
            const arrowIsDown = obj.direction === 'down';

            if ((atRightEdge && (arrowIsRight || arrowIsDown)) || (atLeftEdge && arrowIsLeft)) {
                sm.forceResolveWait();
                break;
            }
        }
    }

    _saveSceneProgress(stepIndex) {
        const prev = this.sceneProgress[this.currentSceneIndex] || 0;
        this.sceneProgress[this.currentSceneIndex] = Math.max(prev, stepIndex);
    }

    _canNavigate() {
        const sm = this.sceneManager;
        if (sm.dialogue.isShowing || sm.dialogue.isCloseup) return false;
        if (this.ui.isMenuOpen()) return false;
        if (this.browsingCompleted) return true;
        if (sm.waitingForTarget) return true;
        if (!sm.isProcessing) return true;
        return false;
    }

    _checkBackwardTransition(hero) {
        if (hero.x > 20) return;
        if (this._transitioning) return;
        if (!this._canNavigate()) return;

        const chainIdx = this.outdoorChain.indexOf(this.currentSceneIndex);
        if (chainIdx <= 0) return;

        const prevSceneIndex = this.outdoorChain[chainIdx - 1];

        this._transitioning = true;
        this._saveSceneProgress(this.sceneManager.sequenceIndex);
        this.sceneManager.stop();
        this.loadCompletedScene(prevSceneIndex).then(() => {
            this._transitioning = false;
        });
    }

    _navigateForward() {
        if (this._transitioning) return;

        const chainIdx = this.outdoorChain.indexOf(this.currentSceneIndex);
        let nextIndex;

        if (chainIdx !== -1 && chainIdx < this.outdoorChain.length - 1) {
            nextIndex = this.outdoorChain[chainIdx + 1];
        } else {
            nextIndex = this.currentSceneIndex + 1;
        }

        if (nextIndex >= this.scenes.length) return;

        this._transitioning = true;
        this.sceneManager.stop();
        this.loadSceneWithProgress(nextIndex).then(() => {
            this._transitioning = false;
        });
    }

    async loadCompletedScene(index) {
        this.currentSceneIndex = index;
        this.browsingCompleted = true;
        await this.sceneManager.loadScene(this.scenes[index]);

        const progress = this.sceneProgress[index];
        if (progress !== undefined) {
            this.sceneManager.fastForwardTo(progress);
        }

        if (index >= 4 && !this.audioManager.playing) {
            this.audioManager.play();
        }

        await this.sceneManager.fadeIn();
    }

    async loadSceneWithProgress(index) {
        if (index >= this.scenes.length) {
            this.showEndScreen();
            return;
        }

        this.currentSceneIndex = index;
        await this.sceneManager.loadScene(this.scenes[index]);

        const progress = this.sceneProgress[index];
        const seqLength = this.sceneManager.currentScene?.sequence?.length || 0;

        if (index >= 4 && !this.audioManager.playing) {
            this.audioManager.play();
        }

        if (progress !== undefined && progress >= seqLength) {
            this.browsingCompleted = true;
            this.sceneManager.fastForwardTo(progress);
            await this.sceneManager.fadeIn();
        } else if (progress !== undefined && progress > 0) {
            this.browsingCompleted = false;
            this.sceneManager.fastForwardTo(progress);
            await this.sceneManager.fadeIn();
            await this.sceneManager.runSequence();
        } else {
            this.browsingCompleted = false;
            await this.sceneManager.fadeIn();
            await this.sceneManager.runSequence();
        }
    }

    fitToWindow() {
        const windowW = window.innerWidth;
        const windowH = window.innerHeight;
        const gameW = 1920;
        const gameH = 1080;

        const scale = Math.max(windowW / gameW, windowH / gameH);
        const offsetX = (windowW - gameW * scale) / 2;
        const offsetY = (windowH - gameH * scale) / 2;

        this.container.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    }

    async start() {
        await this.sceneManager.loadConfig('data/config.json');
        await this.letterManager.loadLetterData('data/letters.json');
        this.audioManager.load('assets/audio/music.mp3');
        this.ui.showHomepage();
    }

    async loadSceneByIndex(index, jumpToStep) {
        if (index >= this.scenes.length) {
            this.showEndScreen();
            return;
        }
        this.currentSceneIndex = index;
        await this.sceneManager.loadScene(this.scenes[index]);

        if (jumpToStep !== undefined && jumpToStep > 0) {
            this.sceneManager.fastForwardTo(jumpToStep);
        }

        await this.sceneManager.fadeIn();
        await this.sceneManager.runSequence();
    }

    async loadSceneByFile(file) {
        const index = this.scenes.indexOf(file);
        if (index !== -1) {
            this.currentSceneIndex = index;
        }
        await this.sceneManager.loadScene(file);
        await this.sceneManager.fadeIn();
        await this.sceneManager.runSequence();

        if (!this.sceneManager.currentScene?.nextScene && file.includes('scene20')) {
            this.sceneManager.stop();
            this.activeSlot = null;
            this.ui.hideAll();
            this.ui.showHomepage();
        }
    }

    async nextScene() {
        await this.loadSceneByIndex(this.currentSceneIndex + 1);
    }

    showEndScreen() {
        this.renderer.clear();
        const ctx = this.renderer.ctx;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 1920, 1080);
        ctx.fillStyle = '#fff';
        ctx.font = '48px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('End of Demo', 960, 500);
        ctx.font = '28px Georgia, serif';
        ctx.fillStyle = '#999';
        ctx.fillText('Thank you for playing.', 960, 560);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window._game = new Game();
    window._game.start();
});
