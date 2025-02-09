import {Component, HostListener, OnInit} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {SecurityService} from './core/services/security.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  constructor(private securityService: SecurityService) {}

  @HostListener('window:beforeunload', ['$event'])
  beforeUnloadHandler(event: BeforeUnloadEvent) {
    if (!this.securityService.attemptClose()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  ngOnInit() {
    // Prevenir la selección de texto
    document.body.style.userSelect = 'none';

    // Prevenir el zoom en dispositivos móviles
    document.body.style.touchAction = 'manipulation';
  }
}
