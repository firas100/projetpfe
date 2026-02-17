import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoriqueManagerComponent } from './historique-manager.component';

describe('HistoriqueManagerComponent', () => {
  let component: HistoriqueManagerComponent;
  let fixture: ComponentFixture<HistoriqueManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HistoriqueManagerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoriqueManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
