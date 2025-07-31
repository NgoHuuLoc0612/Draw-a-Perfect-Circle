/**
 * @file circle-analyzer.js
 * @description A highly complex module for analyzing the drawn points.
 * Implements multiple geometric and mathematical theorems to determine the
 * perfection of a hand-drawn circle. This includes least-squares fitting,
 * curvature analysis, polygon properties, eccentricity, and Fourier descriptors.
 */

class CircleAnalyzer {
    constructor(points) {
        if (!points || points.length < 10) { // Increased minimum for more stable analysis
            throw new Error("Analysis requires at least 10 points for reliable results.");
        }
        this.points = points;
        this.n = points.length;
        this.analysis = {};

        // Perform all calculations on instantiation
        this._performFullAnalysis();
    }

    /**
     * Main analysis pipeline. Executes all analytical methods and aggregates the results.
     */
    _performFullAnalysis() {
        // Core fitting algorithm, essential for most other metrics
        this.analysis.idealCircle = this._leastSquaresCircleFit();
        
        if (!this.analysis.idealCircle) {
            // If a circle couldn't be fitted, we cannot proceed with dependent analyses.
            throw new Error("The points are likely collinear and a circle could not be fitted.");
        }

        const { center, radius } = this.analysis.idealCircle;
        
        // --- Radial Consistency Analysis ---
        // Measures how much the drawn points deviate from the ideal circle's boundary.
        const radialDistances = this.points.map(p => Utils.distance(p, center));
        const meanRadius = radialDistances.reduce((sum, d) => sum + d, 0) / this.n;
        this.analysis.radiusStats = {
            mean: meanRadius,
            stdDev: Utils.standardDeviation(radialDistances, meanRadius),
            variation: Utils.standardDeviation(radialDistances, meanRadius) / meanRadius,
            min: Math.min(...radialDistances),
            max: Math.max(...radialDistances)
        };
        // Roundness Error (RON): Difference between the max and min radial distance.
        this.analysis.roundnessError = this.analysis.radiusStats.max - this.analysis.radiusStats.min;

        // --- Geometric & Shape Property Analysis ---
        this.analysis.closureGap = this._calculateClosureGap();
        this.analysis.polygonProps = this._calculatePolygonProperties();
        // Form Factor: A measure of roundness. A perfect circle has a form factor of 1.
        // Formula: F = (4 * PI * Area) / (Perimeter^2)
        if (this.analysis.polygonProps.perimeter > 0) {
            this.analysis.formFactor = (4 * Math.PI * this.analysis.polygonProps.area) / Math.pow(this.analysis.polygonProps.perimeter, 2);
        } else {
            this.analysis.formFactor = 0;
        }

        // --- Curvature & Ellipticity Analysis ---
        this.analysis.curvatureData = this._analyzeCurvature();
        this.analysis.eccentricity = this._calculateEccentricity();
        
        // --- Advanced Signal Processing Analysis ---
        this.analysis.drawingDynamics = this._analyzeDrawingDynamics();
        this.analysis.fourierAnalysis = this._analyzeShapeWithFourierDescriptors(radialDistances);
    }

    /**
     * Finds the best-fit circle using the Least Squares method (Pratt-Taubin method).
     * This minimizes the sum of squared distances from the points to the circle's edge.
     * It solves a linear system to find the center (a, b) and radius (R).
     * The equation of the circle is (x-a)^2 + (y-b)^2 = R^2.
     * @returns {{center: {x: number, y: number}, radius: number}|null}
     */
    _leastSquaresCircleFit() {
        let sumX = 0, sumY = 0;
        let sumX2 = 0, sumY2 = 0, sumXY = 0;
        let sumX3 = 0, sumY3 = 0, sumXY2 = 0, sumX2Y = 0;

        for (const p of this.points) {
            const x = p.x;
            const y = p.y;
            const x2 = x * x;
            const y2 = y * y;
            
            sumX += x;
            sumY += y;
            sumX2 += x2;
            sumY2 += y2;
            sumXY += x * y;
            sumX3 += x * x2;
            sumY3 += y * y2;
            sumXY2 += x * y2;
            sumX2Y += x2 * y;
        }

        const A = this.n * sumX2 - sumX * sumX;
        const B = this.n * sumXY - sumX * sumY;
        const C = this.n * sumY2 - sumY * sumY;
        const D = 0.5 * (this.n * sumXY2 - sumX * sumY2 + this.n * sumX3 - sumX * sumX2);
        const E = 0.5 * (this.n * sumX2Y - sumY * sumX2 + this.n * sumY3 - sumY * sumY2);

        const determinant = A * C - B * B;
        if (Math.abs(determinant) < 1e-10) {
            // Points are collinear, cannot form a circle.
            return null;
        }

        // Center coordinates (a, b)
        const a = (D * C - B * E) / determinant;
        const b = (A * E - B * D) / determinant;
        
        // Radius R
        const R2 = (sumX2 - 2 * a * sumX + this.n * a * a + sumY2 - 2 * b * sumY + this.n * b * b) / this.n;
        const radius = Math.sqrt(R2);

        return { center: { x: a, y: b }, radius };
    }

    /**
     * Calculates properties of the polygon formed by the user's points.
     * Area is calculated using the Shoelace Formula.
     * Area = 0.5 * |(x1*y2 + x2*y3 + ... + xn*y1) - (y1*x2 + y2*x3 + ... + yn*x1)|
     * Perimeter is the sum of Euclidean distances between consecutive points.
     * @returns {{area: number, perimeter: number}}
     */
    _calculatePolygonProperties() {
        let area = 0;
        let perimeter = 0;

        for (let i = 0; i < this.n; i++) {
            const p1 = this.points[i];
            const p2 = this.points[(i + 1) % this.n]; // Wrap around for the last segment

            // Shoelace formula component
            area += (p1.x * p2.y - p2.x * p1.y);
            
            // Perimeter component
            perimeter += Utils.distance(p1, p2);
        }
        
        return { area: Math.abs(area / 2.0), perimeter };
    }

    /**
     * Calculates the distance between the start and end points of the drawing.
     * A smaller gap relative to the circle size is better.
     * @returns {number} The closure gap distance.
     */
    _calculateClosureGap() {
        if (this.n < 2) return 0;
        const startPoint = this.points[0];
        const endPoint = this.points[this.n - 1];
        return Utils.distance(startPoint, endPoint);
    }
    
    /**
     * Analyzes the curvature consistency along the path. A perfect circle has
     * constant curvature (k = 1/R). We measure the variance in curvature.
     * Curvature k = |x'y'' - y'x''| / (x'^2 + y'^2)^(3/2)
     * Using finite differences to approximate derivatives.
     * @returns {{mean: number, stdDev: number}}
     */
    _analyzeCurvature() {
        const curvatures = [];
        for (let i = 1; i < this.n - 1; i++) {
            const p_prev = this.points[i - 1];
            const p_curr = this.points[i];
            const p_next = this.points[i + 1];

            // First derivatives (velocity components)
            const x_prime = (p_next.x - p_prev.x) / 2;
            const y_prime = (p_next.y - p_prev.y) / 2;
            
            // Second derivatives (acceleration components)
            const x_double_prime = p_next.x - 2 * p_curr.x + p_prev.x;
            const y_double_prime = p_next.y - 2 * p_curr.y + p_prev.y;
            
            const numerator = Math.abs(x_prime * y_double_prime - y_prime * x_double_prime);
            const denominator = Math.pow(x_prime * x_prime + y_prime * y_prime, 1.5);

            if (denominator > 1e-7) { // Avoid division by zero for stationary points
                curvatures.push(numerator / denominator);
            }
        }

        if (curvatures.length === 0) return { mean: 0, stdDev: 0 };

        const meanCurvature = curvatures.reduce((sum, c) => sum + c, 0) / curvatures.length;
        const stdDevCurvature = Utils.standardDeviation(curvatures, meanCurvature);
        
        return { mean: meanCurvature, stdDev: stdDevCurvature };
    }

    /**
     * Calculates the eccentricity of the shape by treating it as an ellipse.
     * A perfect circle has an eccentricity of 0.
     * This is found by computing the eigenvalues of the points' covariance matrix.
     * Eccentricity e = sqrt(1 - (lambda_min / lambda_max))
     * @returns {number} The eccentricity, from 0 (circle) to 1 (line).
     */
    _calculateEccentricity() {
        const center = this.analysis.idealCircle.center;

        // Calculate second-order central moments
        let mu_xx = 0, mu_yy = 0, mu_xy = 0;
        for (const p of this.points) {
            const dx = p.x - center.x;
            const dy = p.y - center.y;
            mu_xx += dx * dx;
            mu_yy += dy * dy;
            mu_xy += dx * dy;
        }
        mu_xx /= this.n;
        mu_yy /= this.n;
        mu_xy /= this.n;

        // Calculate eigenvalues of the covariance matrix
        const term = Math.sqrt(Math.pow(mu_xx - mu_yy, 2) + 4 * mu_xy * mu_xy);
        const lambda_max = (mu_xx + mu_yy + term) / 2;
        const lambda_min = (mu_xx + mu_yy - term) / 2;

        if (lambda_max <= 0) return 0; // Should not happen with real points

        return Math.sqrt(1 - (lambda_min / lambda_max));
    }

    /**
     * Analyzes the steadiness of the drawing motion by looking at angular velocity.
     * A perfect, steadily drawn circle would have constant angular velocity.
     * We calculate the standard deviation of the angular velocity.
     * Angular velocity omega = d(theta)/dt
     * @returns {{mean: number, stdDev: number}}
     */
    _analyzeDrawingDynamics() {
        const center = this.analysis.idealCircle.center;
        const velocities = [];

        for (let i = 1; i < this.n; i++) {
            const p1 = this.points[i-1];
            const p2 = this.points[i];
            
            const dt = (p2.t - p1.t) / 1000.0; // Time delta in seconds
            if (dt < 1e-6) continue;

            const theta1 = Math.atan2(p1.y - center.y, p1.x - center.x);
            const theta2 = Math.atan2(p2.y - center.y, p2.x - center.x);

            let d_theta = theta2 - theta1;
            // Handle angle wrapping at PI/-PI
            if (d_theta > Math.PI) d_theta -= 2 * Math.PI;
            if (d_theta < -Math.PI) d_theta += 2 * Math.PI;
            
            velocities.push(Math.abs(d_theta / dt));
        }

        if(velocities.length === 0) return { mean: 0, stdDev: 0 };
        
        const meanVelocity = velocities.reduce((sum, v) => sum + v, 0) / velocities.length;
        const stdDevVelocity = Utils.standardDeviation(velocities, meanVelocity);
        
        return { mean: meanVelocity, stdDev: stdDevVelocity };
    }
    
    /**
     * Decomposes the shape into its fundamental frequencies using Fourier analysis.
     * We treat the radius as a function of angle r(theta) and find its frequency components.
     * For a perfect circle, only the DC component (average radius) exists. All other
     * harmonic magnitudes will be zero. Higher magnitudes for other harmonics
     * indicate specific deformations (e.g., 2nd harmonic = ovalness).
     * @param {number[]} radialDistances - Pre-calculated distances of each point from the center.
     * @returns {{magnitudes: number[], totalHarmonicDistortion: number}}
     */
    _analyzeShapeWithFourierDescriptors(radialDistances) {
        const center = this.analysis.idealCircle.center;
        const numHarmonics = 10;
        const magnitudes = new Array(numHarmonics).fill(0);
        
        const angles = this.points.map(p => Math.atan2(p.y - center.y, p.x - center.x));

        for (let k = 0; k < numHarmonics; k++) {
            let realSum = 0; // Cosine component
            let imagSum = 0; // Sine component

            for (let i = 0; i < this.n; i++) {
                const angle = k * angles[i];
                realSum += radialDistances[i] * Math.cos(angle);
                imagSum += radialDistances[i] * Math.sin(angle);
            }

            realSum /= this.n;
            imagSum /= this.n;

            // Magnitude of harmonic k: M_k = sqrt(real^2 + imag^2)
            magnitudes[k] = Math.sqrt(realSum * realSum + imagSum * imagSum);
        }
        
        const dcMagnitude = magnitudes[0]; // Average radius
        let acPowerSum = 0; // Sum of distortion harmonics
        for (let k = 1; k < numHarmonics; k++) {
            acPowerSum += magnitudes[k];
        }

        // Total Harmonic Distortion: ratio of non-ideal components to the ideal DC component
        const totalHarmonicDistortion = (dcMagnitude > 0) ? (acPowerSum / dcMagnitude) : 0;
        
        return { magnitudes, totalHarmonicDistortion };
    }


    /**
     * Public method to retrieve the full analysis results.
     * @returns {object} The comprehensive analysis data object.
     */
    getResults() {
        return this.analysis;
    }
}