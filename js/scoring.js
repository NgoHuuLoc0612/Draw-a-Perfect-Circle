/**
 * @file scoring.js
 * @description Calculates a final score based on analysis data.
 * This class weights different metrics to produce a single "perfection" percentage.
 */

class Scorer {
    constructor(analysisResults) {
        if (!analysisResults || !analysisResults.idealCircle) {
            throw new Error("Scoring requires valid analysis results.");
        }
        this.results = analysisResults;
        this.score = 0;
        this.detailedMetrics = {};

        // Define weights for different scoring components
        this.weights = {
            radiusConsistency: 0.60, // Most important factor
            closure: 0.25,
            curvatureConsistency: 0.15,
        };

        this._calculateScore();
    }

    _calculateScore() {
        const { idealCircle, radiusStats, closureGap, curvatureData } = this.results;
        
        // 1. Radius Consistency Score (0 to 1)
        // A lower variation is better. Map it to a 0-1 score.
        // We use an exponential decay function. A variation of 0 gives a score of 1.
        // A variation of 0.2 (20%) might give a score of ~0.5.
        const radiusScore = Math.exp(-15 * radiusStats.variation);
        this.detailedMetrics.radiusConsistency = radiusScore;

        // 2. Closure Score (0 to 1)
        // Compares the gap to the circle's circumference.
        const circumference = 2 * Math.PI * idealCircle.radius;
        const normalizedGap = closureGap / circumference;
        // Similar exponential decay for the gap score.
        const closureScore = Math.exp(-20 * normalizedGap);
        this.detailedMetrics.closure = closureScore;
        
        // 3. Curvature Consistency Score (0 to 1)
        // Compare standard deviation of curvature to its mean.
        const normalizedCurvatureStdDev = curvatureData.mean > 1e-6 ? curvatureData.stdDev / curvatureData.mean : 0;
        const curvatureScore = Math.exp(-5 * normalizedCurvatureStdDev);
        this.detailedMetrics.curvatureConsistency = curvatureScore;

        // Calculate final weighted score
        const finalScore = 
            (radiusScore * this.weights.radiusConsistency) +
            (closureScore * this.weights.closure) +
            (curvatureScore * this.weights.curvatureConsistency);
            
        this.score = finalScore * 100; // Convert to percentage
    }

    /**
     * Get the final calculated score.
     * @returns {number} The perfection score as a percentage.
     */
    getPerfectionScore() {
        return Math.max(0, Math.min(100, this.score)); // Clamp between 0 and 100
    }

    /**
     * Get a detailed breakdown of the scoring components.
     * @returns {object} An object with i18n keys and formatted values.
     */
    getDetailedMetrics() {
        const results = this.results;
        const idealCircle = results.idealCircle;

        return {
            // --- Summary Scores ---
            'metric_summary_scores': '',
            'metric_radius_stability': `${(this.detailedMetrics.radiusConsistency * 100).toFixed(1)}%`,
            'metric_path_closure': `${(this.detailedMetrics.closure * 100).toFixed(1)}%`,
            'metric_curvature_uniformity': `${(this.detailedMetrics.curvatureConsistency * 100).toFixed(1)}%`,
    
            // --- Geometric Properties ---
            'metric_geometric_props': '',
            'metric_ideal_radius': `${idealCircle.radius.toFixed(2)} px`,
            'metric_avg_drawn_radius': `${results.radiusStats.mean.toFixed(2)} px`,
            'metric_roundness_error': `${results.roundnessError.toFixed(2)} px`,
            'metric_eccentricity': `${results.eccentricity.toFixed(4)}`,
            'metric_form_factor': `${results.formFactor.toFixed(4)}`,
            'metric_closure_gap': `${results.closureGap.toFixed(2)} px`,
            'metric_path_length': `${results.polygonProps.perimeter.toFixed(2)} px`,

            // --- Consistency & Dynamics ---
            'metric_consistency_dynamics': '',
            'metric_radius_stddev': `${results.radiusStats.stdDev.toFixed(2)} px`,
            'metric_radius_variation': `${(results.radiusStats.variation * 100).toFixed(2)}%`,
            'metric_avg_drawing_speed': `${results.drawingDynamics.mean.toFixed(2)} rad/s`,
            'metric_speed_uniformity': `${results.drawingDynamics.stdDev.toFixed(2)}`,
            
            // --- Advanced Frequency Analysis ---
            'metric_advanced_analysis': '',
            'metric_harmonic_distortion': `${(results.fourierAnalysis.totalHarmonicDistortion * 100).toFixed(2)}%`,
        };
    }
}