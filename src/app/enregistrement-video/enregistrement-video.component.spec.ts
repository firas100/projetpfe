import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnregistrementVideoComponent } from './enregistrement-video.component';

describe('EnregistrementVideoComponent', () => {
  let component: EnregistrementVideoComponent;
  let fixture: ComponentFixture<EnregistrementVideoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EnregistrementVideoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnregistrementVideoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
