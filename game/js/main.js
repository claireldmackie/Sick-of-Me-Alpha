class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.container = document.getElementById('game-container');

        this.renderer = new Renderer(this.canvas);
        this.imageLoader = new ImageLoader();
        this.input = new InputManager(this.canvas, this.container);
        this.dialogue = new DialogueManager();
        this.sceneManager = new SceneManager(
            this.renderer, this.imageLoader, this.input, this.dialogue
        );

        this.scenes = ['data/scene1.json', 'data/scene2.json', 'data/scene3.json'];
        this.currentSceneIndex = 0;

        this.sceneManager.onSceneEnd = (nextScene) => {
            if (nextScene) {
                this.loadSceneByFile(nextScene);
            } else {
                this.nextScene();
            }
        };

        this.input.onHoverChange = () => {
            if (this.sceneManager.waitingForTarget) {
                this.sceneManager.render();
            }
        };

        this.fitToWindow();
        window.addEventListener('resize', () => this.fitToWindow());
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
        await this.loadSceneByIndex(0);
    }

    async loadSceneByIndex(index) {
        if (index >= this.scenes.length) {
            this.showEndScreen();
            return;
        }
        this.currentSceneIndex = index;
        await this.sceneManager.loadScene(this.scenes[index]);
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
    const game = new Game();
    game.start();
});
