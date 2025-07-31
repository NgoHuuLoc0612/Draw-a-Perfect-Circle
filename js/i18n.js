/**
 * @file i18n.js
 * @description Manages internationalization by loading and applying language packs.
 */
class I18n {
    constructor(defaultLang = 'en') {
        this.translations = {};
        this.currentLang = defaultLang;
    }

    async loadLanguage(lang) {
        try {
            const response = await fetch(`js/i18n/${lang}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load language file: ${lang}`);
            }
            this.translations = await response.json();
            this.currentLang = lang;
            document.documentElement.lang = lang; // Update document lang attribute
            return true;
        } catch (error) {
            console.error(error);
            if (lang !== 'en') {
                await this.loadLanguage('en'); // Fallback to English
            }
            return false;
        }
    }

    translate(key, replacements = {}) {
        let translation = this.translations[key] || key;
        for (const [placeholder, value] of Object.entries(replacements)) {
            translation = translation.replace(`{${placeholder}}`, value);
        }
        return translation;
    }

    updateDOM() {
        document.querySelectorAll('[data-i18n-key]').forEach(element => {
            const key = element.getAttribute('data-i18n-key');
            // Use innerHTML for keys that might contain HTML like the copyright
            if (key === 'copyright') {
                 element.innerHTML = this.translate(key);
            } else {
                 element.textContent = this.translate(key);
            }
        });
    }

    async changeLanguage(lang) {
        await this.loadLanguage(lang);
        this.updateDOM();
        localStorage.setItem('preferredLanguage', lang);
    }
}