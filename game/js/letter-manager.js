class LetterManager {
    constructor() {
        this.letters = [];
        this.collectedIds = [];
    }

    async loadLetterData(dataFile) {
        try {
            const response = await fetch(dataFile + '?v=' + Date.now());
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            this.letters = await response.json();
        } catch (e) {
            console.error('Failed to load letter data:', e);
            this.letters = [];
        }
    }

    setCollected(ids) {
        this.collectedIds = ids ? [...ids] : [];
    }

    collect(letterId) {
        if (!this.collectedIds.includes(letterId)) {
            this.collectedIds.push(letterId);
        }
    }

    isCollected(letterId) {
        return this.collectedIds.includes(letterId);
    }

    getCollected() {
        return this.letters.filter(l => this.collectedIds.includes(l.id));
    }

    getCollectedIds() {
        return [...this.collectedIds];
    }
}
