import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeOffreComponent } from './home-offre.component';

describe('HomeOffreComponent', () => {
  let component: HomeOffreComponent;
  let fixture: ComponentFixture<HomeOffreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HomeOffreComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeOffreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
