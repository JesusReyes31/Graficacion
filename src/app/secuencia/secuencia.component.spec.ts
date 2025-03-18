import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UmlSecuenciasComponent } from './secuencia.component';

describe('UmlSecuenciasComponent', () => {
  let component: UmlSecuenciasComponent;
  let fixture: ComponentFixture<UmlSecuenciasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UmlSecuenciasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UmlSecuenciasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

