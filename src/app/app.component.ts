import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';
import { Router, RouterLink, RouterModule, RouterOutlet, NavigationEnd } from '@angular/router';
import Swal from 'sweetalert2';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet,RouterLink,RouterModule], 
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'Graficacion';
  proyectos: string[] = ['Proyecto 1', 'Proyecto 2', 'Proyecto 3', 'Proyecto 4', 'Proyecto 5'];
  proyectoSeleccionado: string | null = null;
  creandoProyecto: boolean = false;
  nuevoProyecto: string = '';
  isButtonDisabled = true;
  showComponent = false;
  public sidebarVisible: boolean = true;
  activeRoute: string = '';

  constructor(private router:Router){}

  ngOnInit(){
    if(sessionStorage.getItem('proyecto')){
      this.proyectoSeleccionado = sessionStorage.getItem('proyecto');
    }
    // sessionStorage.removeItem('proyecto');

    // Seguimiento de la ruta activa para resaltar el elemento de menú correspondiente
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.activeRoute = event.url;
      this.showComponent = true;
    });
  }
  
  @HostListener('window:beforeunload')
  recarga(): void {
    console.log(this.proyectoSeleccionado);
    if (this.proyectoSeleccionado) {
      sessionStorage.setItem('proyecto',this.proyectoSeleccionado)
    }
  }
  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
  }
  seleccionarProyecto(proyecto: string) {
    this.proyectoSeleccionado = proyecto;
    this.isButtonDisabled = false;
    sessionStorage.setItem('proyecto',proyecto)
    this.showComponent = false; // Elimina el componente
    setTimeout(() => {
      this.showComponent = true; // Lo vuelve a crear después de un breve retraso
    }, 100);
  }

  activarInput() {
    this.creandoProyecto = true;
  }

  agregarProyecto() {
    if (this.nuevoProyecto.trim()) {
      this.proyectos.push(this.nuevoProyecto.trim());
      this.nuevoProyecto = '';
      this.creandoProyecto = false;
    }
  }

  cancelarNuevoProyecto() {
    this.creandoProyecto = false; // Ocultar el input si se hace clic en la X
    this.nuevoProyecto = ''; // Limpiar el campo de entrada
  }

  eliminarProyecto(index: number, event: Event) {
    event.stopPropagation();
  
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'No podrás revertir esta acción',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        if (this.proyectoSeleccionado === this.proyectos[index]) {
          this.proyectoSeleccionado = null;
          this.isButtonDisabled = true;
          this.showComponent = false;
          this.router.navigate(['/']);
        }
        this.proyectos.splice(index, 1);
        Swal.fire('Eliminado', 'El proyecto ha sido eliminado.', 'success');
      }
    });
  }
  
  editarProyecto(index: number, event: Event) {
    event.stopPropagation();
  
    Swal.fire({
      title: 'Editar proyecto',
      input: 'text',
      inputLabel: 'Nuevo nombre del proyecto:',
      inputValue: this.proyectos[index],
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value.trim()) {
          return 'El nombre no puede estar vacío';
        }
        return;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.proyectos[index] = result.value.trim();
        if (this.proyectoSeleccionado === this.proyectos[index]) {
          this.proyectoSeleccionado = result.value.trim();
        }
        Swal.fire('Guardado', 'El nombre del proyecto ha sido actualizado.', 'success');
      }
    });
  }
}
