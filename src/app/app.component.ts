import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';
import { Router, RouterLink, RouterModule, RouterOutlet } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet,RouterLink,RouterModule], 
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'menu';
  proyectos: string[] = ['Proyecto 1', 'Proyecto 2', 'Proyecto 3', 'Proyecto 4', 'Proyecto 5'];
  proyectoSeleccionado: string | null = null;
  creandoProyecto: boolean = false;
  nuevoProyecto: string = '';
  isButtonDisabled = true;

  constructor(private router:Router){}

  ngOnInit(){
    if(localStorage.getItem('proyecto')){
      this.proyectoSeleccionado = localStorage.getItem('proyecto');
    }
    localStorage.clear();
  }
  
  // @HostListener('window:beforeunload')
  recarga(){
    if(this.proyectoSeleccionado){
      localStorage.setItem('proyecto',this.proyectoSeleccionado);
    }
  }

  seleccionarProyecto(proyecto: string) {
    this.proyectoSeleccionado = proyecto;
    localStorage.setItem('proyecto',proyecto)
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
        Swal.fire('Guardado', 'El nombre del proyecto ha sido actualizado.', 'success');
      }
    });
  }
}
