import {Component, EventEmitter, OnDestroy, OnInit, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {interval, Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {DriverBusService} from '../../../../core/services/driven-bus.service';
import {Driver} from '../../../../core/models/driver';
import {Bus} from '../../../../core/models/bus';
interface SystemStatus {
  gps: boolean;
  network: boolean;
  print: boolean;
}

@Component({
  selector: 'app-pos-header',
  templateUrl: './pos-header.component.html',
  standalone: true,
  imports: [CommonModule]
})
export class PosHeaderComponent implements OnInit, OnDestroy {
  @Output() onToggleSidebar = new EventEmitter<void>();

  currentDriver: Driver | null = null;
  busConfig: Bus | null = null;

  constructor(private driverBusService: DriverBusService) {}

  currentDateTime: Date = new Date();
  systemStatus: SystemStatus = {
    gps: false,
    network: false,
    print: false
  };

  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.loadDriverAndBus();
    interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.currentDateTime = new Date();
      });

    interval(5000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.checkSystemStatus().then(r => console.log('System status checked'));
      });

    this.checkSystemStatus().then(r => console.log('System status checked'));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDriverAndBus() {
    this.currentDriver = this.driverBusService.getCurrentDriver();
    this.busConfig = this.driverBusService.getBusConfig();

    if (!this.currentDriver) {
      console.warn('No driver logged in');
    }
  }

  private async checkSystemStatus() {
    try {
      this.systemStatus.network = navigator.onLine;
      this.systemStatus.gps = await this.checkGPS();
      this.systemStatus.print = await this.checkPrinter();
    } catch (error) {
      console.error('Error checking system status:', error);
    }
  }

  private async checkGPS(): Promise<boolean> {
    return new Promise((resolve) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          () => resolve(true),
          () => resolve(false)
        );
      } else {
        resolve(false);
      }
    });
  }

  private async checkPrinter(): Promise<boolean> {
    return new Promise((resolve) => {
      resolve(Math.random() > 0.5);
    });
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }
}
