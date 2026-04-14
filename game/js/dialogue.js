class DialogueManager {
    constructor() {
        this.dialogueBox = document.getElementById('dialogue-box');
        this.speakerEl = document.getElementById('dialogue-speaker');
        this.textEl = document.getElementById('dialogue-text');
        this.narrationBox = document.getElementById('narration-box');
        this.narrationTextEl = document.getElementById('narration-text');
        this.closeupOverlay = document.getElementById('closeup-overlay');
        this.closeupContent = document.getElementById('closeup-content');
        this.closeupDialogueBox = document.getElementById('closeup-dialogue-box');
        this.closeupSpeaker = document.getElementById('closeup-speaker');
        this.closeupText = document.getElementById('closeup-text');
        this.closeupCloseBtn = document.getElementById('closeup-close-btn');

        this.isShowing = false;
        this.isCloseup = false;
    }

    show(speaker, text) {
        this.speakerEl.textContent = speaker || '';
        this.textEl.textContent = text;
        this.dialogueBox.classList.remove('hidden');
        this.isShowing = true;
    }

    showNarrationText(text) {
        this.narrationTextEl.textContent = text;
        this.narrationBox.classList.remove('hidden');
        this.isShowing = true;
    }

    showCloseup(imageUrl, showCloseBtn) {
        const existing = this.closeupContent.querySelector('img:not(.close-btn img)');
        if (existing) existing.remove();
        if (imageUrl) {
            const img = document.createElement('img');
            img.src = imageUrl;
            this.closeupContent.appendChild(img);
        }
        if (showCloseBtn) {
            this.closeupCloseBtn.classList.remove('hidden');
        } else {
            this.closeupCloseBtn.classList.add('hidden');
        }
        this.closeupOverlay.classList.remove('hidden');
        this.isCloseup = true;
    }

    waitForCloseupClose() {
        return new Promise((resolve) => {
            const handler = () => {
                this.closeupCloseBtn.removeEventListener('click', handler);
                resolve();
            };
            this.closeupCloseBtn.addEventListener('click', handler);
        });
    }

    showCloseupText(speaker, text, useHtml) {
        this.closeupSpeaker.textContent = speaker || '';
        if (useHtml) {
            this.closeupText.innerHTML = text;
        } else {
            this.closeupText.textContent = text;
        }
        this.closeupDialogueBox.classList.remove('hidden');
        this.isShowing = true;
    }

    hideCloseup() {
        this.closeupOverlay.classList.add('hidden');
        this.closeupDialogueBox.classList.add('hidden');
        this.closeupCloseBtn.classList.add('hidden');
        this.isCloseup = false;
    }

    hide() {
        this.dialogueBox.classList.add('hidden');
        this.narrationBox.classList.add('hidden');
        this.closeupDialogueBox.classList.add('hidden');
        this.isShowing = false;
    }

    isActive() {
        return this.isShowing;
    }
}
