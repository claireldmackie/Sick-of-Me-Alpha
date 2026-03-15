class UIManager {
    constructor(saveManager, letterManager, inputManager, audioManager) {
        this.saveManager = saveManager;
        this.letterManager = letterManager;
        this.inputManager = inputManager || null;
        this.audioManager = audioManager || null;

        this.panelMode = null;       // 'save' | 'load' | 'copy-source' | 'copy-dest' | 'delete-select'
        this.selectedSlot = null;
        this.copySourceSlot = null;
        this.currentLetterIndex = 0;
        this.unreadLetters = 0;

        this.onNewGame = null;
        this.onLoadSave = null;
        this.onSaveGame = null;
        this.onResume = null;
        this.onQuitToMenu = null;
        this._savedSinceLoad = false;

        this._bindElements();
        this._bindEvents();
    }

    _bindElements() {
        this.homepage = document.getElementById('homepage-screen');
        this.hud = document.getElementById('hud');
        this.pauseOverlay = document.getElementById('pause-overlay');
        this.savePanel = document.getElementById('save-panel');
        this.confirmDialog = document.getElementById('confirm-dialog');
        this.letterViewer = document.getElementById('letter-viewer');

        this.btnContinue = document.getElementById('btn-continue');
        this.btnNewGame = document.getElementById('btn-new-game');
        this.btnQuitHome = document.getElementById('btn-quit-home');

        this.btnSave = document.getElementById('btn-save');
        this.btnQuitPause = document.getElementById('btn-quit-pause');

        this.saveSlots = document.querySelectorAll('.save-slot');
        this.saveTitleImg = document.getElementById('save-title-img');
        this.saveTitleText = document.getElementById('save-title-text');
        this.saveActions = document.getElementById('save-actions');
        this.loadActions = document.getElementById('load-actions');
        this.saveActionsCancel = document.getElementById('save-actions-cancel');
        this.btnDelete = document.getElementById('btn-delete');
        this.btnLoadDelete = document.getElementById('btn-load-delete');
        this.btnStartGame = document.getElementById('btn-start-game');
        this.btnCancelAction = document.getElementById('btn-cancel-action');

        this.confirmMessage = document.getElementById('confirm-message');
        this.btnConfirmYes = document.getElementById('btn-confirm-yes');
        this.btnConfirmNo = document.getElementById('btn-confirm-no');

        this.letterTitle = document.getElementById('letter-title');
        this.letterContent = document.getElementById('letter-content');
        this.btnLetterPrev = document.getElementById('letter-prev');
        this.btnLetterNext = document.getElementById('letter-next');

        this.hudHamburger = document.getElementById('hud-hamburger');
        this.hudEnvelope = document.getElementById('hud-envelope');
        this.letterBadge = document.getElementById('letter-badge');
    }

    _bindEvents() {
        this.btnContinue.addEventListener('click', () => this.showSaveSlots('load'));
        this.btnNewGame.addEventListener('click', () => {
            this.hideAll();
            this.showHUD();
            this._savedSinceLoad = false;
            if (this.onNewGame) this.onNewGame();
        });
        this.btnQuitHome.addEventListener('click', () => {
            this.hideAll();
        });

        this.hudHamburger.addEventListener('click', () => this.showPause());
        this.hudEnvelope.addEventListener('click', () => this.showLetterViewer());

        this.pauseOverlay.querySelector('.close-btn').addEventListener('click', () => this.hidePause());
        this.btnSave.addEventListener('click', () => this.showSaveSlots('save'));
        this.btnQuitPause.addEventListener('click', () => {
            if (this._savedSinceLoad) {
                this.hideAll();
                if (this.onQuitToMenu) this.onQuitToMenu();
                this.showHomepage();
            } else {
                this.showConfirm('Are you sure you want to\nquit without saving?', () => {
                    this.hideConfirm();
                    this.hideAll();
                    if (this.onQuitToMenu) this.onQuitToMenu();
                    this.showHomepage();
                }, () => {
                    this.hideConfirm();
                });
            }
        });

        this.btnSaveBack = document.getElementById('save-back-btn');
        this.btnSaveQuit = document.getElementById('btn-save-quit');

        this.btnSaveBack.addEventListener('click', () => {
            const mode = this.panelMode;
            this.hideSavePanel();
            if (mode === 'load') {
                this.showHomepage();
            } else {
                this.showPause();
            }
        });

        this.btnSaveQuit.addEventListener('click', () => {
            this.hideAll();
            if (this.onQuitToMenu) this.onQuitToMenu();
            this.showHomepage();
        });

        this.saveSlots.forEach(slot => {
            const index = parseInt(slot.dataset.slot);
            slot.addEventListener('click', () => this.handleSlotClick(index));
        });

        this.btnDelete.addEventListener('click', () => this.enterDeleteMode());
        this.btnLoadDelete.addEventListener('click', () => this._loadPanelDelete());
        this.btnStartGame.addEventListener('click', () => this._loadPanelStart());
        this.btnCancelAction.addEventListener('click', () => this.cancelSpecialMode());

        this.confirmDialog.querySelector('.close-btn').addEventListener('click', () => this.hideConfirm());

        this.letterViewer.querySelector('.close-btn').addEventListener('click', () => this.hideLetterViewer());
        this.btnLetterPrev.addEventListener('click', () => this.navigateLetter(-1));
        this.btnLetterNext.addEventListener('click', () => this.navigateLetter(1));

        this.volumeSlider = document.getElementById('volume-slider');
        if (this.volumeSlider) {
            if (this.audioManager) {
                this.volumeSlider.value = Math.round(this.audioManager.getVolume() * 100);
            }
            this._updateSliderFill();
            this.volumeSlider.addEventListener('input', () => {
                const val = Number(this.volumeSlider.value) / 100;
                this._updateSliderFill();
                if (this.audioManager) {
                    this.audioManager.setVolume(val);
                }
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this._handleEscape();
        });

        const dialogueOptions = document.getElementById('dialogue-options');
        const overlays = [this.homepage, this.pauseOverlay, this.savePanel, this.confirmDialog, this.letterViewer, dialogueOptions];
        for (const el of overlays) {
            if (el) el.addEventListener('click', (e) => e.stopPropagation());
        }
    }

    _handleEscape() {
        if (!this.confirmDialog.classList.contains('hidden')) {
            this.hideConfirm();
        } else if (!this.letterViewer.classList.contains('hidden')) {
            this.hideLetterViewer();
        } else if (!this.savePanel.classList.contains('hidden')) {
            this.hideSavePanel();
        } else if (!this.pauseOverlay.classList.contains('hidden')) {
            this.hidePause();
        } else if (this.homepage.classList.contains('hidden') && this.hud && !this.hud.classList.contains('hidden')) {
            this.showPause();
        }
    }

    /* ── Homepage ── */

    showHomepage() {
        this.hideAll();
        const hasSaves = this.saveManager.hasSaves();
        this.btnContinue.classList.toggle('hidden', !hasSaves);
        this.homepage.classList.remove('hidden');
        this._syncInputBlock();
    }

    /* ── HUD ── */

    showHUD() {
        this.hud.classList.remove('hidden');
    }

    hideHUD() {
        this.hud.classList.add('hidden');
    }

    /* ── Pause ── */

    showPause() {
        this.pauseOverlay.classList.remove('hidden');
        this._syncInputBlock();
        if (this.audioManager) this.audioManager.pause();
    }

    hidePause() {
        this.pauseOverlay.classList.add('hidden');
        this._syncInputBlock();
        if (this.audioManager) this.audioManager.resume();
        if (this.onResume) this.onResume();
    }

    /* ── Save Slots ── */

    showSaveSlots(mode) {
        this.panelMode = mode;
        this.selectedSlot = null;
        this.copySourceSlot = null;

        this.saveTitleImg.classList.remove('hidden');
        this.saveTitleText.classList.add('hidden');
        this.saveActions.classList.toggle('hidden', mode !== 'save');
        this.loadActions.classList.toggle('hidden', mode !== 'load');
        this.saveActionsCancel.classList.add('hidden');
        this.btnSaveQuit.classList.add('hidden');
        this._updateLoadActions();

        this.updateSaveSlotDisplay();
        this.savePanel.classList.remove('hidden');
        this._syncInputBlock();
    }

    hideSavePanel() {
        this.savePanel.classList.add('hidden');
        this.loadActions.classList.add('hidden');
        this._syncInputBlock();
        this.panelMode = null;
        this.selectedSlot = null;
        this.copySourceSlot = null;
    }

    updateSaveSlotDisplay() {
        const saves = this.saveManager.getAll();
        this.saveSlots.forEach(slot => {
            const i = parseInt(slot.dataset.slot);
            const data = saves[i];
            const label = slot.querySelector('.slot-label');
            const info = slot.querySelector('.slot-info');

            if (data) {
                const date = new Date(data.timestamp);
                const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
                label.textContent = `${data.sceneName || 'Scene ' + (data.sceneIndex + 1)} — ${dateStr}`;
                info.textContent = '';
            } else {
                label.textContent = 'Empty';
                info.textContent = '';
            }

            slot.classList.toggle('selected', this.selectedSlot === i);
        });
    }

    handleSlotClick(index) {
        if (this.panelMode === 'load') {
            this.selectedSlot = index;
            this.updateSaveSlotDisplay();
            this._updateLoadActions();
            return;
        }

        if (this.panelMode === 'save') {
            const existing = this.saveManager.load(index);
            if (existing) {
                this.showConfirm('Are you sure you want\nto overwrite this save?', () => {
                    this.hideConfirm();
                    if (this.onSaveGame) this.onSaveGame(index);
                    this._savedSinceLoad = true;
                    this.updateSaveSlotDisplay();
                    this.btnSaveQuit.classList.remove('hidden');
                }, () => {
                    this.hideConfirm();
                });
            } else {
                if (this.onSaveGame) this.onSaveGame(index);
                this._savedSinceLoad = true;
                this.updateSaveSlotDisplay();
                this.btnSaveQuit.classList.remove('hidden');
            }
            return;
        }

        if (this.panelMode === 'copy-source') {
            const save = this.saveManager.load(index);
            if (!save) return;
            this.copySourceSlot = index;
            this.selectedSlot = index;
            this.updateSaveSlotDisplay();
            this.panelMode = 'copy-dest';
            this.saveTitleText.textContent = 'Select a file to overwrite';
            return;
        }

        if (this.panelMode === 'copy-dest') {
            if (index === this.copySourceSlot) return;
            const existing = this.saveManager.load(index);
            if (existing) {
                this.showConfirm('Are you sure you want\nto overwrite this save?', () => {
                    this.hideConfirm();
                    this.saveManager.copy(this.copySourceSlot, index);
                    this.cancelSpecialMode();
                    this.updateSaveSlotDisplay();
                }, () => {
                    this.hideConfirm();
                });
            } else {
                this.saveManager.copy(this.copySourceSlot, index);
                this.cancelSpecialMode();
                this.updateSaveSlotDisplay();
            }
            return;
        }

        if (this.panelMode === 'delete-select') {
            const save = this.saveManager.load(index);
            if (!save) return;
            this.selectedSlot = index;
            this.updateSaveSlotDisplay();
            this.showConfirm('Are you sure you want\nto delete this save?', () => {
                this.hideConfirm();
                this.saveManager.delete(index);
                this.cancelSpecialMode();
                this.updateSaveSlotDisplay();
            }, () => {
                this.hideConfirm();
                this.cancelSpecialMode();
            });
            return;
        }
    }

    enterCopyMode() {
        this.panelMode = 'copy-source';
        this.selectedSlot = null;
        this.copySourceSlot = null;
        this.saveTitleImg.classList.add('hidden');
        this.saveTitleText.textContent = 'Select a file to copy';
        this.saveTitleText.classList.remove('hidden');
        this.saveActions.classList.add('hidden');
        this.saveActionsCancel.classList.remove('hidden');
        this.updateSaveSlotDisplay();
    }

    enterDeleteMode() {
        this.panelMode = 'delete-select';
        this.selectedSlot = null;
        this.saveTitleImg.classList.add('hidden');
        this.saveTitleText.textContent = 'Select a file to delete';
        this.saveTitleText.classList.remove('hidden');
        this.saveActions.classList.add('hidden');
        this.saveActionsCancel.classList.remove('hidden');
        this.updateSaveSlotDisplay();
    }

    cancelSpecialMode() {
        this.panelMode = 'save';
        this.selectedSlot = null;
        this.copySourceSlot = null;
        this.saveTitleImg.classList.remove('hidden');
        this.saveTitleText.classList.add('hidden');
        this.saveActions.classList.remove('hidden');
        this.loadActions.classList.add('hidden');
        this.saveActionsCancel.classList.add('hidden');
        this.updateSaveSlotDisplay();
    }

    _updateLoadActions() {
        if (this.panelMode !== 'load') return;
        const hasSelection = this.selectedSlot !== null;
        const hasSave = hasSelection && this.saveManager.load(this.selectedSlot);
        this.btnStartGame.classList.toggle('disabled', !hasSelection);
        this.btnLoadDelete.classList.toggle('disabled', !hasSave);
    }

    _loadPanelStart() {
        if (this.selectedSlot === null) return;
        const save = this.saveManager.load(this.selectedSlot);
        if (!save) {
            this.showConfirm('Would you like to\nstart a new game?', () => {
                this.hideConfirm();
                this.hideAll();
                this.showHUD();
                this._savedSinceLoad = false;
                if (this.onNewGame) this.onNewGame();
            }, () => {
                this.hideConfirm();
            });
            return;
        }
        const slotIndex = this.selectedSlot;
        this.hideAll();
        this.showHUD();
        this._savedSinceLoad = false;
        if (this.onLoadSave) this.onLoadSave(save, slotIndex);
    }

    _loadPanelDelete() {
        if (this.selectedSlot === null) return;
        const save = this.saveManager.load(this.selectedSlot);
        if (!save) return;
        const index = this.selectedSlot;
        this.showConfirm('Are you sure you want\nto delete this save?', () => {
            this.hideConfirm();
            this.saveManager.delete(index);
            this.selectedSlot = null;
            this.updateSaveSlotDisplay();
            this._updateLoadActions();
        }, () => {
            this.hideConfirm();
        });
    }

    /* ── Confirm Dialog ── */

    showConfirm(message, onYes, onNo) {
        this.confirmMessage.textContent = message;
        this.confirmDialog.classList.remove('hidden');
        this._syncInputBlock();

        const cleanup = () => {
            this.btnConfirmYes.removeEventListener('click', yesHandler);
            this.btnConfirmNo.removeEventListener('click', noHandler);
        };
        const yesHandler = () => { cleanup(); onYes(); };
        const noHandler = () => { cleanup(); onNo(); };

        this.btnConfirmYes.addEventListener('click', yesHandler);
        this.btnConfirmNo.addEventListener('click', noHandler);
    }

    hideConfirm() {
        this.confirmDialog.classList.add('hidden');
        this._syncInputBlock();
    }

    /* ── Letter Viewer ── */

    addUnreadLetter() {
        this.unreadLetters++;
        this._updateBadge();
    }

    _updateBadge() {
        if (!this.letterBadge) return;
        if (this.unreadLetters > 0) {
            this.letterBadge.textContent = this.unreadLetters;
            this.letterBadge.classList.remove('hidden');
        } else {
            this.letterBadge.classList.add('hidden');
        }
    }

    showLetterViewer() {
        this.unreadLetters = 0;
        this._updateBadge();
        const collected = this.letterManager.getCollected();
        if (collected.length === 0) {
            this.letterTitle.textContent = 'No letters yet';
            this.letterContent.textContent = '';
            this.btnLetterPrev.classList.add('hidden');
            this.btnLetterNext.classList.add('hidden');
        } else {
            this.currentLetterIndex = 0;
            this.updateLetterDisplay();
        }
        this.letterViewer.classList.remove('hidden');
        this._syncInputBlock();
    }

    showSingleLetter(letterId) {
        const allLetters = this.letterManager.letters;
        const letter = allLetters.find(l => l.id === letterId);
        if (!letter) return Promise.resolve();

        this.letterTitle.textContent = letter.title;
        this._applyLetterContent(letter);
        this.btnLetterPrev.classList.add('hidden');
        this.btnLetterNext.classList.add('hidden');
        this.letterViewer.classList.remove('hidden');
        this._syncInputBlock();

        return new Promise((resolve) => {
            this._letterCloseResolve = resolve;
        });
    }

    showNote(title, content, cssClass) {
        this.letterTitle.textContent = title || '';
        if (cssClass) {
            this.letterContent.innerHTML = `<span class="${cssClass}">${content}</span>`;
        } else {
            this.letterContent.textContent = content;
        }
        this.btnLetterPrev.classList.add('hidden');
        this.btnLetterNext.classList.add('hidden');
        this.letterViewer.classList.remove('hidden');
        this._syncInputBlock();

        return new Promise((resolve) => {
            this._letterCloseResolve = resolve;
        });
    }

    hideLetterViewer() {
        this.letterViewer.classList.add('hidden');
        this._syncInputBlock();
        if (this._letterCloseResolve) {
            const resolve = this._letterCloseResolve;
            this._letterCloseResolve = null;
            resolve();
        }
    }

    navigateLetter(direction) {
        const collected = this.letterManager.getCollected();
        this.currentLetterIndex = Math.max(0, Math.min(collected.length - 1, this.currentLetterIndex + direction));
        this.updateLetterDisplay();
    }

    updateLetterDisplay() {
        const collected = this.letterManager.getCollected();
        const letter = collected[this.currentLetterIndex];
        if (!letter) return;

        this.letterTitle.textContent = letter.title;
        this._applyLetterContent(letter);
        this.btnLetterPrev.classList.toggle('hidden', this.currentLetterIndex <= 0);
        this.btnLetterNext.classList.toggle('hidden', this.currentLetterIndex >= collected.length - 1);
    }

    _applyLetterContent(letter) {
        if (letter.cssClass) {
            this.letterContent.innerHTML = `<span class="${letter.cssClass}">${letter.content}</span>`;
        } else {
            this.letterContent.textContent = letter.content;
        }
    }

    /* ── Utilities ── */

    _updateSliderFill() {
        if (!this.volumeSlider) return;
        const pct = this.volumeSlider.value;
        this.volumeSlider.style.setProperty('--fill', pct + '%');
    }

    _syncInputBlock() {
        if (this.inputManager) {
            this.inputManager.blocked = this.isMenuOpen();
        }
    }

    isMenuOpen() {
        return !this.homepage.classList.contains('hidden') ||
               !this.pauseOverlay.classList.contains('hidden') ||
               !this.savePanel.classList.contains('hidden') ||
               !this.confirmDialog.classList.contains('hidden') ||
               !this.letterViewer.classList.contains('hidden');
    }

    hideAll() {
        this.homepage.classList.add('hidden');
        this.pauseOverlay.classList.add('hidden');
        this.savePanel.classList.add('hidden');
        this.confirmDialog.classList.add('hidden');
        this.letterViewer.classList.add('hidden');
        this.hud.classList.add('hidden');
        this.panelMode = null;
        this.selectedSlot = null;
        this.copySourceSlot = null;
        this._syncInputBlock();
    }
}
