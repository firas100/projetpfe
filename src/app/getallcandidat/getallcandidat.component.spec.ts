import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GetallcandidatComponent } from './getallcandidat.component';

describe('GetallcandidatComponent', () => {
  let component: GetallcandidatComponent;
  let fixture: ComponentFixture<GetallcandidatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GetallcandidatComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GetallcandidatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
