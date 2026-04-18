/**
 * Audio System for ShipKit
 * Plays zone cues and feedback sounds
 */

type AudioMode = 'tones' | 'voice' | 'silent'

interface AudioSystemConfig {
  mode: AudioMode
  volume: number
  muted: boolean
  voiceId?: string
}

export class AudioSystem {
  private config: AudioSystemConfig
  private audioContext: AudioContext | null = null

  constructor(config: Partial<AudioSystemConfig> = {}) {
    this.config = {
      mode: config.mode || 'tones',
      volume: config.volume || 80,
      muted: config.muted || false,
      voiceId: config.voiceId,
    }

    // Initialize Web Audio API
    if (typeof window !== 'undefined' && !this.audioContext) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        this.audioContext = new AudioContextClass()
      } catch (e) {
        console.warn('[ShipKit Audio] Web Audio API not supported')
      }
    }
  }

  private getVolume(): number {
    return this.config.muted ? 0 : this.config.volume / 100
  }

  /**
   * Play tone for zone notification
   * Zone 1: 440Hz (A4), Zone 2: 523Hz (C5), Zone 3: 587Hz (D5)
   * Clerk Counter: 220Hz (A3) - low frequency
   */
  private playTone(frequency: number, duration: number = 300) {
    if (!this.audioContext || this.config.muted) return

    const ctx = this.audioContext
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.value = frequency
    oscillator.type = 'sine'

    // Fade in/out
    gainNode.gain.setValueAtTime(0, ctx.currentTime)
    gainNode.gain.linearRampToValueAtTime(this.getVolume() * 0.5, ctx.currentTime + 0.01)
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration / 1000)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration / 1000)
  }

  /**
   * Play pentatonic tone sequence (pleasant and recognizable)
   */
  private playPentatonicSequence(baseFreq: number) {
    if (this.config.muted) return

    // Pentatonic scale: 1, 2, 3, 5, 6 (relative to base)
    const intervals = [1, 1.125, 1.25, 1.5, 1.68]
    const duration = 150

    intervals.forEach((interval, index) => {
      setTimeout(
        () => this.playTone(baseFreq * interval, duration),
        index * (duration + 50)
      )
    })
  }

  /**
   * Speak zone name using Web Speech API
   */
  private speak(text: string) {
    if (!this.config.muted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = this.getVolume()

      // Cancel any ongoing speech
      speechSynthesis.cancel()
      speechSynthesis.speak(utterance)
    }
  }

  /**
   * Play zone cue based on zone index
   * 0: Manifest 1 (440Hz)
   * 1: Manifest 2 (523Hz)
   * 2: Manifest 3 (587Hz)
   * -1: Clerk Counter (220Hz)
   */
  playZoneCue(zoneIndex: number, zoneName: string = '') {
    if (this.config.muted) return

    const frequencies: Record<number, number> = {
      0: 440, // A4 - Manifest 1
      1: 523, // C5 - Manifest 2
      2: 587, // D5 - Manifest 3
      3: 659, // E5 - Manifest 4
      4: 784, // G5 - Manifest 5
      '-1': 220, // A3 - Clerk Counter
    }

    const freq = frequencies[zoneIndex] || 440

    if (this.config.mode === 'tones') {
      this.playPentatonicSequence(freq)
    } else if (this.config.mode === 'voice') {
      const label =
        zoneIndex === -1
          ? 'Clerk Counter'
          : zoneIndex === 0
            ? 'One'
            : zoneIndex === 1
              ? 'Two'
              : zoneIndex === 2
                ? 'Three'
                : zoneIndex === 3
                  ? 'Four'
                  : zoneIndex === 4
                    ? 'Five'
                    : zoneName || `Zone ${zoneIndex + 1}`
      this.speak(label)
    }
  }

  /**
   * Play success sound
   */
  playSuccess() {
    if (this.config.muted) return

    if (this.config.mode === 'tones') {
      // Three ascending tones
      this.playTone(523, 100) // C5
      setTimeout(() => this.playTone(587, 100), 120) // D5
      setTimeout(() => this.playTone(659, 150), 240) // E5
    } else if (this.config.mode === 'voice') {
      this.speak('Success')
    }
  }

  /**
   * Play error sound
   */
  playError() {
    if (this.config.muted) return

    if (this.config.mode === 'tones') {
      // Two low tones (error pattern)
      this.playTone(220, 150) // A3
      setTimeout(() => this.playTone(220, 150), 200) // A3
    } else if (this.config.mode === 'voice') {
      this.speak('Error')
    }
  }

  /**
   * Play warning sound
   */
  playWarning() {
    if (this.config.muted) return

    if (this.config.mode === 'tones') {
      // Alternating tones
      this.playTone(392, 100) // G4
      setTimeout(() => this.playTone(330, 100), 120) // E4
      setTimeout(() => this.playTone(392, 100), 240) // G4
    } else if (this.config.mode === 'voice') {
      this.speak('Warning')
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AudioSystemConfig>) {
    this.config = { ...this.config, ...config }
  }

  /**
   * Test audio system
   */
  test() {
    console.log('[ShipKit Audio] Testing audio system...')
    this.playSuccess()
    setTimeout(() => this.playZoneCue(0, 'Zone 1'), 800)
    setTimeout(() => this.playZoneCue(-1, 'Clerk Counter'), 1600)
  }
}

// Singleton instance
let audioSystem: AudioSystem | null = null

export function getAudioSystem(config?: Partial<AudioSystemConfig>): AudioSystem {
  if (!audioSystem) {
    audioSystem = new AudioSystem(config)
  } else if (config) {
    audioSystem.updateConfig(config)
  }
  return audioSystem
}

export default AudioSystem
