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
  @Input() buttonClass = `
    ticket-button
    bg-gradient-to-b from-blue-600 to-blue-700
    hover:from-blue-500 hover:to-blue-600
    active:from-blue-700 active:to-blue-800
    rounded-lg
    text-white
    transition-all duration-150
    flex flex-col items-center justify-center
    h-full w-full
    disabled:opacity-50 disabled:cursor-not-allowed
    relative overflow-hidden
    shadow-lg
  `;

  @Output() onTicketSelected = new EventEmitter<{
    event: Event;
    ticket: TicketOption;
  }>();
}
