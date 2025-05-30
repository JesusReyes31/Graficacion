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
import { CredencialesService, Credencial } from './services/credenciales/credenciales.service';
import { SpinnerComponent } from './components/spinner/spinner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet,RouterLink,RouterModule, SpinnerComponent], 
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
    dialecto: 'mysql2',
    puertoDB: 3306,
    puertoBackend: 3000
  };

  // Nuevas propiedades para credenciales
  credencialesDisponibles: Credencial[] = [];
  credencialSeleccionada: Credencial | null = null;
  mostrarFormCredenciales: boolean = false;

  constructor(
    private router: Router,
    private proyectosService: ProyectosService,
    private toastr: ToastrService,
    private versionesService: VersionesService,
    private compartido: CompartidoService,
    private generar: GenerarService,
    private credencialesService: CredencialesService
  ) {
    // Cargar la configuración guardada al iniciar
    this.cargarConfiguracionGuardada();
  }

  // Agregar estos nuevos métodos antes de ngOnInit
  private cargarConfiguracionGuardada() {
    const configGuardada = localStorage.getItem('ultimaConfigConexion');
    if (configGuardada) {
      this.configConexion = JSON.parse(configGuardada);
    }
  }

  private guardarConfiguracion() {
    localStorage.setItem('ultimaConfigConexion', JSON.stringify(this.configConexion));
  }

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
  seleccionarProyecto(proyecto: string, id: number) {
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
    this.showComponent = false;
    this.cargarCredenciales(id); // Cargar las credenciales del proyecto
    setTimeout(() => {
      this.showComponent = true;
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

  // Método específico para cerrar el modal desde el botón de cerrar
  cerrarModalDirecto() {
    this.mostrarModal = false;
    this.reiniciarEstadoModal();
  }

  cerrarModal(event: Event) {
    event.stopPropagation();
    
    // Obtener el elemento clickeado
    const target = event.target as HTMLElement;
    
    // Verificar si el clic fue en el backdrop, botón de cerrar o sus elementos hijos
    const shouldClose = 
      target.classList.contains('modal-backdrop') ||
      target.classList.contains('close-btn') ||
      target.classList.contains('cancel-btn') ||
      target.closest('.close-btn') ||
      target.closest('.cancel-btn');
    
    if (shouldClose) {
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
    if (!this.credencialSeleccionada) {
      this.toastr.error('Debes seleccionar una configuración de conexión', 'Error');
      return;
    }

    const idProyecto = Number(sessionStorage.getItem('ID_Proyecto'));
    
    const idv_cu = Number(this.diagramasSeleccionados['1']) || 0;
    const idv_sec = Number(this.diagramasSeleccionados['2']) || 0;
    const idv_paq = Number(this.diagramasSeleccionados['3']) || 0;
    const idv_comp = Number(this.diagramasSeleccionados['4']) || 0;
    const idv_class = Number(this.diagramasSeleccionados['5']) || 0;
    
    const datosGeneracion = {
      id: idProyecto,
      idv_cu,
      idv_sec,
      idv_paq,
      idv_comp,
      idv_class,
      conexion: this.configConexion
    };

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

  // Método para seleccionar una credencial existente
  seleccionarCredencial(credencial: Credencial) {
    this.credencialSeleccionada = credencial;
    this.configConexion = this.mapearCredencialAConfigConexion(credencial);
    this.mostrarFormCredenciales = false;
  }

  // Método para mostrar el formulario de nuevas credenciales
  mostrarNuevasCredenciales() {
    this.credencialSeleccionada = null;
    this.configConexion = {
      host: 'localhost',
      usuario: '',
      password: '',
      nombreDB: '',
      dialecto: '',
      puertoDB: 3306,
      puertoBackend: 3000
    };
    this.mostrarFormCredenciales = true;
  }

  // Método para cargar las credenciales del proyecto
  cargarCredenciales(idProyecto: number) {
    this.credencialesService.getCredencialesByProject(idProyecto).subscribe(
      (credenciales) => {
        this.credencialesDisponibles = credenciales;
        if (credenciales.length > 0) {
          this.credencialSeleccionada = credenciales[0];
          this.configConexion = this.mapearCredencialAConfigConexion(this.credencialSeleccionada);
        }
      },
      (error) => {
        this.toastr.error('Error al cargar las credenciales', 'Error');
      }
    );
  }

  // Método para mapear una credencial al formato de configConexion
  mapearCredencialAConfigConexion(credencial: Credencial) {
    return {
      host: credencial.Host,
      usuario: credencial.Usuario,
      password: credencial.Password,
      nombreDB: credencial.NombreDB,
      dialecto: credencial.Dialecto,
      puertoDB: parseInt(credencial.PuertoDB),
      puertoBackend: parseInt(credencial.PuertoBackend)
    };
  }

  // Método para mapear configConexion al formato de Credencial
  mapearConfigConexionACredencial(): Credencial {
    return {
      ID_Proyecto: Number(sessionStorage.getItem('ID_Proyecto')),
      Host: this.configConexion.host,
      Usuario: this.configConexion.usuario,
      Password: this.configConexion.password,
      NombreDB: this.configConexion.nombreDB,
      Dialecto: this.configConexion.dialecto,
      PuertoDB: this.configConexion.puertoDB.toString(),
      PuertoBackend: this.configConexion.puertoBackend.toString()
    };
  }

  // Método para guardar credenciales
  guardarCredenciales() {
    if (this.credencialSeleccionada?.ID) {
      // Actualizar credenciales existentes
      this.actualizarCredenciales();
    } else {
      // Guardar nuevas credenciales
      this.guardarNuevasCredenciales();
    }
  }

  // Método para editar una credencial existente
  editarCredencial(credencial: Credencial) {
    this.credencialSeleccionada = credencial;
    this.configConexion = this.mapearCredencialAConfigConexion(credencial);
    this.mostrarFormCredenciales = true;
  }

  // Método para cancelar la edición
  cancelarEdicion() {
    if (this.credencialSeleccionada?.ID) {
      // Si estábamos editando, restaurar los valores originales
      this.configConexion = this.mapearCredencialAConfigConexion(this.credencialSeleccionada);
    } else {
      // Si era una nueva credencial, limpiar el formulario
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
    this.mostrarFormCredenciales = false;
  }

  // Modificar el método guardarNuevasCredenciales
  private guardarNuevasCredenciales() {
    const nuevaCredencial = this.mapearConfigConexionACredencial();
    this.credencialesService.createCredencial(nuevaCredencial).subscribe(
      (credencial) => {
        this.credencialesDisponibles.push(credencial);
        this.credencialSeleccionada = credencial;
        this.toastr.success('Credenciales guardadas correctamente', 'Éxito');
        this.mostrarFormCredenciales = false;
      },
      (error) => {
        this.toastr.error('Error al guardar las credenciales', 'Error');
      }
    );
  }

  // Modificar el método actualizarCredenciales
  private actualizarCredenciales() {
    if (!this.credencialSeleccionada?.ID) return;
    
    const credencialActualizada = this.mapearConfigConexionACredencial();
    this.credencialesService.updateCredencial(this.credencialSeleccionada.ID, credencialActualizada).subscribe(
      () => {
        this.toastr.success('Credenciales actualizadas correctamente', 'Éxito');
        this.cargarCredenciales(credencialActualizada.ID_Proyecto);
        this.mostrarFormCredenciales = false;
      },
      (error) => {
        this.toastr.error('Error al actualizar las credenciales', 'Error');
      }
    );
  }

  // Método para eliminar credenciales
  eliminarCredenciales(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'No podrás revertir esta acción',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.credencialesService.deleteCredencial(id).subscribe(
          () => {
            this.credencialesDisponibles = this.credencialesDisponibles.filter(c => c.ID !== id);
            if (this.credencialSeleccionada?.ID === id) {
              this.credencialSeleccionada = this.credencialesDisponibles[0] || null;
              if (this.credencialSeleccionada) {
                this.configConexion = this.mapearCredencialAConfigConexion(this.credencialSeleccionada);
              }
            }
            this.toastr.success('Credenciales eliminadas correctamente', 'Éxito');
          },
          (error) => {
            this.toastr.error('Error al eliminar las credenciales', 'Error');
          }
        );
      }
    });
  }
}
