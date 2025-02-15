import { Component, OnInit, Renderer2 } from '@angular/core';
import {AsyncPipe, CommonModule} from '@angular/common';
import { DatabaseService } from '../../../core/services/database.service';
import { TicketType } from '../../../models/ticket-type';
import { PaymentMethod } from '../../../models/payment-method';
import { BehaviorSubject, Observable } from 'rxjs';
import { Transaction } from '../../../models/transaction';
import { FeedbackService } from '../../../core/services/feedback.service';
import { Platform } from '@angular/cdk/platform';
import { SyncService } from '../../../core/services/sync.service';
import { AuthService } from '../../../core/services/auth.service';
import { TicketGridComponent } from './ticket-grid/ticket-grid.component';
import {PosHeaderComponent} from './pos-header/pos-header.component';
import {SidebarActionsComponent} from './sidebar/sidebar.component';

interface TicketOption {
  type: TicketType;
  price: number;
  label: string;
}

interface SalesStats {
  ticketsSold: number;
  totalAmount: number;
}

interface SystemStatus {
  isOnline: boolean;
  pendingCount: number;
}

@Component({
  selector: 'app-point-of-sale',
  standalone: true,
  imports: [TicketGridComponent, PosHeaderComponent, SidebarActionsComponent, AsyncPipe],
  templateUrl: './point-of-sale.component.html',
  styleUrl: './point-of-sale.component.scss'
})
export class PointOfSaleComponent implements OnInit {
  private static readonly BUTTON_ANIMATION_DURATION = 150;
  private static readonly SUCCESS_MESSAGE_DURATION = 2000;

  private salesStatsSubject = new BehaviorSubject<SalesStats>({ ticketsSold: 0, totalAmount: 0 });
  salesStats$ = this.salesStatsSubject.asObservable();
  isOnline$!: Observable<boolean>;
  pendingCount$!: Observable<number>;
  private showSuccessSubject = new BehaviorSubject<boolean>(false);
  showSuccess$ = this.showSuccessSubject.asObservable();
  private showSidebarSubject = new BehaviorSubject<boolean>(false);
  showSidebar$ = this.showSidebarSubject.asObservable();
  isProcessing$ = new BehaviorSubject<boolean>(false);
  isIOS: boolean;

  systemStatus$ = new BehaviorSubject<SystemStatus>({ isOnline: true, pendingCount: 0 });

  readonly adultTickets: TicketOption[] = [
    { type: TicketType.ADULT_DIRECT, price: 2.00, label: 'DIRECT' },
    { type: TicketType.ADULT_ZONAL, price: 2.50, label: 'ZONAL' },
    { type: TicketType.ADULT_INTERZONAL, price: 3.00, label: 'INTERZONAL' }
  ];

  readonly studentTickets: TicketOption[] = [
    { type: TicketType.STUDENT_DIRECT, price: 1.00, label: 'DIRECT' },
    { type: TicketType.STUDENT_ZONAL, price: 1.20, label: 'ZONAL' },
    { type: TicketType.STUDENT_INTERZONAL, price: 1.50, label: 'INTERZONAL' }
  ];

  constructor(
    private authService: AuthService,
    private db: DatabaseService,
    private syncService: SyncService,
    private feedbackService: FeedbackService,
    private renderer: Renderer2,
    private platform: Platform
  ) {
    this.initializeObservables();
    this.isIOS = this.platform.IOS;
  }
  handleSidebarAction(action: string) {
    switch(action) {
      case 'messages':
        // Handle messages action
        break;
      case 'tickets':
        // Handle tickets action
        break;
      case 'stats':
        // Handle stats action
        break;
      case 'settings':
        // Handle settings action
        break;
    }
  }
  private initializeObservables(): void {
    this.isOnline$ = this.syncService.getOnlineStatus();
    this.pendingCount$ = this.syncService.getPendingCount();
  }

  async ngOnInit(): Promise<void> {
    await this.initializeSystem();
  }

  private async initializeSystem(): Promise<void> {
    await this.db.initDatabase();
    await this.loadStoredData();
    this.checkDriverStatus();
  }

  private async loadStoredData(): Promise<void> {
    try {
      const stats = await this.db.getDailyStats();
      if (stats) {
        this.salesStatsSubject.next(stats);
      }
    } catch (error) {
      console.error('Error loading stored data:', error);
    }
  }

  private checkDriverStatus(): void {
    const driver = this.authService.getCurrentDriver();
    console.log(driver ? 'Logged in driver:' : 'No driver logged in', driver);
  }

  toggleSidebar(): void {
    this.showSidebarSubject.next(!this.showSidebarSubject.value);
  }

  async handleButtonPress(event: Event, callback: () => Promise<void>): Promise<void> {
    const button = event.currentTarget as HTMLElement;
    this.applyButtonEffect(button);

    try {
      await this.feedbackService.provideFeedback();
      await callback();
    } finally {
      this.removeButtonEffect(button);
    }
  }

  private applyButtonEffect(button: HTMLElement): void {
    this.renderer.addClass(button, 'button-pressed');
  }

  private removeButtonEffect(button: HTMLElement): void {
    setTimeout(() => {
      this.renderer.removeClass(button, 'button-pressed');
    }, PointOfSaleComponent.BUTTON_ANIMATION_DURATION);
  }

  async processTicket(event: Event, type: TicketType, price: number): Promise<void> {
    if (this.isProcessing$.value) return;

    const driver = this.authService.getCurrentDriver();
    if (!driver) {
      console.error('No driver logged in');
      return;
    }

    this.isProcessing$.next(true);

    try {
      await this.handleButtonPress(event, async () => {
        const transaction = this.createTransaction(type, price, driver);
        await this.executeTransaction(transaction);
      });
    } finally {
      this.isProcessing$.next(false);
    }
  }

  private async executeTransaction(transaction: Transaction): Promise<void> {
    const currentStats = this.salesStatsSubject.value;
    this.salesStatsSubject.next({
      ticketsSold: currentStats.ticketsSold + 1,
      totalAmount: currentStats.totalAmount + transaction.amount
    });

    this.showSuccessSubject.next(true);
    setTimeout(() => this.showSuccessSubject.next(false), PointOfSaleComponent.SUCCESS_MESSAGE_DURATION);

    await Promise.all([
      this.syncService.saveOfflineTransaction(transaction),
      this.syncIfOnline()
    ]);
  }

  private createTransaction(type: TicketType, price: number, driver: any): Transaction {
    return {
      ticketType: type,
      amount: price,
      timestamp: new Date(),
      synced: false,
      paymentMethod: PaymentMethod.CASH,
      driver: { id: driver.id }
    };
  }

  private async syncIfOnline(): Promise<void> {
    if (!navigator.onLine) return;

    try {
      await this.syncService.syncPendingTransactions();
    } catch (error) {
      console.error('Error syncing:', error);
    }
  }

  async handleQuickAction(event: Event, action: string): Promise<void> {
    await this.handleButtonPress(event, async () => {
      await this.feedbackService.provideFeedback();
      console.log('Quick action:', action);
    });
  }
}
