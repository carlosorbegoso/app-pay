import {Component, EventEmitter, Input, Output} from '@angular/core';


@Component({
  selector: 'app-pos-header',
  imports: [],
  templateUrl: './pos-header.component.html',
  }

)
export class PosHeaderComponent {
  @Output() onToggleSidebar = new EventEmitter<void>();
}
