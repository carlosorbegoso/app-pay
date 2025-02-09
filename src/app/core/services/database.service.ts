import { Injectable } from '@angular/core';
import { openDB, type IDBPDatabase } from 'idb';
import {Transaction} from '../../models/transaction';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private db!: IDBPDatabase;

  async initDatabase() {
    this.db = await openDB('pos-db', 1, {
      upgrade(db: IDBPDatabase) {
        if (!db.objectStoreNames.contains('pending-transactions')) {
          db.createObjectStore('pending-transactions', {
            keyPath: 'id',
            autoIncrement: true
          });
        }
      }
    });
  }

  async saveTransaction(transaction: Transaction): Promise<void> {
    await this.db.add('pending-transactions', transaction);
  }

  async getPendingTransactions(): Promise<Transaction[]> {
    return this.db.getAll('pending-transactions');
  }

  async clearPendingTransactions(): Promise<void> {
    await this.db.clear('pending-transactions');
  }
}
