import {Injectable, Renderer2} from '@angular/core';
import {FeedbackService} from '../../../../core/services/feedback.service';

@Injectable({
  providedIn: 'root'
})
export class ButtonEffectService {
  private static readonly ANIMATION_DURATION = 150;

  constructor(
    private readonly renderer: Renderer2,
    private readonly feedbackService: FeedbackService
  ) {}

  async handleButtonPress(button: HTMLElement, callback: () => Promise<void>): Promise<void> {
    this.applyEffect(button);
    try {
      await this.feedbackService.provideFeedback();
      await callback();
    } finally {
      this.removeEffect(button);
    }
  }

  private applyEffect(button: HTMLElement): void {
    this.renderer.addClass(button, 'button-pressed');
  }

  private removeEffect(button: HTMLElement): void {
    setTimeout(() => {
      this.renderer.removeClass(button, 'button-pressed');
    }, ButtonEffectService.ANIMATION_DURATION);
  }
}
