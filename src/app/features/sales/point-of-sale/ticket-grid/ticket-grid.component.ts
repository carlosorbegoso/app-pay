import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TicketOption } from '';

@Component({
  selector: 'app-ticket-grid',
  templateUrl: './ticket-grid.component.html'
})
export class TicketGridComponent {
  @Input() title!: string;
  @Input() tickets!: TicketOption[];
  @Input() processing = false;
  @Input() ticketType!: string;
  @Input() buttonClass!: string;
  @Output() onTicketSelected = new EventEmitter<{event: Event, ticket: TicketOption}>();
}
