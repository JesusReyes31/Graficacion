import { CommonModule } from '@angular/common';
import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as go from 'gojs';
import { ToastrService } from 'ngx-toastr';
import { VersionesService } from '../services/versiones/versiones.service';

@Component({
  selector: 'app-paquetes',
  templateUrl: './paquetes.component.html',
  imports:[FormsModule,CommonModule],
  styleUrls: ['./paquetes.component.css']
})
export class PaquetesComponent implements OnInit, AfterViewInit {
  public myDiagram!: go.Diagram;
  public myPalette!: go.Palette;
  public relationshipMode: boolean = false;
  private storageKey = 'myDiagramModelpa'; 
  currentVersionId!: number;
  versions: any[] = []; // Solo se guardarán versiones con ID_Tipo === 3
  ID_Proyecto = 0;
  projectId = '';
  versionData = {
    ID_V: 0,
    ID_Proyecto: 0,
    ID_Tipo: 3,
    json: ''
  };

  constructor(private toastr:ToastrService, private versionesService: VersionesService) {
    this.projectId = sessionStorage.getItem('proyecto') || '';
    this.ID_Proyecto = parseInt(sessionStorage.getItem('ID_Proyecto') || '0');
    this.versionData.ID_Proyecto = this.ID_Proyecto;
  }

  ngOnInit(): void { 
    this.loadVersions();
  }

  ngAfterViewInit(): void {
    this.initializeDiagram();
    this.initializePalette();
    this.setupAutoSave();
  }

  initializeDiagram(): void {
    const $ = go.GraphObject.make;

    // Creamos el diagrama principal
    this.myDiagram = $(go.Diagram, 'myDiagramDiv', {
      allowDrop: true,
      'undoManager.isEnabled': true
    });

    this.myDiagram.mouseDrop = (e) => {
      this.myDiagram.commandHandler.addTopLevelParts(this.myDiagram.selection, true);
    }; 

    // Por defecto, la herramienta de enlace está deshabilitada
    this.myDiagram.toolManager.linkingTool.isEnabled = false;

    // Plantilla para nodos (paquetes)
    this.myDiagram.nodeTemplate =
      $(go.Node, 'Auto',
        {
          movable: true,
          deletable: true,
          selectionAdorned: true,
          // resizable: true,
          portId: '',
          fromLinkable: true,
          toLinkable: true
        },
        $(go.Shape, 'RoundedRectangle', { fill: 'lightyellow', stroke: 'gray', strokeWidth: 2 }),
        $(go.TextBlock, { margin: 8, font: 'bold 12px sans-serif', editable: true },
          new go.Binding('text', 'text').makeTwoWay()
        )
      );

    // Plantilla para grupos (paquetes agrupados)
    this.myDiagram.groupTemplate =
      $(go.Group, 'Auto',
        {
          layout: $(go.GridLayout, { wrappingColumn: 2}),//, alignment: go.GridLayout.Position }),
          movable: true,
          deletable: true,
          computesBoundsAfterDrag: true,
          // resizable: true,
          portId: '',
          fromLinkable: true,
          toLinkable: true,
          mouseDragEnter: (e: any, grp: any, prev: any) => { grp.isHighlighted = true; },
          mouseDragLeave: (e: any, grp: any, next: any) => { grp.isHighlighted = false; },
          // mouseDrop: (e: any, grp: any) => {
          //   const node = grp.diagram.selection.first();
          //   if (node instanceof go.Node) {
          //     grp.addMembers(grp.diagram.selection, true);
          //   }
          // }
          mouseDrop: (e: any, grp: any) => {
            const diagram = grp.diagram;
            if (diagram.selection.count > 0) {
              const nodes = diagram.selection.toArray();
              grp.addMembers(nodes, true);
            }
          }          
        },
        $(go.Shape, 'RoundedRectangle',
          { fill: 'whitesmoke', stroke: 'lightgray', strokeWidth: 2 },
          new go.Binding('stroke', 'isHighlighted', (h: boolean) => h ? 'dodgerblue' : 'lightgray').ofObject()
        ),
        $(go.Panel, 'Vertical',
          $(go.Panel, 'Horizontal',
            {
              stretch: go.GraphObject.Horizontal,
              background: '#DCE8E8',
              padding: 5
            },
            $('SubGraphExpanderButton', { margin: 5 }),
            $(go.TextBlock,
              { alignment: go.Spot.Left, font: 'Bold 12pt sans-serif', margin: 5, editable: true },
              new go.Binding('text', 'text').makeTwoWay()
            )
          ),
          $(go.Placeholder, { padding: 10 })
        )
      );

    // Plantilla para enlaces (relaciones)
    this.myDiagram.linkTemplate =
      $(go.Link,
        {
          routing: go.Link.AvoidsNodes,
          curve: go.Link.JumpOver,
          corner: 5,
          relinkableFrom: true,
          relinkableTo: true,
          selectable: true
        },
        $(go.Shape, { stroke: 'gray', strokeWidth: 2, strokeDashArray: [4, 2] }),
        $(go.Shape, { toArrow: 'OpenTriangle', stroke: 'gray', fill: 'white' })
      );

    // Desactivar el modo de relación una vez se dibuja un enlace
    this.myDiagram.addDiagramListener('LinkDrawn', (e) => {
      this.relationshipMode = false;
      this.myDiagram.toolManager.linkingTool.isEnabled = false;
    });

    // Modelo inicial vacío; se cargará desde localStorage si existe
    this.myDiagram.model = new go.GraphLinksModel([], []);
    this.myDiagram.model.addChangedListener(e => { 
      if (e.isTransactionFinished) this.saveDiagram(); 
    });
  }

  // Configura la paleta con alineación centrada
  initializePalette(): void {
    const $ = go.GraphObject.make;

    this.myPalette = $(go.Palette, 'myPaletteDiv', {
      nodeTemplateMap: this.myDiagram.nodeTemplateMap,
      groupTemplateMap: this.myDiagram.groupTemplateMap,
      initialContentAlignment: go.Spot.Center,
      contentAlignment: go.Spot.Center
    });

    // Modelo de la paleta con claves únicas
    this.myPalette.model = new go.GraphLinksModel([
      { key: 'PaletteNode1', text: 'Nodo', isGroup: false },
      { key: 'PaletteGroup1', text: 'Paquete', isGroup: true }
    ]);
  }

  // Alterna el modo de creación de relaciones
  toggleRelationshipMode(): void {
    this.relationshipMode = !this.relationshipMode;
    this.myDiagram.toolManager.linkingTool.isEnabled = this.relationshipMode;
  }

  // Configura el guardado automático del diagrama en localStorage
  setupAutoSave(): void {
    this.myDiagram.addModelChangedListener((e) => {
      // Se guarda automáticamente al finalizar una transacción
      if (e.isTransactionFinished) {
        const modelJson = this.myDiagram.model.toJson();
        localStorage.setItem(this.storageKey, modelJson);
      }
    });
  }

  loadVersions() {
      this.versionesService.getVersiones(this.ID_Proyecto).subscribe(
        (data: any) => {
          // Si la respuesta tiene "message" o viene vacía, asumimos que no hay versiones.
          if (data.message || !data || data.length === 0) {
            this.versions = [];
          } else {
            // Filtrar solo las versiones de tipo 3
            this.versions = data.filter((v: any) => v.ID_Tipo === 3);
          }
          if (this.versions.length === 0) {
            // No hay versiones: se crea la versión 1 automáticamente desde el frontend
            this.versionData.json = "{}";
            this.versionesService.postVersion(this.versionData).subscribe(
              (nuevaVersion: any) => {
                this.versions.push(nuevaVersion);
                this.currentVersionId = nuevaVersion.ID_V;
                this.loadDiagram(this.currentVersionId);
                this.versionData.ID_V = nuevaVersion.ID_V;
                this.versionData.ID_Tipo = 3;
                this.versionData.ID_Proyecto = this.ID_Proyecto;
                this.versionData.json = nuevaVersion.json;
                this.toastr.info("Se creó automáticamente la versión 1 del diagrama");
              },
              (error) => {
                console.error('Error al crear la versión inicial:', error);
                this.toastr.error('Error al crear la versión inicial');
              }
            );
          } else {
            // Se selecciona la última versión (la más reciente) para cargarla
            this.currentVersionId = this.versions[0].ID_V;
            this.versionData.ID_V = this.currentVersionId;
            this.loadDiagram(this.currentVersionId);
          }
        },
        (error) => {
          console.error('Error al cargar versiones:', error);
          this.toastr.error('Error al cargar versiones');
        }
      );
    }
  
    createNewVersion() {
      this.versionData.json = "{}";
      this.versionData.ID_Proyecto = this.ID_Proyecto;
      // Al crear nueva versión, siempre se crea del tipo 3
      this.versionData.ID_Tipo = 3;
      this.versionesService.postVersion(this.versionData).subscribe(
        (data: any) => {
          this.versions.push(data);
          this.currentVersionId = data.ID_V;
          // Reinicia el diagrama para la nueva versión
          this.myDiagram.model = new go.GraphLinksModel({ linkKeyProperty: "key" });
          this.toastr.success(`Nueva versión ${this.versions.length} creada`);
          this.saveDiagram();
          this.versionData.ID_V = data.ID_V;
        },
        (error) => {
          console.error('Error al crear la versión:', error);
          this.toastr.error('Error al crear la versión');
        }
      );
    }
  
    guardarVersion() {
      this.versionData.json = this.myDiagram.model.toJson();
      this.versionesService.putVersion(this.versionData.ID_V, {
        ID_Proyecto: this.versionData.ID_Proyecto,
        ID_Tipo: this.versionData.ID_Tipo,
        json: this.versionData.json
      }).subscribe(
        (data: any) => {
          this.toastr.success('Versión guardada en la base de datos');
          // Actualiza el objeto en el arreglo de versiones
          const index = this.versions.findIndex(v => v.ID_V == this.versionData.ID_V);
          if (index !== -1) {
            this.versions[index] = data;
          }
        },
        (error) => {
          console.error('Error al guardar la versión:', error);
          this.toastr.error('Error al guardar la versión');
        }
      );
    }
  
    changeVersion(versionId: number) {
      this.currentVersionId = versionId;
      this.versionData.ID_V = versionId;
      console.log(this.versionData.ID_V)
      this.loadDiagram(versionId);
      this.toastr.info(`Versión ${this.getVersionOrder(versionId)} cargada`);
    }
  
    saveDiagram() {
      if (this.myDiagram && this.versionData.ID_V) {
        const json = this.myDiagram.model.toJson();
        this.versionData.json = json;
        this.versionesService.putVersion(this.versionData.ID_V, {
          ID_Proyecto: this.ID_Proyecto,
          ID_Tipo: this.versionData.ID_Tipo,
          json: json
        }).subscribe(
          () => {},
          (error) => {
            console.error('Error actualizando el diagrama', error);
          }
        );
      }
    }
  loadDiagram(versionId: number) {
      console.log(this.versions)
      const selectedVersion = this.versions.find(v => v.ID_V == versionId);
      console.log(selectedVersion.json)
      if (selectedVersion && selectedVersion.json) {
        const model = go.Model.fromJson(selectedVersion.json) as go.GraphLinksModel;
        model.linkKeyProperty = "key";
        this.myDiagram.model = model;
        this.myDiagram.model.addChangedListener(e => { if (e.isTransactionFinished) this.saveDiagram(); });
      } else {
        this.toastr.error('No se encontró la versión o no contiene datos');
      }
    }
  
    getVersionOrder(versionId: number): number {
      const index = this.versions.findIndex(v => v.ID_V == versionId);
      return index !== -1 ? index + 1 : 0;
    }
  
    eliminarVersion(){
      this.versionesService.deleteVersion(this.versionData.ID_V).subscribe(
        (data:any) => {
          this.versions = this.versions.filter(v => v.ID_V !== this.currentVersionId);
          this.toastr.success('Versión eliminada');
          if(this.versions.length > 0) {
            this.loadDiagram(this.versions[0].ID_V);
          }
          this.loadVersions();
        }
      );
    }
}
  