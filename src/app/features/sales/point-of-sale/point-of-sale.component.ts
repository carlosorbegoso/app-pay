import {Component, OnInit, Renderer2} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DatabaseService} from '../../../core/services/database.service';
import {TicketType} from '../../../models/ticket-type';
import {PaymentMethod} from '../../../models/payment-method';
import {Observable} from 'rxjs';
import {Transaction} from '../../../models/transaction';
import {FeedbackService} from '../../../core/services/feedback.service';
import {Platform} from '@angular/cdk/platform';
import {SyncService} from '../../../core/services/sync.service';

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
  showSidebar = false;
  showSuccess = false;
  processingTicket = false;
  isIOS: boolean;
  ticketsSold = 0;
  totalAmount = 0;

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
    private syncService: SyncService,
    private feedbackService: FeedbackService,
    private renderer: Renderer2,
    private platform: Platform
  ) {
    this.initializeObservables();
    this.isIOS = this.platform.IOS;
  }

  private initializeObservables(): void {
    this.isOnline$ = this.syncService.getOnlineStatus();
    this.pendingCount$ = this.syncService.getPendingCount();
  }



  async ngOnInit() {
    await this.db.initDatabase();
    await this.loadStoredData();
  }
  private async loadStoredData() {
    try {
      const stats = await this.db.getDailyStats();
      if (stats) {
        this.ticketsSold = stats.ticketsSold;
        this.totalAmount = stats.totalAmount;
      }
    } catch (error) {
      console.error('Error loading stored data:', error);
    }
  }

  toggleSidebar() {
    this.showSidebar = !this.showSidebar;
  }

  async handleButtonPress(event: Event, callback: () => Promise<void>) {
    const button = event.currentTarget as HTMLElement;
    this.renderer.addClass(button, 'button-pressed');

    try {
      await this.feedbackService.provideFeedback();
      await callback();
    } finally {
      setTimeout(() => {
        this.renderer.removeClass(button, 'button-pressed');
      }, 150);
    }
  }


  async processTicket(event: Event, type: TicketType, price: number) {
    if (this.processingTicket) return;

    await this.handleButtonPress(event, async () => {
      try {
        this.processingTicket = true;
        await this.feedbackService.provideFeedback('medium');

        const transaction: Transaction = {
          ticketType: type,
          amount: price,
          timestamp: new Date(),
          synced: false,
          paymentMethod: PaymentMethod.CASH
        };

        await this.syncService.saveOfflineTransaction(transaction);

        this.ticketsSold++;
        this.totalAmount += price;

        if (navigator.onLine) {
          await this.syncService.syncPendingTransactions();
        }

        await this.feedbackService.provideFeedback('light');
        this.showSuccess = true;
        setTimeout(() => this.showSuccess = false, 2000);
      } catch (error) {
        console.error('Error processing ticket:', error);
        await this.feedbackService.provideFeedback('heavy');
      } finally {
        this.processingTicket = false;
      }
    });
  }

  async handleQuickAction(event: Event, action: string) {
    await this.handleButtonPress(event, async () => {
      await this.feedbackService.provideFeedback();

      console.log('Quick action:', action);
    });
  }
}
