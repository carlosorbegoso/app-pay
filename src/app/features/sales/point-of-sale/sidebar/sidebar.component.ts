import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  @Input() show = false;
  @Input() ticketsSold = 0;
  @Input() totalAmount = 0;
  @Output() onClose = new EventEmitter<void>();
}
