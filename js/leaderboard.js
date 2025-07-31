/**
 * @file leaderboard.js
 * @description Manages the leaderboard using localStorage.
 */
class Leaderboard {
    constructor(listElementId, i18n) {
        this.listElement = document.getElementById(listElementId);
        this.i18n = i18n; // Pass i18n for translating player names
        if (!this.listElement) {
            throw new Error(`Leaderboard list element with id "${listElementId}" not found.`);
        }
        this.scores = this.loadScores();
        this.render();
    }

    loadScores() {
        const scoresJSON = localStorage.getItem('perfectCircleScores');
        return scoresJSON ? JSON.parse(scoresJSON) : [];
    }

    saveScores() {
        localStorage.setItem('perfectCircleScores', JSON.stringify(this.scores));
    }

    addScore(name, score) {
        const playerName = name.trim() === '' ? this.i18n.translate('player_anonymous') : name;
        this.scores.push({ name: playerName, score: score, date: new Date().toISOString() });
        
        // Sort scores descending and keep top 10
        this.scores.sort((a, b) => b.score - a.score);
        this.scores = this.scores.slice(0, 10);

        this.saveScores();
        this.render();
    }

    render() {
        this.listElement.innerHTML = '';
        if (this.scores.length === 0) {
            this.listElement.innerHTML = `<li>No scores yet. Be the first!</li>`;
            return;
        }

        this.scores.forEach((entry, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="rank">${index + 1}.</span>
                <span class="name">${entry.name}</span>
                <span class="score">${entry.score.toFixed(2)}%</span>
            `;
            this.listElement.appendChild(li);
        });
    }
}