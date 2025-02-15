import {Component, EventEmitter, Output} from '@angular/core';

@Component({
  selector: 'app-quick-actions',
  templateUrl: './quick-actions.component.html',
})

export class QuickActionsComponent {
  @Output() actionClick = new EventEmitter<{event: Event, action: string}>();

  onActionClick(event: Event, action: string) {
    this.actionClick.emit({ event, action });
  }
}
