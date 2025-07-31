/**
 * @file utils.js
 * @description A comprehensive utility library for common functions.
 * This module provides helper functions for vector math, DOM manipulation,
 * throttling, and other reusable logic to keep other modules clean.
 */

const Utils = {
    /**
     * Throttles a function to limit its execution rate.
     * @param {Function} func - The function to throttle.
     * @param {number} limit - The throttle duration in milliseconds.
     * @returns {Function} The throttled function.
     */
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Maps a value from one range to another.
     * @param {number} value - The input value.
     * @param {number} start1 - The lower bound of the input range.
     * @param {number} stop1 - The upper bound of the input range.
     * @param {number} start2 - The lower bound of the output range.
     * @param {number} stop2 - The upper bound of the output range.
     * @returns {number} The mapped value.
     */
    map(value, start1, stop1, start2, stop2) {
        return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
    },

    /**
     * Calculates the Euclidean distance between two points.
     * @param {{x: number, y: number}} p1 - The first point.
     * @param {{x: number, y: number}} p2 - The second point.
     * @returns {number} The distance.
     */
    distance(p1, p2) {
        return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    },

    /**
     * Calculates the standard deviation of an array of numbers.
     * @param {number[]} arr - The array of numbers.
     * @param {number} [mean] - Optional pre-calculated mean.
     * @returns {number} The standard deviation.
     */
    standardDeviation(arr, mean = null) {
        const n = arr.length;
        if (n === 0) return 0;
        const avg = mean !== null ? mean : arr.reduce((a, b) => a + b) / n;
        const variance = arr.map(x => Math.pow(x - avg, 2)).reduce((a, b) => a + b) / n;
        return Math.sqrt(variance);
    },

    /**
     * Performs a deep copy of a JSON-serializable object.
     * @param {object} obj - The object to copy.
     * @returns {object} The deep-copied object.
     */
    deepCopy(obj) {
        try {
            return JSON.parse(JSON.stringify(obj));
        } catch (error) {
            console.error("Failed to deep copy object:", error);
            return null;
        }
    },

    /**
     * Validates if a string is a valid HEX color code.
     * @param {string} hex - The string to validate.
     * @returns {boolean} - True if it's a valid HEX color.
     */
    isValidHex(hex) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
    }
};

// Make it a global or export it as a module depending on the environment.
// For this project, we'll attach it to the window object.
window.Utils = Utils;