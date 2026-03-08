class LetterManager {
    constructor() {
        this.letters = [];
        this.collectedIds = [];
    }

    async loadLetterData(dataFile) {
        const response = await fetch(dataFile + '?v=' + Date.now());
        this.letters = await response.json();
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
