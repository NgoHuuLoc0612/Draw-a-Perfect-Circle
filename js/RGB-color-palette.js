/**
 * @file RGB-color-palette.js
 * @description Manages and renders the color palette UI component.
 * Provides a selection of preset professional colors and a custom hex input.
 */

class RGBColorPalette {
    /**
     * @param {string} containerId - The ID of the DOM element to house the palette.
     * @param {Function} onColorChange - Callback function executed when the color changes.
     */
    constructor(containerId, onColorChange) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`Color palette container with id "${containerId}" not found.`);
        }
        this.onColorChange = onColorChange;
        this.activeColor = '#FFFFFF'; // Default color

        // A curated list of professional colors
        this.presetColors = [
            '#FFFFFF', '#C0C0C0', '#808080', '#000000',
            '#FF0000', '#800000', '#FFFF00', '#808000',
            '#00FF00', '#008000', '#00FFFF', '#008080',
            '#0000FF', '#000080', '#FF00FF', '#800080',
            '#4A90E2', '#D0021B', '#F5A623', '#F8E71C',
            '#7ED321', '#50E3C2', '#BD10E0', '#9013FE'
        ];

        this.hexInput = document.getElementById('hex-color-input');
        this._initialize();
    }

    _initialize() {
        this._renderPalette();
        this._attachEventListeners();
        this.setActiveColor(this.presetColors[0]);
    }

    _renderPalette() {
        this.container.innerHTML = ''; // Clear existing swatches
        this.presetColors.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = color;
            swatch.dataset.color = color;
            this.container.appendChild(swatch);
        });

        // Add some styling for the swatches
        const style = document.createElement('style');
        style.textContent = `
            #rgb-color-palette {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(25px, 1fr));
                gap: 8px;
            }
            .color-swatch {
                width: 100%;
                aspect-ratio: 1/1;
                border-radius: 50%;
                cursor: pointer;
                border: 2px solid transparent;
                transition: transform 0.2s, border-color 0.2s;
            }
            .color-swatch:hover {
                transform: scale(1.1);
            }
            .color-swatch.active {
                border-color: var(--accent-color);
                transform: scale(1.2);
            }
        `;
        document.head.appendChild(style);
    }

    _attachEventListeners() {
        // Event delegation for swatch clicks
        this.container.addEventListener('click', (event) => {
            const target = event.target;
            if (target.classList.contains('color-swatch')) {
                const color = target.dataset.color;
                this.setActiveColor(color);
                this.hexInput.value = color;
            }
        });

        // Listener for the HEX input field
        this.hexInput.addEventListener('input', (event) => {
            const potentialHex = event.target.value;
            if (Utils.isValidHex(potentialHex)) {
                this.setActiveColor(potentialHex);
            }
        });
    }

    /**
     * Sets the active color and triggers the callback.
     * @param {string} color - The new color in HEX format.
     */
    setActiveColor(color) {
        if (!Utils.isValidHex(color)) return;

        this.activeColor = color;

        // Update UI
        const currentActive = this.container.querySelector('.color-swatch.active');
        if (currentActive) {
            currentActive.classList.remove('active');
        }

        const newActive = this.container.querySelector(`[data-color="${color.toUpperCase()}"]`);
        if (newActive) {
            newActive.classList.add('active');
        }
        
        if (this.hexInput.value.toUpperCase() !== color.toUpperCase()) {
            this.hexInput.value = color;
        }

        // Fire the callback
        if (typeof this.onColorChange === 'function') {
            this.onColorChange(this.activeColor);
        }
    }

    /**
     * Returns the currently selected color.
     * @returns {string} The active color in HEX format.
     */
    getActiveColor() {
        return this.activeColor;
    }
}