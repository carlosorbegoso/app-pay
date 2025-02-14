import { Injectable } from '@angular/core';
import { Transaction } from '../../models/transaction';
import { IDBPDatabase, openDB } from 'idb';

interface DailyStats {
  ticketsSold: number;
  totalAmount: number;
  lastUpdate: Date;
}

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private db!: IDBPDatabase;

  async initDatabase() {
    this.db = await openDB('pos-db', 3, {
      upgrade(db, oldVersion) {
        if (!db.objectStoreNames.contains('pending-transactions')) {
          const store = db.createObjectStore('pending-transactions', {
            keyPath: 'id',
            autoIncrement: true
          });
          store.createIndex('driverId', 'driver.id');
        }

        if (!db.objectStoreNames.contains('daily-stats')) {
          const dailyStatsStore = db.createObjectStore('daily-stats');
          const initialStats: DailyStats = {
            ticketsSold: 0,
            totalAmount: 0,
            lastUpdate: new Date()
          };
          dailyStatsStore.put(initialStats, 'current');
        }
      }
    });

    await this.checkDailyStats();
  }

  private async checkDailyStats() {
    const tx = this.db.transaction('daily-stats', 'readwrite');
    const store = tx.objectStore('daily-stats');

    try {
      const currentStats = await store.get('current');

      if (!currentStats) {
        // Si no hay estadísticas, inicializamos
        await store.put({
          ticketsSold: 0,
          totalAmount: 0,
          lastUpdate: new Date()
        }, 'current');
      } else {
        // Verificar si es un nuevo día
        const lastUpdate = new Date(currentStats.lastUpdate);
        const now = new Date();
        if (lastUpdate.toDateString() !== now.toDateString()) {
          await store.put({
            ticketsSold: 0,
            totalAmount: 0,
            lastUpdate: now
          }, 'current');
        }
      }
    } catch (error) {
      console.error('Error checking daily stats:', error);
      // Reinicializar si hay error
      await store.put({
        ticketsSold: 0,
        totalAmount: 0,
        lastUpdate: new Date()
      }, 'current');
    }
  }

  async saveTransaction(transaction: Transaction): Promise<void> {
    const tx = this.db.transaction(['pending-transactions', 'daily-stats'], 'readwrite');

    try {
      // Guardar la transacción pendiente
      await tx.objectStore('pending-transactions').add(transaction);

      // Actualizar estadísticas diarias
      const dailyStatsStore = tx.objectStore('daily-stats');
      const currentStats = await dailyStatsStore.get('current') as DailyStats;

      if (currentStats) {
        await dailyStatsStore.put({
          ticketsSold: currentStats.ticketsSold + 1,
          totalAmount: currentStats.totalAmount + transaction.amount,
          lastUpdate: new Date()
        }, 'current');
      }
    } catch (error) {
      console.error('Error saving transaction:', error);
      throw error;
    }
  }

  async getDailyStats(): Promise<DailyStats> {
    const tx = this.db.transaction('daily-stats', 'readonly');
    const store = tx.objectStore('daily-stats');
    const stats = await store.get('current');

    if (!stats) {
      return {
        ticketsSold: 0,
        totalAmount: 0,
        lastUpdate: new Date()
      };
    }

    return stats;
  }

  async getPendingTransactions(): Promise<Transaction[]> {
    return this.db.getAll('pending-transactions');
  }

  async clearPendingTransactions(): Promise<void> {
    return this.db.clear('pending-transactions');
  }

  async removePendingTransaction(id: number): Promise<void> {
    return this.db.delete('pending-transactions', id);
  }
}
