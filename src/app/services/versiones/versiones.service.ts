import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class VersionesService {
  private URL = 'http://localhost:3001/versiones';
  constructor(private http:HttpClient) { }

  getVersiones(id:number){
    return this.http.get<any[]>(`${this.URL}/${id}`);
  }
  postVersion(version:any){
    return this.http.post(this.URL, version);
  }
  putVersion(id:number, version:any){
    return this.http.put(`${this.URL}/${id}`, version);
  }
  deleteVersion(id:number){
    return this.http.delete(`${this.URL}/${id}`);
  }
}
