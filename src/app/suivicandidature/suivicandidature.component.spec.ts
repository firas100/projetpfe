import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuivicandidatureComponent } from './suivicandidature.component';

describe('SuivicandidatureComponent', () => {
  let component: SuivicandidatureComponent;
  let fixture: ComponentFixture<SuivicandidatureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SuivicandidatureComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuivicandidatureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
