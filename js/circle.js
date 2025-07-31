/**
 * @file circle.js
 * @description Defines the Circle class to manage the user-drawn path.
 * This class stores points, handles drawing logic, and provides data for analysis.
 */

class DrawnCircle {
    /**
     * @param {CanvasRenderingContext2D} ctx - The drawing canvas context.
     * @param {Brush} brush - The brush instance for styling the drawing.
     */
    constructor(ctx, brush) {
        this.ctx = ctx;
        this.brush = brush;
        this.points = [];
        this.isDrawing = false;
        this.lastPoint = null;
    }

    /**
     * Starts a new drawing path at a given point.
     * @param {{x: number, y: number}} point - The starting point.
     */
    startDrawing(point) {
        this.isDrawing = true;
        this.clear();
        this.lastPoint = point;
        this.addPoint(point);
    }

    /**
     * Stops the current drawing path.
     */
    stopDrawing() {
        this.isDrawing = false;
        this.lastPoint = null;
    }
    
    /**
     * Adds a point to the path and draws a line segment from the last point.
     * @param {{x: number, y: number}} point - The point to add.
     */
    draw(point) {
        if (!this.isDrawing) return;

        this.addPoint(point);

        this.ctx.beginPath();
        this.brush.applyTo(this.ctx);
        this.ctx.moveTo(this.lastPoint.x, this.lastPoint.y);
        this.ctx.lineTo(point.x, point.y);
        this.ctx.stroke();

        this.lastPoint = point;
    }
    
    /**
     * Adds a point object to the internal points array.
     * @param {{x: number, y: number}} point - The point to add.
     */
    addPoint(point) {
        this.points.push({ ...point, t: performance.now() });
    }

    /**
     * Clears the drawing from the canvas and resets the points array.
     */
    clear() {
        this.points = [];
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    /**
     * Checks if the drawing is empty.
     * @returns {boolean} True if no points have been drawn.
     */
    isEmpty() {
        return this.points.length < 2; // Need at least two points for a line
    }

    /**
     * Returns the array of drawn points for analysis.
     * @returns {Array<{x: number, y: number, t: number}>} A copy of the points array.
     */
    getPoints() {
        return Utils.deepCopy(this.points);
    }
}