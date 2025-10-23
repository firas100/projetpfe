import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListCandidatapresentretienComponent } from './list-candidatapresentretien.component';

describe('ListCandidatapresentretienComponent', () => {
  let component: ListCandidatapresentretienComponent;
  let fixture: ComponentFixture<ListCandidatapresentretienComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ListCandidatapresentretienComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListCandidatapresentretienComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
