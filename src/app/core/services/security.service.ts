import {Injectable} from '@angular/core';
import {Router} from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class SecurityService {
  private readonly LOCK_KEY = 'APP_LOCK_STATE';
  private isAdmin = true; // Esto debería venir de tu servicio de autenticación

  constructor(private router: Router) {
    this.initializeSecurityMeasures();
  }

  private initializeSecurityMeasures(): void {
    // Detectar si la app está en modo standalone/PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.lockApp();
    }

    // Monitorear cambios en la visibilidad
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.checkLockState();
      }
    });

    // Mantener la aplicación viva
    this.keepAlive();

    // Prevenir modo desarrollador
    this.preventDevTools();
  }

  private lockApp(): void {
    localStorage.setItem(this.LOCK_KEY, 'locked');

    // Mantener la pantalla encendida
    if (navigator.wakeLock) {
      navigator.wakeLock.request('screen')
        .catch(err => console.error('Wake Lock error:', err));
    }
  }

  private checkLockState(): void {
    const lockState = localStorage.getItem(this.LOCK_KEY);
    if (lockState !== 'locked' && !this.isAdmin) {
      this.router.navigate(['/locked']);
    }
  }

  private keepAlive(): void {
    setInterval(() => {
      // Ping al servidor cada 30 segundos
      fetch('/api/keepalive')
        .catch(() => console.log('Keeping app alive...'));
    }, 30000);
  }

  private preventDevTools(): void {
    // Deshabilitar teclas comunes de dev tools
    window.addEventListener('keydown', (e) => {
      if (
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.key === 'F12')
      ) {
        e.preventDefault();
      }
    });

    // Detectar apertura de DevTools por cambio de dimensiones
    let devtools = { isOpen: false };
    const threshold = 160;

    Object.defineProperty(devtools, 'isOpen', {
      get: function() {
        return false;
      }
    });

    setInterval(() => {
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      if (widthThreshold || heightThreshold) {
        this.handleDevToolsOpen();
      }
    }, 1000);
  }

  private handleDevToolsOpen(): void {
    if (!this.isAdmin) {
      // Aquí puedes implementar medidas adicionales
      console.clear();
      this.router.navigate(['/locked']);
    }
  }

  attemptClose(): boolean {
    if (this.isAdmin) {
      return true;
    }
    return false;
  }
}
