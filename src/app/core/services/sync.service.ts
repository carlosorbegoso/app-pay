import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subject, fromEvent, lastValueFrom, merge } from 'rxjs';
import { debounceTime, filter } from 'rxjs/operators';
import { DatabaseService } from './database.service';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { TransactionCreateDto } from '../models/transaction-create.dto';
import { Transaction } from '../models/transaction';

@Injectable({
  providedIn: 'root'
})
export class SyncService {
  // Estado del servicio
  private isOnline$ = new BehaviorSubject<boolean>(navigator.onLine);
  private isSyncing$ = new BehaviorSubject<boolean>(false);
  private pendingCount$ = new BehaviorSubject<number>(0);
  private syncQueue$ = new Subject<void>();

  // Configuración
  private readonly BATCH_SIZE = 10;
  private readonly SYNC_DEBOUNCE = 2000;
  private readonly SYNC_INTERVAL = 30000;

  constructor(
    private http: HttpClient,
    private db: DatabaseService,
    private authService: AuthService
  ) {
    this.initializeNetworkListeners();
    this.initializeSyncQueue();
    this.initializePeriodicSync();
    this.updatePendingCount();
  }

  // Inicialización del sistema de cola de sincronización
  private initializeSyncQueue() {
    this.syncQueue$.pipe(
      debounceTime(this.SYNC_DEBOUNCE),
      filter(() => navigator.onLine && !this.isSyncing$.value)
    ).subscribe(() => {
      this.syncPendingTransactions();
    });
  }

  // Configuración de listeners de red
  private initializeNetworkListeners() {
    merge(
      fromEvent(window, 'online'),
      fromEvent(window, 'offline')
    ).subscribe(() => {
      const isOnline = navigator.onLine;
      this.isOnline$.next(isOnline);
      if (isOnline) {
        this.requestSync();
      }
    });
  }

  // Configuración de sincronización periódica
  private initializePeriodicSync() {
    setInterval(() => this.requestSync(), this.SYNC_INTERVAL);
  }

  // Solicitud de sincronización
  private requestSync() {
    this.syncQueue$.next();
  }

  // Actualización del contador de transacciones pendientes
  private async updatePendingCount() {
    const transactions = await this.db.getPendingTransactions();
    this.pendingCount$.next(transactions.length);
  }

  // Preparación de transacción para API
  private prepareTransactionForApi(transaction: Transaction): TransactionCreateDto {
    const { id, driver, ...rest } = transaction;
    return rest;
  }

  // Proceso de sincronización principal
  private async syncPendingTransactions() {
    if (this.isSyncing$.value) return;

    try {
      await this.db.initDatabase();
      this.isSyncing$.next(true);
      const transactions = await this.db.getPendingTransactions();

      if (transactions.length === 0) {
        this.pendingCount$.next(0);
        return;
      }

      const results = transactions.length > this.BATCH_SIZE
        ? await this.processBatchTransactions(transactions)
        : await this.processIndividualTransactions(transactions);

      if (results) {
        await this.db.clearPendingTransactions();
        this.pendingCount$.next(0);
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.isSyncing$.next(false);
    }
  }

  // Procesamiento por lotes
  private async processBatchTransactions(transactions: Transaction[]): Promise<boolean> {
    const currentDriver = this.authService.getCurrentDriver();
    if (!currentDriver) throw new Error('No driver logged in');

    try {
      const preparedTransactions = transactions.map(t => this.prepareTransactionForApi(t));
      await lastValueFrom(
        this.http.post(
          `${environment.apiUrl}/transactions/batch/${currentDriver.id}`,
          preparedTransactions
        )
      );
      return true;
    } catch (error) {
      console.error('Batch sync failed:', error);
      return false;
    }
  }

  // Procesamiento individual
  private async processIndividualTransactions(transactions: Transaction[]): Promise<boolean> {
    const currentDriver = this.authService.getCurrentDriver();
    if (!currentDriver) throw new Error('No driver logged in');

    try {
      for (const transaction of transactions) {
        const preparedTransaction = this.prepareTransactionForApi(transaction);
        await lastValueFrom(
          this.http.post(
            `${environment.apiUrl}/transactions/sync/${currentDriver.id}`,
            preparedTransaction
          )
        );
      }
      return true;
    } catch (error) {
      console.error('Individual sync failed:', error);
      return false;
    }
  }

  // Método público para guardar transacciones
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
      await this.updatePendingCount();
      this.requestSync();

      return true;
    } catch (error) {
      console.error('Error saving offline transaction:', error);
      throw error;
    }
  }

  getOnlineStatus() {
    return this.isOnline$.asObservable();
  }
  getPendingCount() {
    return this.pendingCount$.asObservable();
  }

}
