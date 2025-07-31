/**
 * @file brush.js
 * @description Defines the Brush class for drawing on the canvas.
 * Encapsulates properties like size and color and manages their state.
 */

class Brush {
    constructor(initialSize = 5, initialColor = '#FFFFFF') {
        this._size = initialSize;
        this._color = initialColor;
        
        // DOM element bindings
        this.sizeSlider = document.getElementById('brush-size');
        this.sizeValueDisplay = document.getElementById('brush-size-value');

        if (!this.sizeSlider || !this.sizeValueDisplay) {
            throw new Error("Brush control elements not found in the DOM.");
        }
        
        this._initialize();
    }
    
    _initialize() {
        this.sizeSlider.value = this._size;
        this.sizeValueDisplay.textContent = `${this._size}px`;
        
        // Add event listener for size changes
        this.sizeSlider.addEventListener('input', (e) => {
            this.setSize(parseInt(e.target.value, 10));
        });
    }

    /**
     * Get the current brush size.
     * @returns {number} The brush size in pixels.
     */
    get size() {
        return this._size;
    }

    /**
     * Set the brush size and update the UI.
     * @param {number} newSize - The new size in pixels.
     */
    setSize(newSize) {
        if (typeof newSize === 'number' && newSize > 0) {
            this._size = newSize;
            this.sizeValueDisplay.textContent = `${newSize}px`;
            // The slider position is updated by the event listener itself.
        }
    }
    
    /**
     * Get the current brush color.
     * @returns {string} The brush color in HEX format.
     */
    get color() {
        return this._color;
    }

    /**
     * Set the brush color.
     * @param {string} newColor - The new color in a CSS-compatible format.
     */
    setColor(newColor) {
        if (typeof newColor === 'string') {
            this._color = newColor;
        }
    }

    /**
     * Applies the current brush settings to a canvas rendering context.
     * @param {CanvasRenderingContext2D} ctx - The context to configure.
     */
    applyTo(ctx) {
        ctx.lineWidth = this.size;
        ctx.strokeStyle = this.color;
        ctx.fillStyle = this.color;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }
}