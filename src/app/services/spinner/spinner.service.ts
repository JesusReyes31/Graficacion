import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SpinnerService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private requestCount = 0;

  constructor() { }

  // Observable para que los componentes puedan suscribirse al estado de carga
  get isLoading$(): Observable<boolean> {
    return this.loadingSubject.asObservable();
  }

  // Mostrar el spinner
  show(): void {
    this.requestCount++;
    if (this.requestCount === 1) {
      this.loadingSubject.next(true);
    }
  }

  // Ocultar el spinner
  hide(): void {
    if (this.requestCount > 0) {
      this.requestCount--;
    }
    
    if (this.requestCount === 0) {
      this.loadingSubject.next(false);
    }
  }

  // Forzar ocultar el spinner (útil para casos de error)
  forceHide(): void {
    this.requestCount = 0;
    this.loadingSubject.next(false);
  }
}
