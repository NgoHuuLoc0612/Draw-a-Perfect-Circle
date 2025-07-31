/**
 * @file game.js
 * @description The main controller for the application.
 * Initializes all modules, manages application state, and handles user input.
 */

class Game {
    constructor() {
        this.state = 'idle'; // idle, drawing, analyzing, finished
        this.lastScore = 0;
        this.initializeDOMReferences();
        this.initializeCanvas();
        // Modules will be initialized in an async method
        this.initializeAsync(); 
    }

    async initializeAsync() {
        await this.initializeModules();
        this.attachEventListeners();
        this.resetGame();
    }

    initializeDOMReferences() {
        this.statusDisplay = document.getElementById('game-status');
        this.scoreContainer = document.getElementById('score-container');
        this.detailedMetricsList = document.getElementById('detailed-metrics');
        this.resetButton = document.getElementById('reset-button');
        this.analyzeButton = document.getElementById('analyze-button');
        this.canvasWrapper = document.getElementById('canvas-wrapper');
        this.languageSelector = document.getElementById('language-selector');
        this.scoreSubmissionForm = document.getElementById('score-submission');
        this.playerNameInput = document.getElementById('player-name');
        this.submitScoreButton = document.getElementById('submit-score-button');
    }

    initializeCanvas() {
        this.drawingCanvas = document.getElementById('drawing-canvas');
        this.analysisCanvas = document.getElementById('analysis-canvas');
        this.drawingCtx = this.drawingCanvas.getContext('2d');
        this.analysisCtx = this.analysisCanvas.getContext('2d');
        
        // Set canvas size based on its container, maintaining high DPI
        const rect = this.canvasWrapper.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        this.drawingCanvas.width = rect.width * dpr;
        this.drawingCanvas.height = rect.height * dpr;
        this.analysisCanvas.width = rect.width * dpr;
        this.analysisCanvas.height = rect.height * dpr;
        this.drawingCtx.scale(dpr, dpr);
        this.analysisCtx.scale(dpr, dpr);
    }

    async initializeModules() {
        this.i18n = new I18n();
        const preferredLang = localStorage.getItem('preferredLanguage') || 'en';
        await this.i18n.changeLanguage(preferredLang);
        this.languageSelector.value = preferredLang;

        this.leaderboard = new Leaderboard('leaderboard-list', this.i18n);
        this.animationController = new AnimationController();
        this.brush = new Brush(5, '#FFFFFF');
        this.drawnCircle = new DrawnCircle(this.drawingCtx, this.brush);
        
        this.colorPalette = new RGBColorPalette('rgb-color-palette', (newColor) => {
            this.brush.setColor(newColor);
        });
    }

    attachEventListeners() {
        // Drawing events
        this.drawingCanvas.addEventListener('mousedown', this.handleDrawingStart.bind(this));
        this.drawingCanvas.addEventListener('mousemove', Utils.throttle(this.handleDrawingMove.bind(this), 10));
        this.drawingCanvas.addEventListener('mouseup', this.handleDrawingEnd.bind(this));
        this.drawingCanvas.addEventListener('mouseleave', this.handleDrawingEnd.bind(this));
        
        // Touch events
        this.drawingCanvas.addEventListener('touchstart', this.handleDrawingStart.bind(this));
        this.drawingCanvas.addEventListener('touchmove', Utils.throttle(this.handleDrawingMove.bind(this), 10));
        this.drawingCanvas.addEventListener('touchend', this.handleDrawingEnd.bind(this));

        // UI Buttons
        this.resetButton.addEventListener('click', this.resetGame.bind(this));
        this.analyzeButton.addEventListener('click', this.analyzeDrawing.bind(this));

         // New Listeners
        this.languageSelector.addEventListener('change', (e) => {
            this.i18n.changeLanguage(e.target.value).then(() => {
                // Re-render leaderboard after language change to translate "Anonymous"
                this.leaderboard.render();
            });
        });

        this.submitScoreButton.addEventListener('click', () => {
            const name = this.playerNameInput.value;
            this.leaderboard.addScore(name, this.lastScore);
            this.scoreSubmissionForm.classList.add('hidden');
        });

        // Handle window resizing
        window.addEventListener('resize', Utils.throttle(this.handleResize.bind(this), 250));
    }

    // --- Event Handlers ---
     getPointerPosition(event) {
        const rect = this.drawingCanvas.getBoundingClientRect();
        const touch = event.touches ? event.touches[0] : event;
        return {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        };
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
        // Save drawing, resize, and redraw
        const points = this.drawnCircle.getPoints();
        const wasDrawing = this.drawnCircle.isDrawing;
        this.initializeCanvas(); // This will clear the canvas
        if(points.length > 0) {
            // This is a simplified redraw, for a real app you might need to scale points
            this.drawnCircle = new DrawnCircle(this.drawingCtx, this.brush);
            this.drawnCircle.points = points;
            this.drawnCircle.isDrawing = wasDrawing;
            // Redraw the path from points (complex logic omitted for brevity)
        }
    }

    // --- Game Logic ---
    resetGame() {
        this.state = 'idle';
        this.drawnCircle.clear();
        this.analysisCtx.clearRect(0, 0, this.analysisCanvas.width, this.analysisCanvas.height);
        this.analyzeButton.disabled = true;
        this.updateStatus('status_awaiting');
        this.scoreContainer.classList.add('hidden');
        this.scoreSubmissionForm.classList.add('hidden');
        this.detailedMetricsList.innerHTML = '';
        this.playerNameInput.value = '';
    }

    analyzeDrawing() {
        if (this.drawnCircle.isEmpty()) return;
        this.state = 'analyzing';
        this.updateStatus('status_analyzing');
        this.analyzeButton.disabled = true;
        this.resetButton.disabled = true;

        setTimeout(() => {
            try {
                const analyzer = new CircleAnalyzer(this.drawnCircle.getPoints());
                const results = analyzer.getResults();

                const scorer = new Scorer(results);
                this.lastScore = scorer.getPerfectionScore();
                const detailedMetrics = scorer.getDetailedMetrics();

                this.displayResults(this.lastScore, detailedMetrics, results.idealCircle);
            } catch (error) {
                console.error("Analysis failed:", error);
                this.updateStatus('status_analysis_error', { message: error.message });
            } finally {
                this.state = 'finished';
                this.resetButton.disabled = false;
            }
        }, 500);
    }
    
    displayResults(score, metrics, idealCircle) {
        this.scoreContainer.classList.remove('hidden');
        this.scoreSubmissionForm.classList.remove('hidden');
        this.animationController.animateScore(score);
        
        this.detailedMetricsList.innerHTML = '';
        for (const [key, value] of Object.entries(metrics)) {
            const li = document.createElement('li');
            const translatedKey = this.i18n.translate(key);
            
            if (value === '') {
                li.innerHTML = `<strong>${translatedKey}</strong>`;
                li.style.marginTop = '10px';
                li.style.color = 'var(--accent-color)';
            } else {
                li.innerHTML = `<strong>${translatedKey}:</strong> <span>${value}</span>`;
            }
            this.detailedMetricsList.appendChild(li);
        }
        
        if (idealCircle) {
            this.animationController.drawPerfectCircle(this.analysisCtx, idealCircle);
        }
        
        this.updateStatus('status_analysis_complete');
    }

    updateStatus(key, replacements = {}) {
        this.statusDisplay.textContent = this.i18n.translate(key, replacements);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Game();
});