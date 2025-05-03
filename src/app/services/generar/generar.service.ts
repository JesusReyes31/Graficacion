import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GenerarService {
  private URL = 'http://localhost:3001/generar';
  constructor(private http:HttpClient) { }
  generarCodigo(datosGeneracion:any){
    return this.http.post(`${this.URL}`, datosGeneracion, {responseType: 'json'});
  }
}
