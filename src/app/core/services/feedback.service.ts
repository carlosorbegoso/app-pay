import { Injectable } from '@angular/core';
import { Platform } from '@angular/cdk/platform';

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private audioContext: AudioContext | null = null;
  private sounds: { [key: string]: AudioBuffer } = {};
  private initialized = false;
  private hasUserInteraction = false;

  constructor(private platform: Platform) {
    // Detectar interacción del usuario
    document.addEventListener('touchstart', () => this.handleUserInteraction(), { once: true });
    document.addEventListener('mousedown', () => this.handleUserInteraction(), { once: true });
  }

  private handleUserInteraction() {
    console.log('User interaction detected');
    this.hasUserInteraction = true;
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  private async initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
      try {
        const intensities = ['light', 'medium', 'heavy'];
        for (const intensity of intensities) {
          try {
            const url = `/assets/sounds/tap-${intensity}.mp3`;
            console.log('Loading sound:', url);

            const response = await fetch(url);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            console.log(`Sound ${intensity} loaded, decoding...`);

            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.sounds[intensity] = audioBuffer;
            console.log(`Sound ${intensity} decoded and loaded successfully`);
          } catch (error) {
            console.error(`Error loading sound ${intensity}:`, error);
          }
        }
        this.initialized = true;
      } catch (error) {
        console.error('Error initializing audio context:', error);
        this.initialized = false;
      }
    }
  }

  async provideFeedback(intensity: 'light' | 'medium' | 'heavy' = 'medium') {
    if (!this.hasUserInteraction) {
      console.log('Waiting for user interaction...');
      return;
    }

    if (!this.initialized) {
      try {
        await this.initAudioContext();
      } catch (error) {
        console.error('Error initializing audio:', error);
        this.fallbackToVibration();
        return;
      }
    }

    try {
      if (this.audioContext && this.sounds[intensity]) {
        console.log('Playing sound:', intensity);

        // Asegurarse de que el contexto esté activo
        if (this.audioContext.state === 'suspended') {
          console.log('Resuming audio context');
          await this.audioContext.resume();
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = this.sounds[intensity];
        source.connect(this.audioContext.destination);

        // Configurar el volumen
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = 1.0; // Volumen máximo
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        source.start(0);
        console.log('Sound started successfully');
      } else {
        console.log('No audio context or sound available, falling back to vibration');
        this.fallbackToVibration();
      }
    } catch (error) {
      console.error('Error providing audio feedback:', error);
      this.fallbackToVibration();
    }
  }

  private fallbackToVibration() {
    if ('vibrate' in navigator) {
      console.log('Using vibration feedback');
      navigator.vibrate(50);
    }
  }
}
