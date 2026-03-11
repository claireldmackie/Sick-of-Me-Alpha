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

    showCloseup(imageUrl) {
        this.closeupContent.innerHTML = '';
        if (imageUrl) {
            const img = document.createElement('img');
            img.src = imageUrl;
            this.closeupContent.appendChild(img);
        }
        this.closeupOverlay.classList.remove('hidden');
        this.isCloseup = true;
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
