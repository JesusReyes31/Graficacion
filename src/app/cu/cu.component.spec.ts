import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CUComponent } from './cu.component';

describe('CUComponent', () => {
  let component: CUComponent;
  let fixture: ComponentFixture<CUComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CUComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CUComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
