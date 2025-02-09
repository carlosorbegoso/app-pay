import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, fromEvent, merge} from 'rxjs';
import {DatabaseService} from './database.service';
import {Transaction} from '../../models/transaction';
import {environment} from '../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class SyncService {
  private isOnline$ = new BehaviorSubject<boolean>(navigator.onLine);
  private isSyncing$ = new BehaviorSubject<boolean>(false);
  private pendingCount$ = new BehaviorSubject<number>(0);

  constructor(
    private http: HttpClient,
    private db: DatabaseService
  ) {
    this.initializeNetworkListeners();
    this.initializePeriodicSync();
  }

  private initializeNetworkListeners() {
    merge(
      fromEvent(window, 'online'),
      fromEvent(window, 'offline')
    ).subscribe(() => {
      this.isOnline$.next(navigator.onLine);
      if (navigator.onLine) {
        this.syncPendingTransactions();
      }
    });
  }

  private initializePeriodicSync() {
    setInterval(() => {
      if (navigator.onLine) {
        this.syncPendingTransactions();
      }
    }, 30000); // Try sync every 30 seconds
  }

  async syncPendingTransactions() {
    if (this.isSyncing$.value) return;

    try {
      this.isSyncing$.next(true);
      const transactions = await this.db.getPendingTransactions();

      if (transactions.length === 0) {
        this.pendingCount$.next(0);
        return;
      }

      await this.http.post(
        `${environment.apiUrl}/sync`,
        transactions
      ).toPromise();

      await this.db.clearPendingTransactions();
      this.pendingCount$.next(0);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.isSyncing$.next(false);
    }
  }

  async saveOfflineTransaction(transaction: Transaction) {
    await this.db.saveTransaction(transaction);
    const transactions = await this.db.getPendingTransactions();
    this.pendingCount$.next(transactions.length);
  }

  getOnlineStatus() {
    return this.isOnline$.asObservable();
  }

  getSyncingStatus() {
    return this.isSyncing$.asObservable();
  }

  getPendingCount() {
    return this.pendingCount$.asObservable();
  }
}
