/**
 * @file animations.js
 * @description Manages all UI animations and visual feedback.
 * Uses requestAnimationFrame for performance-critical animations.
 */

class AnimationController {
    constructor() {
        this.scoreElement = document.getElementById('perfection-score');
    }

    /**
     * Animates a score counter from a start value to an end value.
     * @param {number} endValue - The final score value to display.
     * @param {number} duration - The animation duration in milliseconds.
     */
    animateScore(endValue, duration = 1500) {
        let startTimestamp = null;
        const startValue = 0;

        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            
            const currentValue = startValue + (endValue - startValue) * this._easeOutCubic(progress);
            this.scoreElement.textContent = `${currentValue.toFixed(2)}%`;

            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                 this.scoreElement.textContent = `${endValue.toFixed(2)}%`;
            }
        };

        window.requestAnimationFrame(step);
    }

    /**
     * Draws the calculated "perfect" circle on the analysis canvas.
     * @param {CanvasRenderingContext2D} ctx - The context of the analysis canvas.
     * @param {{x: number, y: number, radius: number}} circle - The circle parameters.
     * @param {string} color - The color of the circle stroke.
     * @param {number} lineWidth - The width of the circle stroke.
     */
    drawPerfectCircle(ctx, circle, color = 'rgba(40, 167, 69, 0.8)', lineWidth = 3) {
        const { x, y, radius } = circle;
        const canvas = ctx.canvas;
        let startTimestamp = null;
        const duration = 1000;

        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            
            const easedProgress = this._easeOutCubic(progress);
            const endAngle = easedProgress * 2 * Math.PI;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, endAngle);
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'round';
            ctx.setLineDash([10, 5]); // Dashed line style
            ctx.stroke();

            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        
        window.requestAnimationFrame(step);
    }
    
    /**
     * Easing function for smooth animations.
     * @param {number} x - The progress value (0 to 1).
     * @returns {number} The eased value.
     */
    _easeOutCubic(x) {
        return 1 - Math.pow(1 - x, 3);
    }
}