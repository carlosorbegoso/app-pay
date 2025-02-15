// src/app/features/sales/point-of-sale/sidebar-actions/sidebar-actions.component.ts
import {Component, Input} from '@angular/core';

export interface SalesStats {
  ticketsSold: number;
  totalAmount: number;
}

@Component({
  selector: 'app-sidebar-actions',
  templateUrl: './sidebar-actions.component.html',
  styleUrls: ['./sidebar-actions.component.scss']
})
export class SidebarActionsComponent {
  @Input() show = false;
  @Input() stats!: SalesStats;
  @Input() onActionClick?: (action: string) => void;
}
