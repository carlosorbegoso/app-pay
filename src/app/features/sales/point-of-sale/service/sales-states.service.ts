import {BehaviorSubject} from 'rxjs';
import {DatabaseService} from '../../../../core/services/database.service';
import {Injectable} from '@angular/core';
import {SalesStats} from '../sidebar/sidebar.component';

@Injectable({
  providedIn: 'root'
})
export class SalesStatsService {
  private salesStatsSubject = new BehaviorSubject<SalesStats>({ ticketsSold: 0, totalAmount: 0 });
  salesStats$ = this.salesStatsSubject.asObservable();

  constructor(private db: DatabaseService) {}

  async loadStoredStats(): Promise<void> {
    try {
      const stats = await this.db.getDailyStats();
      if (stats) {
        this.salesStatsSubject.next(stats);
      }
    } catch (error) {
      console.error('Error loading stored data:', error);
    }
  }

  updateStats(amount: number): void {
    const currentStats = this.salesStatsSubject.value;
    this.salesStatsSubject.next({
      ticketsSold: currentStats.ticketsSold + 1,
      totalAmount: currentStats.totalAmount + amount
    });
  }
}
