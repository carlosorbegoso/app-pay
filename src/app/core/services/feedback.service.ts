import {Injectable} from '@angular/core';
import {Platform} from '@angular/cdk/platform';

type SoundIntensity = 'light' | 'medium' | 'heavy';

interface AudioResources {
  context: AudioContext;
  buffers: Map<SoundIntensity, AudioBuffer>;
}

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private static readonly DEFAULT_VIBRATION_DURATION = 50;
  private static readonly DEFAULT_GAIN_VALUE = 1.0;

  private audioResources: AudioResources | null = null;
  private isAudioInitialized = false;
  private hasUserInteracted = false;

  constructor(private platform: Platform) {
    this.setupUserInteractionListeners();
  }

  async provideFeedback(intensity: SoundIntensity = 'medium'): Promise<void> {
    if (!this.hasUserInteracted) {
      return;
    }

    if (!this.isAudioInitialized) {
      await this.initializeAudio();
    }

    await this.playSound(intensity);
  }

  private setupUserInteractionListeners(): void {
    const handleInteraction = () => this.onFirstUserInteraction();
    document.addEventListener('touchstart', handleInteraction, { once: true });
    document.addEventListener('mousedown', handleInteraction, { once: true });
  }

  private async onFirstUserInteraction(): Promise<void> {
    this.hasUserInteracted = true;
    await this.resumeAudioIfNeeded();
  }

  private async resumeAudioIfNeeded(): Promise<void> {
    if (this.audioResources?.context.state === 'suspended') {
      await this.audioResources.context.resume();
    }
  }

  private async initializeAudio(): Promise<void> {
    if (!this.audioResources) {
      const context = new AudioContext();
      const buffers = await this.loadSoundBuffers(context);
      this.audioResources = { context, buffers };
      this.isAudioInitialized = true;
    }
  }

  private async loadSoundBuffers(context: AudioContext): Promise<Map<SoundIntensity, AudioBuffer>> {
    const buffers = new Map<SoundIntensity, AudioBuffer>();
    const intensities: SoundIntensity[] = ['light', 'medium', 'heavy'];

    for (const intensity of intensities) {
      try {
        const buffer = await this.loadSoundBuffer(context, intensity);
        buffers.set(intensity, buffer);
      } catch (error) {
        console.error(`Failed to load ${intensity} sound:`, error);
      }
    }

    return buffers;
  }

  private async loadSoundBuffer(context: AudioContext, intensity: SoundIntensity): Promise<AudioBuffer> {
    const response = await fetch(`/assets/sounds/tap-${intensity}.mp3`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return await context.decodeAudioData(arrayBuffer);
  }

  private async playSound(intensity: SoundIntensity): Promise<void> {
    if (!this.audioResources) {
      this.useVibrationFeedback();
      return;
    }

    try {
      await this.resumeAudioIfNeeded();
      const buffer = this.audioResources.buffers.get(intensity);

      if (!buffer) {
        throw new Error(`Sound buffer not found for intensity: ${intensity}`);
      }

      await this.playSoundBuffer(buffer);
    } catch (error) {
      console.error('Failed to play sound:', error);
      this.useVibrationFeedback();
    }
  }

  private async playSoundBuffer(buffer: AudioBuffer): Promise<void> {
    if (!this.audioResources) return;

    const source = this.audioResources.context.createBufferSource();
    const gainNode = this.audioResources.context.createGain();

    source.buffer = buffer;
    gainNode.gain.value = FeedbackService.DEFAULT_GAIN_VALUE;

    source.connect(gainNode);
    gainNode.connect(this.audioResources.context.destination);

    source.start(0);
  }

  private useVibrationFeedback(): void {
    if ('vibrate' in navigator) {
      navigator.vibrate(FeedbackService.DEFAULT_VIBRATION_DURATION);
    }
  }
}
