import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ProyectosService {
  private URL = 'http://localhost:3001/proyectos';
  constructor(private httt:HttpClient) { }

  getProyectos(){
    return this.httt.get(this.URL);
  }
  postProyecto(proyecto:any){
    return this.httt.post(this.URL, proyecto);
  }
  putProyecto(id:number, proyecto:any){
    return this.httt.put(`${this.URL}/${id}`, proyecto);
  }
  deleteProyecto(id:number){
    return this.httt.delete(`${this.URL}/${id}`);
  }

}
