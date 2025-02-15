import {Component, Input} from '@angular/core';
import {Observable} from 'rxjs';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'app-status-bar',
  standalone: true,
  imports: [
    AsyncPipe
  ],

  template: `
    @if ((isOffline$ | async)) {
      <div
        class="fixed top-24 left-1/2 transform -translate-x-1/2 bg-red-500 px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 z-50 animate-bounce">
        <span>⚠️</span>
        <span class="text-white font-bold">Offline Mode</span>
        @if ((pendingCount$ | async) ?? 0 > 0) {
          <div class="bg-red-600 px-3 py-1 rounded-lg">
            <span class="text-white">{{ pendingCount$ | async }} pending</span>
          </div>
        }
      </div>
    }
  `
})
export class StatusBarComponent {
  @Input() isOffline$!: Observable<boolean>;
  @Input() pendingCount$!: Observable<number>;
}
