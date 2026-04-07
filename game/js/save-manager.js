class SaveManager {
    constructor() {
        this.prefix = SCENES.SAVE_KEY_PREFIX;
    }

    save(slotIndex, data) {
        const saveData = {
            sceneIndex: data.sceneIndex,
            sequenceIndex: data.sequenceIndex,
            sceneName: data.sceneName || '',
            timestamp: Date.now(),
            letters: data.letters || [],
            sceneProgress: data.sceneProgress || {},
            heroName: data.heroName || 'Hero'
        };
        localStorage.setItem(this.prefix + slotIndex, JSON.stringify(saveData));
    }

    load(slotIndex) {
        const raw = localStorage.getItem(this.prefix + slotIndex);
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch (e) {
            console.warn('Corrupt save data in slot', slotIndex, e);
            return null;
        }
    }

    delete(slotIndex) {
        localStorage.removeItem(this.prefix + slotIndex);
    }

    copy(fromSlot, toSlot) {
        const data = this.load(fromSlot);
        if (data) {
            localStorage.setItem(this.prefix + toSlot, JSON.stringify(data));
        }
    }

    getAll() {
        return Array.from({ length: SCENES.SAVE_SLOT_COUNT }, (_, i) => this.load(i));
    }

    hasSaves() {
        return this.getAll().some(s => s !== null);
    }
}
