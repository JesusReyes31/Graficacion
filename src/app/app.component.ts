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
import { GenerarService } from './services/generar/generar.service';

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

  // Propiedades para el modal
  mostrarModal: boolean = false;
  etapaModal: number = 1; // 1 para selección de versiones, 2 para configuración de conexión
  tiposDiagrama = [
    { tipo: '1', nombre: 'Casos de Uso' },
    { tipo: '2', nombre: 'Diagrama de Secuencia' },
    { tipo: '3', nombre: 'Diagrama de Paquetes' },
    { tipo: '4', nombre: 'Diagrama de Componentes' },
    { tipo: '5', nombre: 'Diagrama de Clases' }
  ];
  diagramasSeleccionados: { [key: string]: number | null } = {
    '1': null,
    '2': null,
    '3': null,
    '4': null,
    '5': null
  };
  versionesDiagrama: any[] = []; // Aquí almacenaremos todas las versiones de diagramas disponibles

  // Configuración de conexión
  configConexion = {
    host: 'localhost',
    usuario: '',
    password: '',
    nombreDB: '',
    dialecto: '',
    puertoDB: 3306,
    puertoBackend: 3000
  };

  constructor(private router:Router,private proyectosService:ProyectosService,private toastr:ToastrService,private versionesService:VersionesService,private compartido:CompartidoService, private generar:GenerarService){}

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

  abrirModalGenerarCodigo() {
    // Obtener todas las versiones disponibles para el proyecto actual
    const idProyecto = Number(sessionStorage.getItem('ID_Proyecto'));
    if (idProyecto) {
      this.versionesService.getVersiones(idProyecto).subscribe((data: any) => {
        this.versionesDiagrama = data;
        this.mostrarModal = true;
        this.etapaModal = 1; // Iniciar en la primera etapa
      });
    } else {
      this.toastr.error('No se pudo obtener el ID del proyecto', 'Error');
    }
  }

  cerrarModal(event: Event) {
    event.stopPropagation();
    if (
      (event.target as HTMLElement).classList.contains('modal-backdrop') ||
      (event.target as HTMLElement).classList.contains('close-btn') ||
      (event.target as HTMLElement).classList.contains('cancel-btn')
    ) {
      this.mostrarModal = false;
      this.reiniciarEstadoModal();
    }
  }
  
  reiniciarEstadoModal() {
    // Reiniciar selecciones y etapa
    this.etapaModal = 1;
    this.tiposDiagrama.forEach(diagrama => {
      this.diagramasSeleccionados[diagrama.tipo] = null;
    });
    
    // Reiniciar configuración de conexión
    this.configConexion = {
      host: 'localhost',
      usuario: '',
      password: '',
      nombreDB: '',
      dialecto: '',
      puertoDB: 3306,
      puertoBackend: 3000
    };
  }

  siguienteEtapa() {
    if (this.etapaModal === 1 && this.puedeGenerarCodigo()) {
      this.etapaModal = 2;
    }
  }

  etapaAnterior() {
    if (this.etapaModal === 2) {
      this.etapaModal = 1;
    }
  }

  obtenerVersionesPorTipo(tipo: string): any[] {
    const versionesportipo =  this.versionesDiagrama.filter(version => Number(version.ID_Tipo) == Number(tipo));
    return versionesportipo;
  }

  tieneVersiones(tipo: string): boolean {
    return this.obtenerVersionesPorTipo(tipo).length > 0;
  }

  puedeGenerarCodigo(): boolean {
    // Verificar si al menos hay una versión seleccionada para cada tipo que tiene versiones
    let algunaSeleccionada = false;
    
    for (const tipo of this.tiposDiagrama.map(d => d.tipo)) {
      if (this.tieneVersiones(tipo)) {
        if (this.diagramasSeleccionados[tipo] === null) {
          return false; // Si tiene versiones pero no se seleccionó ninguna
        }
        algunaSeleccionada = true;
      }
    }
    
    return algunaSeleccionada; // Al menos una versión debe estar seleccionada
  }

  formularioConexionValido(): boolean {
    // Validación básica del formulario de configuración
    return !!(
      this.configConexion.host && 
      this.configConexion.usuario && 
      this.configConexion.nombreDB && 
      this.configConexion.dialecto && 
      this.configConexion.puertoDB && 
      this.configConexion.puertoBackend
    );
  }

  generarCodigo() {
    // Obtener el ID del proyecto actual
    const idProyecto = Number(sessionStorage.getItem('ID_Proyecto'));
    
    // Obtener los IDs de las versiones seleccionadas
    const idv_cu = Number(this.diagramasSeleccionados['1']) || 0;
    const idv_sec = Number(this.diagramasSeleccionados['2']) || 0;
    const idv_paq = Number(this.diagramasSeleccionados['3']) || 0;
    const idv_comp = Number(this.diagramasSeleccionados['4']) || 0;
    const idv_class = Number(this.diagramasSeleccionados['5']) || 0;
    
    // Datos completos para enviar
    const datosGeneracion = {
      id: idProyecto,
      idv_cu,
      idv_sec,
      idv_paq,
      idv_comp,
      idv_class,
      conexion: this.configConexion
    };

    // Llamar al servicio con los parámetros adecuados
    this.generar.generarCodigo(datosGeneracion).subscribe(
      (response: any) => {
        this.toastr.success(response.message, 'Éxito');
        this.mostrarModal = false;
        this.reiniciarEstadoModal();
      },
      (error) => {
        this.toastr.error('Error al generar el código', 'Error');
        console.error('Error al generar código:', error);
      }
    );
  }
}
