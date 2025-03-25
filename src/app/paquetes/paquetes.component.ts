import { CommonModule } from '@angular/common';
import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as go from 'gojs';
import { ToastrService } from 'ngx-toastr';

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
  currentVersion = '1.0';
  versions: string[] = [];
  projectId = ''

  constructor(private toastr:ToastrService) {
    this.projectId = sessionStorage.getItem('proyecto') || '';
    this.loadVersions();
  }

  ngOnInit(): void { }

  ngAfterViewInit(): void {
    this.initializeDiagram();
    this.initializePalette();
    this.loadDiagram();
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

  loadDiagram() {
    const savedData = localStorage.getItem(`DiagramPaquetes_${this.projectId}_v${this.currentVersion}`);
    if (savedData) {
      const model = go.Model.fromJson(savedData) as go.GraphLinksModel;
      model.linkKeyProperty = "key";
      this.myDiagram.model = model;
      this.myDiagram.model.addChangedListener(e => { if (e.isTransactionFinished) this.saveDiagram(); });
    }
  }

  saveDiagram() {
    if (this.myDiagram) {
      localStorage.setItem(
        `DiagramPaquetes_${this.projectId}_v${this.currentVersion}`, 
        this.myDiagram.model.toJson()
      );
    }
  }

  // Gestión de versiones
  loadVersions() {
    const versionsKey = `DiagramPaquetesVersions_${this.projectId}`;
    const savedVersions = localStorage.getItem(versionsKey);
      
    if (savedVersions) {
      this.versions = JSON.parse(savedVersions);
      if (this.versions.length > 0) {
        this.currentVersion = this.versions[this.versions.length - 1];
      }
    } else {
      this.versions = ['1'];
      this.currentVersion = '1';
      localStorage.setItem(versionsKey, JSON.stringify(this.versions));
    }
  }

  createNewVersion() {
    const lastVersion = parseInt(this.versions[this.versions.length - 1]);
    const newVersion = (lastVersion + 1).toString();
    this.currentVersion = newVersion;
    this.versions.push(newVersion);
    
    localStorage.setItem(`DiagramPaquetesVersions_${this.projectId}`, JSON.stringify(this.versions));
    this.myDiagram.model = new go.GraphLinksModel({ linkKeyProperty: "key" });
    this.saveDiagram();
    this.toastr.success(`Nueva versión ${this.currentVersion} creada`);
  }

  changeVersion(version: string) {
    this.currentVersion = version;
    this.loadDiagram();
    this.toastr.info(`Versión ${version} cargada`);
  }
}
  