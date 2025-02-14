import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {Driver} from '../../models/driver';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Mock driver estático para pruebas
  private mockDriver: Driver = {
    id: 1,
    driverCode: 'DRV001',
    firstName: 'John',
    lastName: 'Doe',
    username: 'john.doe',
    busId: 1
  };

  private currentDriver$ = new BehaviorSubject<Driver | null>(null);

  constructor() {
    // Auto-login con el conductor mock para pruebas
    this.currentDriver$.next(this.mockDriver);
    localStorage.setItem('currentDriver', JSON.stringify(this.mockDriver));
  }

  login(username: string, password: string): Promise<Driver> {
    // Simular login exitoso con el conductor mock
    return new Promise((resolve) => {
      setTimeout(() => {
        this.currentDriver$.next(this.mockDriver);
        localStorage.setItem('currentDriver', JSON.stringify(this.mockDriver));
        resolve(this.mockDriver);
      }, 500); // Simular delay de red
    });
  }

  logout(): void {
    this.currentDriver$.next(null);
    localStorage.removeItem('currentDriver');
  }

  getCurrentDriver(): Driver | null {
    return this.currentDriver$.getValue();
  }

  getCurrentDriver$(): Observable<Driver | null> {
    return this.currentDriver$.asObservable();
  }

  isLoggedIn(): boolean {
    return !!this.currentDriver$.getValue();
  }
}
