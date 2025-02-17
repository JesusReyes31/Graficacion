import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';
import { Router, RouterLink, RouterModule, RouterOutlet } from '@angular/router';

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

  seleccionarProyecto(proyecto: string) {
    this.proyectoSeleccionado = proyecto;
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
    const confirmar = confirm('¿Estás seguro de que quieres eliminar este proyecto?');
    if (confirmar) {
      this.proyectos.splice(index, 1);
    }
  }

  editarProyecto(index: number, event: Event) {
    event.stopPropagation();
    const nuevoNombre = prompt('Nuevo nombre del proyecto:', this.proyectos[index]);
    if (nuevoNombre !== null && nuevoNombre.trim()) {
      this.proyectos[index] = nuevoNombre.trim();
    }
  }
}
