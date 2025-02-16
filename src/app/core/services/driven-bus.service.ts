import { Injectable } from '@angular/core';
import {Driver} from '../models/driver';
import {Bus} from '../models/bus';
import {BusStatus} from '../models/bus-status';

@Injectable({
  providedIn: 'root'
})
export class DriverBusService {
  private readonly DRIVER_KEY = 'current_driver';
  private readonly BUS_KEY = 'bus_config';
  constructor() {
    if (!localStorage.getItem(this.DRIVER_KEY)) {
      this.setDriver(1234);
    }
  }
  private mockDrivers: Driver[] = [
    {
      id: 1234,
      driverCode: 'D1234',
      firstName: 'John',
      lastName: 'Doe',
      username: 'john.doe',
      busId: 1
    },
    {
      id: 5678,
      driverCode: 'D5678',
      firstName: 'Jane',
      lastName: 'Smith',
      username: 'jane.smith',
      busId: 2
    }
  ];

  private mockBus: Bus = {
    id: 1,
    routeId: 1,
    position: 0,
    timeToNextStop: 0,
    status: BusStatus.ON_ROUTE
  };

  getCurrentDriver(): Driver | null {
    const stored = localStorage.getItem(this.DRIVER_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  getBusConfig(): Bus {
    const stored = localStorage.getItem(this.BUS_KEY);
    return stored ? JSON.parse(stored) : this.mockBus;
  }

  setDriver(driverId: number): boolean {
    const driver = this.mockDrivers.find(d => d.id === driverId);
    if (driver) {
      localStorage.setItem(this.DRIVER_KEY, JSON.stringify(driver));
      return true;
    }
    return false;
  }

  setBusConfig(busId: number, adminKey?: string): boolean {
    if (adminKey === 'admin123') {
      const bus: Bus = {
        id: busId,
        routeId: 1,
        position: 0,
        timeToNextStop: 0,
        status: BusStatus.ON_ROUTE
      };
      localStorage.setItem(this.BUS_KEY, JSON.stringify(bus));
      return true;
    }
    return false;
  }

  logout() {
    localStorage.removeItem(this.DRIVER_KEY);
  }
}
