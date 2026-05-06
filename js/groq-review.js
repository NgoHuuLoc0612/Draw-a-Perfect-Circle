/**
 * @file groq-review.js
 * @description Fetches a witty AI-generated review of the drawing from Groq API.
 */

class GroqReview {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.endpoint = 'https://api.groq.com/openai/v1/chat/completions';
        // Current active Groq models (as of 2025)
        this.model = 'llama-3.1-8b-instant';
    }

    async generateReview(score, grade, metrics) {
        if (!this.apiKey || this.apiKey === 'YOUR_GROQ_API_KEY') {
            return this._getFallbackReview(grade);
        }

        const prompt = `You are a sarcastic geometry judge. Someone drew a freehand circle and scored ${score.toFixed(1)}% (Grade: ${grade}). Eccentricity: ${metrics.eccentricity?.toFixed(3) ?? 'N/A'}, Radius variation: ${metrics.radiusVariation ?? 'N/A'}, Closure gap: ${metrics.closureGap ?? 'N/A'}. Write 2 funny brutal sentences judging their circle. No emojis. Don't start with "I".`;

        try {
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model: this.model,
                    max_tokens: 120,
                    temperature: 0.9,
                    messages: [{ role: 'user', content: prompt }]
                })
            });

            if (!response.ok) {
                const errBody = await response.json().catch(() => ({}));
                console.warn('Groq API error body:', errBody);
                // Try fallback model if this one fails
                if (response.status === 400 || response.status === 404) {
                    return await this._retryWithFallbackModel(prompt);
                }
                throw new Error(`Groq API ${response.status}: ${errBody?.error?.message ?? 'unknown'}`);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content?.trim() || this._getFallbackReview(grade);
        } catch (e) {
            console.warn('Groq API failed:', e);
            return this._getFallbackReview(grade);
        }
    }

    async _retryWithFallbackModel(prompt) {
        const fallbackModels = ['llama3-8b-8192', 'gemma2-9b-it', 'mixtral-8x7b-32768'];
        for (const model of fallbackModels) {
            try {
                const response = await fetch(this.endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`,
                    },
                    body: JSON.stringify({
                        model,
                        max_tokens: 120,
                        temperature: 0.9,
                        messages: [{ role: 'user', content: prompt }]
                    })
                });
                if (response.ok) {
                    const data = await response.json();
                    const text = data.choices?.[0]?.message?.content?.trim();
                    if (text) {
                        console.log(`Groq: succeeded with fallback model ${model}`);
                        this.model = model; // remember working model
                        return text;
                    }
                }
            } catch (_) { /* try next */ }
        }
        return this._getFallbackReview('C');
    }

    _getFallbackReview(grade) {
        const reviews = {
            'S': [
                "This is statistically indistinguishable from a compass. Please seek help — no human should be this precise.",
                "Your circle is so round, it made the algorithm question its own existence.",
            ],
            'A': [
                "Impressive. Your nervous system is clearly more calibrated than most people's rulers.",
                "Not a perfect circle, but close enough that we'd let you build a wheel with it.",
            ],
            'B': [
                "It's round. Mostly. Your hand clearly had an opinion or two about the direction.",
                "Solid effort. A slight oval-ish quality, but nothing a good squint can't fix.",
            ],
            'C': [
                "This is technically a closed curve. We applaud the ambition if not the execution.",
                "Circle-ish. Like pizza that went through a rough Tuesday.",
            ],
            'D': [
                "This is a fascinating shape that brings up a lot of questions. 'Circle' is not one of the answers.",
                "Your hand was absolutely shaking. The data doesn't lie. The shape does, though.",
            ],
        };
        const pool = reviews[grade] || reviews['C'];
        return pool[Math.floor(Math.random() * pool.length)];
    }
}