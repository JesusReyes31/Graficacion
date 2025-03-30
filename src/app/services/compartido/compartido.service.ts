import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CompartidoService {
  private proyectoSeleccionado = new BehaviorSubject<any | null>(null); // Variable compartida
  proyectoSeleccionado$ = this.proyectoSeleccionado.asObservable();
  constructor() { }
  setProyectoSeleccionado(respuesta: any) {
    this.proyectoSeleccionado.next(respuesta); // Actualiza el valor
  }

  getProyectoSeleccionado() {
    return this.proyectoSeleccionado; // Retorna el valor actual
  }
}
