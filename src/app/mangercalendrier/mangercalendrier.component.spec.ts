import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MangercalendrierComponent } from './mangercalendrier.component';

describe('MangercalendrierComponent', () => {
  let component: MangercalendrierComponent;
  let fixture: ComponentFixture<MangercalendrierComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MangercalendrierComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MangercalendrierComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
