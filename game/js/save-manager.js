class SaveManager {
    constructor() {
        this.prefix = 'sickofme_save_';
    }

    save(slotIndex, data) {
        const saveData = {
            sceneIndex: data.sceneIndex,
            sequenceIndex: data.sequenceIndex,
            sceneName: data.sceneName || '',
            timestamp: Date.now(),
            letters: data.letters || []
        };
        localStorage.setItem(this.prefix + slotIndex, JSON.stringify(saveData));
    }

    load(slotIndex) {
        const raw = localStorage.getItem(this.prefix + slotIndex);
        return raw ? JSON.parse(raw) : null;
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
        return [0, 1, 2].map(i => this.load(i));
    }

    hasSaves() {
        return this.getAll().some(s => s !== null);
    }
}
