import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CandidatpageComponent } from './candidatpage.component';

describe('CandidatpageComponent', () => {
  let component: CandidatpageComponent;
  let fixture: ComponentFixture<CandidatpageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CandidatpageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CandidatpageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
