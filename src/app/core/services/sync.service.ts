import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, fromEvent, lastValueFrom, merge} from 'rxjs';
import {DatabaseService} from './database.service';
import {Transaction} from '../../models/transaction';
import {environment} from '../../../environments/environment';
import {AuthService} from './auth.service';
import {TransactionCreateDto} from '../../models/transaction-create.dto';


@Injectable({
  providedIn: 'root'
})
export class SyncService{
  private isOnline$ = new BehaviorSubject<boolean>(navigator.onLine);
  private isSyncing$ = new BehaviorSubject<boolean>(false);
  private pendingCount$ = new BehaviorSubject<number>(0);
  private readonly BATCH_SIZE = 10;


  constructor(
    private http: HttpClient,
    private db: DatabaseService,
    private authService: AuthService
  ) {
    this.initializeNetworkListeners();
    this.initializePeriodicSync();
  }

  private prepareTransactionForApi(transaction: Transaction): TransactionCreateDto {
    const { id, driver, ...rest } = transaction;
    return rest;
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
    }, 30000);
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

      if (transactions.length > this.BATCH_SIZE) {

        await this.processBatchTransactions(transactions);
      } else {
        await this.processIndividualTransactions(transactions);
      }

      await this.db.clearPendingTransactions();
      this.pendingCount$.next(0);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.isSyncing$.next(false);
    }
  }

  private async processBatchTransactions(transactions: Transaction[]) {
    const currentDriver = this.authService.getCurrentDriver();
    if (!currentDriver) throw new Error('No driver logged in');

    const preparedTransactions = transactions.map(t => this.prepareTransactionForApi(t));

    await lastValueFrom(
      this.http.post(
        `${environment.apiUrl}/transactions/batch/${currentDriver.id}`,
        preparedTransactions
      )
    );
  }


  private async processIndividualTransactions(transactions: Transaction[]) {
    const currentDriver = this.authService.getCurrentDriver();
    if (!currentDriver) throw new Error('No driver logged in');

    for (const transaction of transactions) {
      const preparedTransaction = this.prepareTransactionForApi(transaction);
      await lastValueFrom(
        this.http.post(
          `${environment.apiUrl}/transactions/sync/${currentDriver.id}`,
          preparedTransaction
        )
      );
    }
  }

  async saveOfflineTransaction(transaction: Transaction) {
    try {
      const currentDriver = this.authService.getCurrentDriver();
      if (!currentDriver) {
        throw new Error('No driver logged in');
      }
      const preparedTransaction: Transaction = {
        ...transaction,
        driver: { id: currentDriver.id },
        timestamp: new Date(),
        synced: false
      };

      await this.db.saveTransaction(preparedTransaction);
      const transactions = await this.db.getPendingTransactions();
      this.pendingCount$.next(transactions.length);

      if (navigator.onLine) {
        await this.syncPendingTransactions();
      }
    } catch (error) {
      console.error('Error saving offline transaction:', error);
      throw error;
    }
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
