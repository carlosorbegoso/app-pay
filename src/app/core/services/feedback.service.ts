import { Injectable } from '@angular/core';
import { Platform } from '@angular/cdk/platform';

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private readonly isIOS: boolean;

  constructor(private platform: Platform) {
    this.isIOS = this.platform.IOS;
  }

  async provideFeedback(intensity: 'light' | 'medium' | 'heavy' = 'medium') {
    if (this.isIOS) {
      this.playSound(intensity);
    } else if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }

  private playSound(intensity: 'light' | 'medium' | 'heavy') {
    const sounds = {
      light: 'assets/sounds/tap-light.mp3',
      medium: 'assets/sounds/tap-medium.mp3',
      heavy: 'assets/sounds/tap-heavy.mp3'
    };

    const audio = new Audio(sounds[intensity]);
    audio.play().catch(() => console.log('Audio feedback not available'));
  }

  async provideHapticFeedback(intensity: 'light' | 'medium' | 'heavy' = 'medium') {
    if (this.isIOS) {
      this.playSound(intensity);
    } else if ('vibrate' in navigator) {
      switch (intensity) {
        case 'light':
          navigator.vibrate(50);
          break;
        case 'medium':
          navigator.vibrate(100);
          break;
        case 'heavy':
          navigator.vibrate([100, 50, 100]);
          break;
      }
    }
  }
}
