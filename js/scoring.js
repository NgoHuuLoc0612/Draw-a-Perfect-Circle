/**
 * @file scoring.js
 * @description Calculates a final score based on analysis data.
 * Now includes letter grades, fun labels, Groq AI review, and more metrics.
 */

class Scorer {
    constructor(analysisResults) {
        if (!analysisResults || !analysisResults.idealCircle) {
            throw new Error("Scoring requires valid analysis results.");
        }
        this.results = analysisResults;
        this.score = 0;
        this.detailedMetrics = {};

        this.weights = {
            radiusConsistency:    0.35,
            closure:              0.20,
            curvatureConsistency: 0.15,
            eccentricity:         0.15,
            harmonicDistortion:   0.10,
            speedUniformity:      0.05,
        };

        this._calculateScore();
    }

    _calculateScore() {
        const { idealCircle, radiusStats, closureGap, curvatureData, eccentricity, fourierAnalysis, drawingDynamics } = this.results;

        const radiusScore = Math.exp(-15 * radiusStats.variation);
        this.detailedMetrics.radiusConsistency = radiusScore;

        const circumference = 2 * Math.PI * idealCircle.radius;
        const normalizedGap = closureGap / circumference;
        const closureScore = Math.exp(-20 * normalizedGap);
        this.detailedMetrics.closure = closureScore;

        const normalizedCurvatureStdDev = curvatureData.mean > 1e-6 ? curvatureData.stdDev / curvatureData.mean : 0;
        const curvatureScore = Math.exp(-5 * normalizedCurvatureStdDev);
        this.detailedMetrics.curvatureConsistency = curvatureScore;

        const eccentricityScore = Math.exp(-8 * eccentricity);
        this.detailedMetrics.eccentricity = eccentricityScore;

        const thdScore = Math.exp(-10 * fourierAnalysis.totalHarmonicDistortion);
        this.detailedMetrics.harmonicDistortion = thdScore;

        const normalizedSpeedStdDev = drawingDynamics.mean > 1e-6 ? drawingDynamics.stdDev / drawingDynamics.mean : 0;
        const speedScore = Math.exp(-3 * normalizedSpeedStdDev);
        this.detailedMetrics.speedUniformity = speedScore;

        const finalScore =
            (radiusScore       * this.weights.radiusConsistency) +
            (closureScore      * this.weights.closure) +
            (curvatureScore    * this.weights.curvatureConsistency) +
            (eccentricityScore * this.weights.eccentricity) +
            (thdScore          * this.weights.harmonicDistortion) +
            (speedScore        * this.weights.speedUniformity);

        this.score = finalScore * 100;
    }

    getPerfectionScore() {
        return Math.max(0, Math.min(100, this.score));
    }

    getLetterGrade() {
        const s = this.getPerfectionScore();
        if (s >= 95) return 'S';
        if (s >= 85) return 'A';
        if (s >= 70) return 'B';
        if (s >= 50) return 'C';
        return 'D';
    }

    getFunLabel() {
        const grade = this.getLetterGrade();
        const labels = {
            'S': "Basically a compass. Are you even human?",
            'A': "Geometry teachers are scared of you.",
            'B': "Round enough to fool most people.",
            'C': "It's circle-adjacent. We'll allow it.",
            'D': "Your hand was shaking, wasn't it?",
        };
        return labels[grade];
    }

    getGradeColor() {
        const grade = this.getLetterGrade();
        const colors = {
            'S': '#ff6fcf',
            'A': '#00e676',
            'B': '#00aaff',
            'C': '#ffc107',
            'D': '#ff5252',
        };
        return colors[grade];
    }

    getDetailedMetrics() {
        const results = this.results;
        const idealCircle = results.idealCircle;
        return {
            'metric_summary_scores': '',
            'metric_radius_stability':     `${(this.detailedMetrics.radiusConsistency * 100).toFixed(1)}%`,
            'metric_path_closure':         `${(this.detailedMetrics.closure * 100).toFixed(1)}%`,
            'metric_curvature_uniformity': `${(this.detailedMetrics.curvatureConsistency * 100).toFixed(1)}%`,
            'metric_eccentricity_score':   `${(this.detailedMetrics.eccentricity * 100).toFixed(1)}%`,
            'metric_harmonic_score':       `${(this.detailedMetrics.harmonicDistortion * 100).toFixed(1)}%`,
            'metric_speed_score':          `${(this.detailedMetrics.speedUniformity * 100).toFixed(1)}%`,
            'metric_geometric_props': '',
            'metric_ideal_radius':         `${idealCircle.radius.toFixed(2)} px`,
            'metric_avg_drawn_radius':     `${results.radiusStats.mean.toFixed(2)} px`,
            'metric_roundness_error':      `${results.roundnessError.toFixed(2)} px`,
            'metric_eccentricity':         `${results.eccentricity.toFixed(4)}`,
            'metric_form_factor':          `${results.formFactor.toFixed(4)}`,
            'metric_closure_gap':          `${results.closureGap.toFixed(2)} px`,
            'metric_path_length':          `${results.polygonProps.perimeter.toFixed(2)} px`,
            'metric_consistency_dynamics': '',
            'metric_radius_stddev':        `${results.radiusStats.stdDev.toFixed(2)} px`,
            'metric_radius_variation':     `${(results.radiusStats.variation * 100).toFixed(2)}%`,
            'metric_avg_drawing_speed':    `${results.drawingDynamics.mean.toFixed(2)} rad/s`,
            'metric_speed_uniformity':     `${results.drawingDynamics.stdDev.toFixed(2)}`,
            'metric_advanced_analysis': '',
            'metric_harmonic_distortion':  `${(results.fourierAnalysis.totalHarmonicDistortion * 100).toFixed(2)}%`,
            'metric_2nd_harmonic':         `${(results.fourierAnalysis.magnitudes[2] ?? 0).toFixed(2)} (ovalness)`,
            'metric_3rd_harmonic':         `${(results.fourierAnalysis.magnitudes[3] ?? 0).toFixed(2)} (triangularity)`,
        };
    }
}