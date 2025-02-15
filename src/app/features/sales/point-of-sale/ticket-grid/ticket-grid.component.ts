import { Component, EventEmitter, Input, Output } from '@angular/core';
import {Observable} from 'rxjs';
import {TicketOption} from '../../../../core/models/ticket-option.interface';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'app-ticket-grid',
  imports: [
    AsyncPipe
  ],
  templateUrl: './ticket-grid.component.html'
})
export class TicketGridComponent {
  @Input() title!: string;
  @Input() tickets!: TicketOption[];
  @Input() isProcessing$!: Observable<boolean>;
  @Input() buttonClass = `ticket-button bg-gradient-to-br from-blue-700 to-blue-800
    hover:from-blue-600 hover:to-blue-700 rounded-lg text-white
    shadow-lg active:scale-95 transition-all flex flex-col
    items-center justify-center min-h-[150px]
    disabled:opacity-50 disabled:cursor-not-allowed
    relative overflow-hidden`;

  @Output() onTicketSelected = new EventEmitter<{
    event: Event;
    ticket: TicketOption;
  }>();
}
