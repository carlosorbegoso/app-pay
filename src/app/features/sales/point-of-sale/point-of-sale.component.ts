import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatabaseService } from '../../../core/services/database.service';
import { SyncService } from '../../../core/services/sync.service';
import { TicketType } from '../../../models/ticket-type';
import { PaymentMethod } from '../../../models/payment-method';
import { Observable } from 'rxjs';
import {Transaction} from '../../../models/transaction';

interface TicketOption {
  type: TicketType;
  price: number;
  label: string;
}

@Component({
  selector: 'app-point-of-sale',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './point-of-sale.component.html',
  styleUrl: './point-of-sale.component.scss'
})
export class PointOfSaleComponent implements OnInit {
  isOnline$!: Observable<boolean>;
  pendingCount$!: Observable<number>;

  adultTickets: TicketOption[] = [
    { type: TicketType.ADULT_DIRECT, price: 2.00, label: 'DIRECT' },
    { type: TicketType.ADULT_ZONAL, price: 2.50, label: 'ZONAL' },
    { type: TicketType.ADULT_INTERZONAL, price: 3.00, label: 'INTERZONAL' }
  ];

  studentTickets: TicketOption[] = [
    { type: TicketType.STUDENT_DIRECT, price: 1.00, label: 'DIRECT' },
    { type: TicketType.STUDENT_ZONAL, price: 1.20, label: 'ZONAL' },
    { type: TicketType.STUDENT_INTERZONAL, price: 1.50, label: 'INTERZONAL' }
  ];

  constructor(
    private db: DatabaseService,
    private syncService: SyncService
  ) {
    this.initializeObservables();
  }

  private initializeObservables(): void {
    this.isOnline$ = this.syncService.getOnlineStatus();
    this.pendingCount$ = this.syncService.getPendingCount();
  }

  async ngOnInit() {
    await this.db.initDatabase();
  }

  async processTicket(type: TicketType, price: number) {
    const transaction: Transaction = {
      ticketType: type,
      amount: price,
      timestamp: new Date(),
      synced: false,
      paymentMethod: PaymentMethod.CASH
    };

    try {
      await this.syncService.saveOfflineTransaction(transaction);

      if (navigator.onLine) {
        await this.syncService.syncPendingTransactions();
      }
    } catch (error) {
      console.error('Error processing ticket:', error);
    }
  }
}
