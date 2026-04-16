'use client'

import { useCallback, useRef, useEffect } from 'react'
import { useShipKit } from '@/lib/shipkit-context'

// Pentatonic scale frequencies for pleasant tones
const PENTATONIC_SCALE = [
  261.63, // C4
  293.66, // D4
  329.63, // E4
  392.00, // G4
  440.00, // A4
]

// Secondary zone gets a distinct low tone
const SECONDARY_TONE = 174.61 // F3

export function useAudio() {
  const { settings } = useShipKit()
  const audioContextRef = useRef<AudioContext | null>(null)
  const speechSynthRef = useRef<SpeechSynthesis | null>(null)
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      speechSynthRef.current = window.speechSynthesis
    }
    
    return () => {
      audioContextRef.current?.close()
    }
  }, [])
  
  const playTone = useCallback((frequency: number, duration: number = 0.15) => {
    if (!audioContextRef.current || settings?.audioMuted) return
    
    const ctx = audioContextRef.current
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    oscillator.type = 'sine'
    oscillator.frequency.value = frequency
    
    const volume = (settings?.audioVolume ?? 80) / 100
    gainNode.gain.setValueAtTime(volume * 0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration)
  }, [settings?.audioMuted, settings?.audioVolume])
  
  const speak = useCallback((text: string) => {
    if (!speechSynthRef.current || settings?.audioMuted) return
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.volume = (settings?.audioVolume ?? 80) / 100
    utterance.rate = 1.1
    
    if (settings?.voiceId) {
      const voices = speechSynthRef.current.getVoices()
      const selectedVoice = voices.find(v => v.voiceURI === settings.voiceId)
      if (selectedVoice) {
        utterance.voice = selectedVoice
      }
    }
    
    speechSynthRef.current.speak(utterance)
  }, [settings?.audioMuted, settings?.audioVolume, settings?.voiceId])
  
  const playZoneSound = useCallback((zone: 'primary' | 'secondary', zoneIndex: number = 0) => {
    if (settings?.audioMode === 'voice') {
      if (zone === 'secondary') {
        speak(settings?.secondaryZoneName ?? 'Clerk Counter')
      } else {
        speak(`Zone ${zoneIndex + 1}`)
      }
    } else {
      // Tone mode
      if (zone === 'secondary') {
        playTone(SECONDARY_TONE, 0.25)
      } else {
        const frequency = PENTATONIC_SCALE[zoneIndex % PENTATONIC_SCALE.length]
        playTone(frequency)
      }
    }
  }, [settings?.audioMode, settings?.secondaryZoneName, speak, playTone])
  
  const playSuccess = useCallback(() => {
    playTone(523.25, 0.1) // C5
    setTimeout(() => playTone(659.25, 0.15), 100) // E5
  }, [playTone])
  
  const playError = useCallback(() => {
    playTone(220, 0.3) // A3 - low warning tone
  }, [playTone])
  
  const playComplete = useCallback(() => {
    // Happy ascending arpeggio
    playTone(392, 0.1)
    setTimeout(() => playTone(493.88, 0.1), 100)
    setTimeout(() => playTone(587.33, 0.15), 200)
  }, [playTone])
  
  const getAvailableVoices = useCallback(() => {
    if (!speechSynthRef.current) return []
    return speechSynthRef.current.getVoices()
  }, [])
  
  return {
    playTone,
    speak,
    playZoneSound,
    playSuccess,
    playError,
    playComplete,
    getAvailableVoices
  }
}
