/**
 * @file leaderboard.js
 * @description Manages the leaderboard using Supabase as backend.
 * Falls back to localStorage if Supabase is not configured.
 */

class Leaderboard {
    constructor(listElementId, i18n) {
        this.listElement = document.getElementById(listElementId);
        this.i18n = i18n;
        this.scores = [];
        this.isSupabaseReady = false;

        if (!this.listElement) {
            throw new Error(`Leaderboard list element with id "${listElementId}" not found.`);
        }

        this._initSupabase();
        this.render();
    }

    _initSupabase() {
        if (typeof window.SUPABASE_URL !== 'undefined' && typeof window.SUPABASE_ANON_KEY !== 'undefined'
            && window.SUPABASE_URL && window.SUPABASE_ANON_KEY
            && window.SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
            try {
                this.supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
                this.isSupabaseReady = true;
                this.loadScores();
            } catch (e) {
                console.warn('Supabase init failed, falling back to localStorage:', e);
                this._loadFromLocalStorage();
            }
        } else {
            this._loadFromLocalStorage();
        }
    }

    _loadFromLocalStorage() {
        const scoresJSON = localStorage.getItem('perfectCircleScores');
        this.scores = scoresJSON ? JSON.parse(scoresJSON) : [];
        this.render();
    }

    async loadScores() {
        if (!this.isSupabaseReady) {
            this._loadFromLocalStorage();
            return;
        }
        try {
            const { data, error } = await this.supabase
                .from('scores')
                .select('name, score, grade, created_at')
                .order('score', { ascending: false })
                .limit(10);

            if (error) throw error;
            this.scores = data || [];
            this.render();
        } catch (e) {
            console.warn('Supabase fetch failed, using localStorage:', e);
            this._loadFromLocalStorage();
        }
    }

    async addScore(name, score, grade) {
        const playerName = name.trim() === '' ? this.i18n.translate('player_anonymous') : name.trim();

        if (this.isSupabaseReady) {
            try {
                const { error } = await this.supabase
                    .from('scores')
                    .insert([{ name: playerName, score: parseFloat(score.toFixed(2)), grade: grade }]);

                if (error) throw error;
                await this.loadScores();
                return;
            } catch (e) {
                console.warn('Supabase insert failed, falling back to localStorage:', e);
            }
        }

        // localStorage fallback
        const scoresJSON = localStorage.getItem('perfectCircleScores');
        this.scores = scoresJSON ? JSON.parse(scoresJSON) : [];
        this.scores.push({ name: playerName, score, grade, created_at: new Date().toISOString() });
        this.scores.sort((a, b) => b.score - a.score);
        this.scores = this.scores.slice(0, 10);
        localStorage.setItem('perfectCircleScores', JSON.stringify(this.scores));
        this.render();
    }

    render() {
        this.listElement.innerHTML = '';
        if (!this.scores || this.scores.length === 0) {
            this.listElement.innerHTML = `<li style="color:#888;font-style:italic;">No scores yet. Be the first!</li>`;
            return;
        }

        const gradeColors = { S: '#ff6fcf', A: '#00e676', B: '#00aaff', C: '#ffc107', D: '#ff5252' };
        const medals = ['🥇', '🥈', '🥉'];

        this.scores.forEach((entry, index) => {
            const li = document.createElement('li');
            const rank = medals[index] || `${index + 1}.`;
            const gradeColor = gradeColors[entry.grade] || '#aaa';
            const grade = entry.grade || '?';
            li.innerHTML = `
                <span class="rank">${rank}</span>
                <span class="name">${entry.name}</span>
                <span class="grade" style="color:${gradeColor};font-weight:bold;font-size:1rem;">${grade}</span>
                <span class="score">${parseFloat(entry.score).toFixed(2)}%</span>
            `;
            this.listElement.appendChild(li);
        });

        // Show sync indicator
        const syncEl = document.getElementById('leaderboard-sync-status');
        if (syncEl) {
            syncEl.textContent = this.isSupabaseReady ? '☁️ Cloud' : '💾 Local';
            syncEl.style.color = this.isSupabaseReady ? '#00e676' : '#ffc107';
        }
    }
}