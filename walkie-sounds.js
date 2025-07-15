// Walkie-Talkie Sound Effects Manager
class WalkieSounds {
    constructor() {
        this.audioContext = null;
        this.isInitialized = false;
        this.sounds = {};
        this.masterVolume = 0.7;
    }

    // Initialize audio context (must be called after user interaction)
    async initialize() {
        if (this.isInitialized) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            await this.createSounds();
            this.isInitialized = true;
            console.log('Walkie-talkie sounds initialized');
        } catch (error) {
            console.error('Failed to initialize walkie sounds:', error);
        }
    }

    // Create synthetic walkie-talkie sounds
    async createSounds() {
        // Start transmission sound (single beep)
        this.sounds.startTalk = this.createBeepSound(800, 0.15, 'start');
        
        // End transmission sound (double beep)
        this.sounds.endTalk = this.createDoubleBeepSound();
        
        // Optional: Static/noise sound for atmosphere
        this.sounds.static = this.createStaticSound();
    }

    // Create a single beep sound
    createBeepSound(frequency = 800, duration = 0.15, type = 'single') {
        return () => {
            if (!this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            oscillator.type = 'sine';
            
            // Envelope for smooth sound
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.3, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        };
    }

    // Create double beep for end transmission
    createDoubleBeepSound() {
        return () => {
            if (!this.audioContext) return;
            
            // First beep
            setTimeout(() => this.createBeepSound(600, 0.1)(), 0);
            // Second beep
            setTimeout(() => this.createBeepSound(800, 0.1)(), 150);
        };
    }

    // Create subtle static sound
    createStaticSound() {
        return (duration = 0.1) => {
            if (!this.audioContext) return;
            
            const bufferSize = this.audioContext.sampleRate * duration;
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            
            // Generate white noise
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * 0.1; // Low volume static
            }
            
            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();
            
            source.buffer = buffer;
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            gainNode.gain.setValueAtTime(this.masterVolume * 0.2, this.audioContext.currentTime);
            
            source.start();
        };
    }

    // Play start transmission sound
    playStartTalk() {
        if (this.sounds.startTalk) {
            this.sounds.startTalk();
        }
    }

    // Play end transmission sound
    playEndTalk() {
        if (this.sounds.endTalk) {
            this.sounds.endTalk();
        }
    }

    // Play static sound
    playStatic(duration = 0.1) {
        if (this.sounds.static) {
            this.sounds.static(duration);
        }
    }

    // Set master volume (0.0 to 1.0)
    setVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }

    // Resume audio context if suspended (for mobile browsers)
    async resumeContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }
}

// Global instance
const walkieSounds = new WalkieSounds();

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.walkieSounds = walkieSounds;
}