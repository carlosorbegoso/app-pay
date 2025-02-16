import {Component, OnInit, Renderer2} from '@angular/core';
import {AsyncPipe} from '@angular/common';
import {DatabaseService} from '../../../core/services/database.service';
import {BehaviorSubject, Observable} from 'rxjs';
import {FeedbackService} from '../../../core/services/feedback.service';
import {Platform} from '@angular/cdk/platform';
import {SyncService} from '../../../core/services/sync.service';
import {AuthService} from '../../../core/services/auth.service';
import {TicketGridComponent} from './ticket-grid/ticket-grid.component';
import {PosHeaderComponent} from './pos-header/pos-header.component';
import {TicketType} from '../../../core/models/ticket-type';
import {Transaction} from '../../../core/models/transaction';
import {TicketService} from './service/ticket.service';

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
  imports: [TicketGridComponent, PosHeaderComponent, AsyncPipe],
  templateUrl: './point-of-sale.component.html',
  styleUrl: './point-of-sale.component.scss'
})
export class PointOfSaleComponent implements OnInit {
  private static readonly BUTTON_ANIMATION_DURATION = 150;
  private static readonly SUCCESS_MESSAGE_DURATION = 2000;

  private readonly salesStatsSubject = new BehaviorSubject<SalesStats>({ ticketsSold: 0, totalAmount: 0 });
  salesStats$ = this.salesStatsSubject.asObservable();
  isOnline$!: Observable<boolean>;
  pendingCount$!: Observable<number>;
  private readonly showSuccessSubject = new BehaviorSubject<boolean>(false);
  showSuccess$ = this.showSuccessSubject.asObservable();
  private readonly showSidebarSubject = new BehaviorSubject<boolean>(false);
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
    private readonly  authService: AuthService,
    private readonly db: DatabaseService,
    private readonly syncService: SyncService,
    private readonly feedbackService: FeedbackService,
    private readonly renderer: Renderer2,
    private  readonly platform: Platform,
    private readonly ticketService: TicketService,
  ) {
    this.initializeObservables();
    this.isIOS = this.platform.IOS;
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
        const transaction = this.ticketService.createTransaction(type, price, driver);
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
    setTimeout(() => this.showSuccessSubject.next(false),
      PointOfSaleComponent.SUCCESS_MESSAGE_DURATION);

    await this.syncService.saveOfflineTransaction(transaction);
  }


}
