/**
 * @file game.js
 * @description Main controller. Now with letter grades, Groq AI reviews, Supabase leaderboard.
 */

class Game {
    constructor() {
        this.state = 'idle';
        this.lastScore = 0;
        this.lastGrade = 'D';
        this.initializeDOMReferences();
        this.initializeCanvas();
        this.initializeAsync();
    }

    async initializeAsync() {
        await this.initializeModules();
        this.attachEventListeners();
        this.resetGame();
    }

    initializeDOMReferences() {
        this.statusDisplay       = document.getElementById('game-status');
        this.scoreContainer      = document.getElementById('score-container');
        this.detailedMetricsList = document.getElementById('detailed-metrics');
        this.resetButton         = document.getElementById('reset-button');
        this.analyzeButton       = document.getElementById('analyze-button');
        this.canvasWrapper       = document.getElementById('canvas-wrapper');
        this.languageSelector    = document.getElementById('language-selector');
        this.scoreSubmissionForm = document.getElementById('score-submission');
        this.playerNameInput     = document.getElementById('player-name');
        this.submitScoreButton   = document.getElementById('submit-score-button');
        this.gradeDisplay        = document.getElementById('grade-display');
        this.funLabelDisplay     = document.getElementById('fun-label');
        this.aiReviewDisplay     = document.getElementById('ai-review');
        this.shareButton         = document.getElementById('share-button');
    }

    initializeCanvas() {
        this.drawingCanvas  = document.getElementById('drawing-canvas');
        this.analysisCanvas = document.getElementById('analysis-canvas');
        this.drawingCtx     = this.drawingCanvas.getContext('2d');
        this.analysisCtx    = this.analysisCanvas.getContext('2d');

        const rect = this.canvasWrapper.getBoundingClientRect();
        const dpr  = window.devicePixelRatio || 1;
        this.drawingCanvas.width   = rect.width  * dpr;
        this.drawingCanvas.height  = rect.height * dpr;
        this.analysisCanvas.width  = rect.width  * dpr;
        this.analysisCanvas.height = rect.height * dpr;
        this.drawingCtx.scale(dpr, dpr);
        this.analysisCtx.scale(dpr, dpr);
    }

    async initializeModules() {
        this.i18n = new I18n();
        const preferredLang = localStorage.getItem('preferredLanguage') || 'en';
        await this.i18n.changeLanguage(preferredLang);
        this.languageSelector.value = preferredLang;

        this.leaderboard        = new Leaderboard('leaderboard-list', this.i18n);
        this.animationController = new AnimationController();
        this.brush              = new Brush(5, '#000000');
        this.drawnCircle        = new DrawnCircle(this.drawingCtx, this.brush);
        this.groqReview         = new GroqReview(window.GROQ_API_KEY || '');

        this.colorPalette = new RGBColorPalette('rgb-color-palette', (newColor) => {
            this.brush.setColor(newColor);
        });
    }

    attachEventListeners() {
        // Drawing events
        this.drawingCanvas.addEventListener('mousedown',  this.handleDrawingStart.bind(this));
        this.drawingCanvas.addEventListener('mousemove',  Utils.throttle(this.handleDrawingMove.bind(this), 10));
        this.drawingCanvas.addEventListener('mouseup',    this.handleDrawingEnd.bind(this));
        this.drawingCanvas.addEventListener('mouseleave', this.handleDrawingEnd.bind(this));

        // Touch events
        this.drawingCanvas.addEventListener('touchstart', this.handleDrawingStart.bind(this));
        this.drawingCanvas.addEventListener('touchmove',  Utils.throttle(this.handleDrawingMove.bind(this), 10));
        this.drawingCanvas.addEventListener('touchend',   this.handleDrawingEnd.bind(this));

        // UI
        this.resetButton.addEventListener('click', this.resetGame.bind(this));
        this.analyzeButton.addEventListener('click', this.analyzeDrawing.bind(this));

        this.languageSelector.addEventListener('change', (e) => {
            this.i18n.changeLanguage(e.target.value).then(() => {
                this.leaderboard.render();
            });
        });

        this.submitScoreButton.addEventListener('click', async () => {
            const name = this.playerNameInput.value;
            await this.leaderboard.addScore(name, this.lastScore, this.lastGrade);
            this.scoreSubmissionForm.classList.add('hidden');
        });

        if (this.shareButton) {
            this.shareButton.addEventListener('click', this.shareResult.bind(this));
        }

        window.addEventListener('resize', Utils.throttle(this.handleResize.bind(this), 250));
    }

    getPointerPosition(event) {
        const rect  = this.drawingCanvas.getBoundingClientRect();
        const touch = event.touches ? event.touches[0] : event;
        return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }

    handleDrawingStart(event) {
        event.preventDefault();
        this.resetGame();
        this.state = 'drawing';
        this.updateStatus('status_drawing');
        const point = this.getPointerPosition(event);
        this.drawnCircle.startDrawing(point);
    }

    handleDrawingMove(event) {
        event.preventDefault();
        if (this.state !== 'drawing') return;
        const point = this.getPointerPosition(event);
        this.drawnCircle.draw(point);
    }

    handleDrawingEnd() {
        if (this.state !== 'drawing') return;
        this.state = 'finished_drawing';
        this.drawnCircle.stopDrawing();
        if (this.drawnCircle.isEmpty()) {
            this.resetGame();
        } else {
            this.updateStatus('status_finished_drawing');
            this.analyzeButton.disabled = false;
        }
    }

    handleResize() {
        const points    = this.drawnCircle.getPoints();
        this.initializeCanvas();
        if (points.length > 0) {
            this.drawnCircle = new DrawnCircle(this.drawingCtx, this.brush);
            this.drawnCircle.points = points;
        }
    }

    resetGame() {
        this.state = 'idle';
        if (this.drawnCircle) this.drawnCircle.clear();
        if (this.analysisCtx) this.analysisCtx.clearRect(0, 0, this.analysisCanvas.width, this.analysisCanvas.height);
        this.analyzeButton.disabled = true;
        this.updateStatus('status_awaiting');
        this.scoreContainer.classList.add('hidden');
        this.scoreSubmissionForm.classList.add('hidden');
        if (this.detailedMetricsList) this.detailedMetricsList.innerHTML = '';
        if (this.playerNameInput) this.playerNameInput.value = '';
        if (this.gradeDisplay) {
            this.gradeDisplay.textContent = '';
            this.gradeDisplay.style.color = '';
        }
        if (this.funLabelDisplay)  this.funLabelDisplay.textContent  = '';
        if (this.aiReviewDisplay)  this.aiReviewDisplay.textContent  = '';
        if (this.shareButton)      this.shareButton.classList.add('hidden');
    }

    analyzeDrawing() {
        if (this.drawnCircle.isEmpty()) return;
        this.state = 'analyzing';
        this.updateStatus('status_analyzing');
        this.analyzeButton.disabled = true;
        this.resetButton.disabled   = true;

        setTimeout(async () => {
            try {
                const analyzer = new CircleAnalyzer(this.drawnCircle.getPoints());
                const results  = analyzer.getResults();
                const scorer   = new Scorer(results);

                this.lastScore = scorer.getPerfectionScore();
                this.lastGrade = scorer.getLetterGrade();
                const funLabel         = scorer.getFunLabel();
                const gradeColor       = scorer.getGradeColor();
                const detailedMetrics  = scorer.getDetailedMetrics();

                // Display static results immediately
                this.displayResults(this.lastScore, this.lastGrade, gradeColor, funLabel, detailedMetrics, results.idealCircle);

                // Fetch AI review asynchronously
                if (this.aiReviewDisplay) {
                    this.aiReviewDisplay.textContent = 'The jury is deliberating...';
                    const metricsForAI = {
                        eccentricity:       results.eccentricity,
                        radiusVariation:    `${(results.radiusStats.variation * 100).toFixed(2)}%`,
                        closureGap:         `${results.closureGap.toFixed(2)} px`,
                        harmonicDistortion: `${(results.fourierAnalysis.totalHarmonicDistortion * 100).toFixed(2)}%`,
                    };
                    const review = await this.groqReview.generateReview(this.lastScore, this.lastGrade, metricsForAI);
                    this.aiReviewDisplay.textContent = review;
                }
            } catch (error) {
                console.error("Analysis failed:", error);
                this.updateStatus('status_analysis_error', { message: error.message });
            } finally {
                this.state = 'finished';
                this.resetButton.disabled = false;
            }
        }, 500);
    }

    displayResults(score, grade, gradeColor, funLabel, metrics, idealCircle) {
        this.scoreContainer.classList.remove('hidden');
        this.scoreSubmissionForm.classList.remove('hidden');

        // Animate score number
        this.animationController.animateScore(score);

        // Grade badge
        if (this.gradeDisplay) {
            this.gradeDisplay.textContent = grade;
            this.gradeDisplay.style.color       = gradeColor;
            this.gradeDisplay.style.textShadow  = `0 0 20px ${gradeColor}`;
        }

        // Fun label
        if (this.funLabelDisplay) {
            this.funLabelDisplay.textContent = funLabel;
        }

        // Detailed metrics list
        this.detailedMetricsList.innerHTML = '';
        for (const [key, value] of Object.entries(metrics)) {
            const li = document.createElement('li');
            const translatedKey = this.i18n.translate(key);

            if (value === '') {
                li.innerHTML = `<strong>${translatedKey}</strong>`;
                li.style.marginTop  = '10px';
                li.style.color      = 'var(--accent-color)';
            } else {
                li.innerHTML = `<strong>${translatedKey}:</strong> <span>${value}</span>`;
            }
            this.detailedMetricsList.appendChild(li);
        }

        // Draw ideal circle overlay
        if (idealCircle) {
            this.animationController.drawPerfectCircle(this.analysisCtx, idealCircle);
        }

        // Show share button
        if (this.shareButton) this.shareButton.classList.remove('hidden');

        this.updateStatus('status_analysis_complete');
    }

    shareResult() {
        // Generate shareable image from canvas
        const drawingDataURL = this.drawingCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `circle-grade-${this.lastGrade}-${Math.round(this.lastScore)}pct.png`;
        link.href = drawingDataURL;
        link.click();
    }

    updateStatus(key, replacements = {}) {
        this.statusDisplay.textContent = this.i18n.translate(key, replacements);
    }
}

document.addEventListener('DOMContentLoaded', () => { new Game(); });