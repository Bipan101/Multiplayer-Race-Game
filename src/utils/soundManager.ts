export class SoundManager {
  private static instance: SoundManager;
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();
  private enabled: boolean = true;

  private constructor() {
    this.initAudioContext();
  }

  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  private initAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported');
      this.enabled = false;
    }
  }

  /**
   * Creates a simple tone for sound effects
   */
  private createTone(frequency: number, duration: number, type: OscillatorType = 'sine'): AudioBuffer | null {
    if (!this.audioContext || !this.enabled) return null;

    const sampleRate = this.audioContext.sampleRate;
    const numSamples = duration * sampleRate;
    const buffer = this.audioContext.createBuffer(1, numSamples, sampleRate);
    const channelData = buffer.getChannelData(0);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      let sample = 0;

      switch (type) {
        case 'sine':
          sample = Math.sin(2 * Math.PI * frequency * t);
          break;
        case 'square':
          sample = Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1;
          break;
        case 'sawtooth':
          sample = 2 * (t * frequency - Math.floor(t * frequency + 0.5));
          break;
      }

      // Apply envelope
      const envelope = Math.exp(-t * 3);
      channelData[i] = sample * envelope * 0.1;
    }

    return buffer;
  }

  /**
   * Initialize all game sounds
   */
  initSounds(): void {
    if (!this.enabled) return;

    // Engine sound (low frequency hum)
    const engineSound = this.createTone(80, 0.1, 'sawtooth');
    if (engineSound) this.sounds.set('engine', engineSound);

    // Bottle throw sound
    const throwSound = this.createTone(400, 0.2, 'square');
    if (throwSound) this.sounds.set('throw', throwSound);

    // Hit sound
    const hitSound = this.createTone(200, 0.3, 'square');
    if (hitSound) this.sounds.set('hit', hitSound);

    // Power-up sound
    const powerUpSound = this.createTone(600, 0.4, 'sine');
    if (powerUpSound) this.sounds.set('powerup', powerUpSound);

    // Explosion sound
    const explosionSound = this.createTone(100, 0.8, 'square');
    if (explosionSound) this.sounds.set('explosion', explosionSound);

    // Lap complete sound
    const lapSound = this.createTone(800, 0.5, 'sine');
    if (lapSound) this.sounds.set('lap', lapSound);
  }

  /**
   * Play a sound effect
   */
  playSound(soundName: string, volume: number = 0.5): void {
    if (!this.audioContext || !this.enabled) return;

    const buffer = this.sounds.get(soundName);
    if (!buffer) return;

    try {
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      source.buffer = buffer;
      gainNode.gain.value = Math.max(0, Math.min(1, volume));
      
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      source.start();
    } catch (error) {
      console.warn('Error playing sound:', error);
    }
  }

  /**
   * Toggle sound on/off
   */
  toggleSound(): boolean {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  /**
   * Check if sound is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}