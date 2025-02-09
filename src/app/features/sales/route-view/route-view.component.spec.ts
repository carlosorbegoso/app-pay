import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RouteViewComponent } from './route-view.component';

describe('RouteViewComponent', () => {
  let component: RouteViewComponent;
  let fixture: ComponentFixture<RouteViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouteViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RouteViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
