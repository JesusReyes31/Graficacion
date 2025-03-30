import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';
import { Router, RouterLink, RouterModule, RouterOutlet, NavigationEnd } from '@angular/router';
import Swal from 'sweetalert2';
import { filter } from 'rxjs/operators';
import { ProyectosService } from './services/proyectos/proyectos.service';
import { ToastrService } from 'ngx-toastr';
import { VersionesService } from './services/versiones/versiones.service';
import { CompartidoService } from './services/compartido/compartido.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet,RouterLink,RouterModule], 
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'Graficacion';
  proyectos: { ID: number, Nombre: string }[] = [];
  proyectoSeleccionado: string | null = null;
  creandoProyecto: boolean = false;
  nuevoProyecto: string = '';
  isButtonDisabled = true;
  showComponent = false;
  public sidebarVisible: boolean = true;
  activeRoute: string = '';

  constructor(private router:Router,private proyectosService:ProyectosService,private toastr:ToastrService,private versionesService:VersionesService,private compartido:CompartidoService){}

  async ngOnInit(){
    await this.proyectosService.getProyectos().subscribe((data:any) => {
      this.proyectos = data
    });

    // Verifica si hay un proyecto seleccionado en sessionStorage
    if(sessionStorage.getItem('proyecto')){
      this.proyectoSeleccionado = sessionStorage.getItem('proyecto');
      this.isButtonDisabled = false; // Habilitar el botón si hay un proyecto seleccionado
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
  seleccionarProyecto(proyecto: string,id:number) {
    this.versionesService.getVersiones(id).subscribe((data:any) => {
      if(data.message){
        this.compartido.setProyectoSeleccionado('');
        return;
      }
      this.compartido.setProyectoSeleccionado(data);
    });
    this.proyectoSeleccionado = proyecto;
    this.isButtonDisabled = false;
    sessionStorage.setItem('ID_Proyecto',id.toString())
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
      this.proyectosService.postProyecto({ Nombre: this.nuevoProyecto.trim() }).subscribe((data:any) => {
        this.proyectos.push(data);
        this.nuevoProyecto = '';
        this.creandoProyecto = false;
      });
    }
  }

  cancelarNuevoProyecto() {
    this.creandoProyecto = false; // Ocultar el input si se hace clic en la X
    this.nuevoProyecto = ''; // Limpiar el campo de entrada
  }

  eliminarProyecto(ID: number, event: Event) {
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
        this.proyectosService.deleteProyecto(ID).subscribe(() => {
          this.router.navigate(['/']);
          this.proyectos = this.proyectos.filter(proyecto => proyecto.ID !== ID);
          this.toastr.success('El proyecto ha sido eliminado.', 'success');
          this.proyectoSeleccionado = null; // Limpiar la selección del proyecto
          sessionStorage.removeItem('proyecto'); // Limpiar el almacenamiento local
        });
      }
    });
  }
  
  
  editarProyecto(proyecto: any, event: Event) {
    event.stopPropagation();
  
    Swal.fire({
      title: 'Editar proyecto',
      input: 'text',
      inputLabel: 'Nuevo nombre del proyecto:',
      inputValue: proyecto.Nombre,
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
      if (this.proyectos.some(p => p.Nombre === result.value.trim())) {
        this.toastr.error('El nombre del proyecto ya existe', 'Error');
        return;
      }
  
      if (result.isConfirmed) {
        this.proyectosService.putProyecto(proyecto.ID, { Nombre: result.value.trim() }).subscribe(() => {
          if (this.proyectoSeleccionado === proyecto.Nombre) {
            this.proyectoSeleccionado = result.value.trim();
          }
          proyecto.Nombre = result.value.trim();
          this.proyectos = this.proyectos.map(p => {
            if (p.ID === proyecto.ID) {
              return { ...p, Nombre: result.value.trim() };
            }
            return p;
          });
          sessionStorage.setItem('proyecto', proyecto.Nombre);
          this.toastr.success('El nombre del proyecto ha sido actualizado.', 'Éxito');
          this.router.navigate(['/']);
        });
      }
    });
  }
  
}
