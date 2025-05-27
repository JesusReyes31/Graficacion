import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Credencial {
  ID?: number;
  ID_Proyecto: number;
  Host: string;
  Usuario: string;
  Password: string;
  NombreDB: string;
  Dialecto: string;
  PuertoDB: string;
  PuertoBackend: string;
}

@Injectable({
  providedIn: 'root'
})
export class CredencialesService {
  private apiUrl = 'http://localhost:3001/credenciales';

  constructor(private http: HttpClient) { }

  // Obtener todas las credenciales de un proyecto
  getCredencialesByProject(idProyecto: number): Observable<Credencial[]> {
    return this.http.get<Credencial[]>(`${this.apiUrl}/${idProyecto}`);
  }

  // Crear nuevas credenciales
  createCredencial(credencial: Credencial): Observable<Credencial> {
    return this.http.post<Credencial>(this.apiUrl, credencial);
  }

  // Actualizar credenciales existentes
  updateCredencial(id: number, credencial: Credencial): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, credencial);
  }

  // Eliminar credenciales
  deleteCredencial(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
