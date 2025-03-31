import { CommonModule } from '@angular/common';
import { Component, ElementRef, AfterViewInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as go from 'gojs';
import { ToastrService } from 'ngx-toastr';
import { VersionesService } from '../services/versiones/versiones.service';

@Component({
  selector: 'app-uml-secuencias',
  standalone: true,
  templateUrl: './secuencia.component.html',
  imports:[FormsModule,CommonModule], 
  styleUrls: ['./secuencia.component.css']
})
export class SecuenciaComponent implements AfterViewInit {
  @ViewChild('diagramDiv') diagramDiv!: ElementRef;
  @ViewChild('paletteDiv') paletteDiv!: ElementRef;
  private myPalette!: go.Palette;
  diagram!: go.Diagram;
  currentVersionId!: number;
  versions: any[] = []; // Solo se guardarán versiones con ID_Tipo === 2
  ID_Proyecto = 0;
  projectId = '';
  versionData = {
    ID_V: 0,
    ID_Proyecto: 0,
    ID_Tipo: 2,
    json: ''
  };

  constructor(private toastr:ToastrService, private versionesService: VersionesService) {
    this.projectId = sessionStorage.getItem('proyecto') || '';
    this.ID_Proyecto = parseInt(sessionStorage.getItem('ID_Proyecto') || '0');
    this.versionData.ID_Proyecto = this.ID_Proyecto;
  }
  
  ngOnInit() {
    this.loadVersions();
  }

  ngAfterViewInit() {
    this.initDiagram();
    this.initPalette();
  }

  initDiagram() {
    const $ = go.GraphObject.make;

    this.diagram = $(go.Diagram, this.diagramDiv.nativeElement, {
      allowCopy: false,
      "undoManager.isEnabled": true,
      "draggingTool.dragsLink": true,
      "linkingTool.isUnconnectedLinkValid": true,
      "linkingTool.portGravity": 20,
      "commandHandler.archetypeGroupData": { isGroup: true, text: "New Group" }
    });

    // Plantilla de los actores principales (grupos)
    this.diagram.groupTemplate = $(
      go.Group, "Vertical",
      {
        locationSpot: go.Spot.Top,
        selectionObjectName: "HEADER",
        computesBoundsAfterDrag: true,
        handlesDragDropForMembers: true,
        groupable: true,
        mouseDrop: function (e, grp) {
          const ok = grp instanceof go.Group && grp.diagram && grp.canAddMembers(grp.diagram.selection);
          if (!ok) return;
          e.diagram.selection.each(part => {
            if (part instanceof go.Node) part.containingGroup = grp;
          });
        },
        fromLinkable: false,
        toLinkable: false
      },
      new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
      $(
        go.Panel, "Auto", { name: "HEADER" },
        $(go.Shape, "Rectangle", { fill: "#bbdefb", stroke: null }),
        $(go.TextBlock, { editable:true, margin: 5, font: "10pt sans-serif" }, new go.Binding("text"))
      ),
      $(
        go.Shape,
        { figure: "LineV", stroke: "gray", strokeDashArray: [3, 3], width: 1 },
        new go.Binding("height", "duration")
      )
    );

    // Plantilla para los nodos de acción
    this.diagram.nodeTemplate = $(
      go.Node, "Auto",
      {
        locationSpot: go.Spot.Top,
        movable: true,
        groupable: true,
        dragComputation: (node: go.Part, pt: go.Point) => {
          return node.containingGroup ? new go.Point(node.containingGroup.location.x, pt.y) : pt;
        }
      },
      new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
      new go.Binding("group", "group"),
      $(
        go.Panel, "Vertical",
        // Punto superior para mensajes normales
        $(go.Shape, "Circle",
          {
            width: 6, height: 6, fill: "blue", strokeWidth: 0, cursor: "pointer",
            portId: "top",
            fromLinkable: true, toLinkable: true,
            fromSpot: go.Spot.Right, toSpot: go.Spot.Left,
            alignment: go.Spot.Right
          }
        ),
        $(go.Shape, "Rectangle", { fill: "transparent", stroke: "transparent", width: 12, height: 0 }), // Sin espacio
        // Rectángulo de activación
        $(go.Shape, "Rectangle", { fill: "white", stroke: "black", width: 12, height: 30 }),
        $(go.Shape, "Rectangle", { fill: "black", width: 12, height: 3 }),
        $(go.Shape, "Rectangle", { fill: "transparent", stroke: "transparent", width: 12, height: 0 }), // Sin espacio
        // Punto inferior para mensajes de respuesta
        $(go.Shape, "Circle",
          {
            width: 6, height: 6, fill: "red", strokeWidth: 0, cursor: "pointer",
            portId: "bottom",
            fromLinkable: true, toLinkable: true,
            fromSpot: go.Spot.Right, toSpot: go.Spot.Left,
            alignment: go.Spot.Right
          }
        )
      )
    );

    // Plantilla para las conexiones (flechas)
    this.diagram.linkTemplate = $(
      go.Link,
      { 
        curve: go.Link.None, 
        toShortLength: 0,
        fromShortLength: 0,
        relinkableFrom: true, 
        relinkableTo: true,
        routing: go.Link.Normal,
        adjusting: go.Link.None,
        corner: 0
      },
      new go.Binding("routing", "isReturn", function(v) {
        return v ? go.Link.Normal : go.Link.Normal;
      }),
      new go.Binding("fromSpot", "isReturn", function(v) {
        return v ? go.Spot.Left : go.Spot.Right;
      }),
      new go.Binding("toSpot", "isReturn", function(v) {
        return v ? go.Spot.Right : go.Spot.Left;
      }),
      // Binding para determinar los puertos de origen y destino basado en si es un mensaje de respuesta
      new go.Binding("fromPortId", "isReturn", function(v) {
        return v ? "bottom" : "top";
      }),
      new go.Binding("toPortId", "isReturn", function(v) {
        return v ? "bottom" : "top";
      }),
      $(go.Shape, { 
        stroke: "black",
        strokeWidth: 1.5
      },
      new go.Binding("strokeDashArray", "isReturn", function(v) {
        return v ? [3, 3] : null;
      })),
      $(go.Shape, { toArrow: "OpenTriangle", stroke: "black", scale: 1 }),
      $(go.TextBlock, 'escribe aqui...',
        {
          font: "9pt sans-serif",
          segmentOffset: new go.Point(0, -10),
          segmentOrientation: go.Link.OrientUpright,
          background: "transparent",
          margin: 5,
          editable: true
        },
        new go.Binding("text", "text").makeTwoWay()
      )
    );

    // Evento para detectar cuando se crea un nuevo enlace y determinar si es de respuesta
    this.diagram.addDiagramListener("LinkDrawn", function(e) {
      const link = e.subject;
      if (link instanceof go.Link) {
        const fromNode = link.fromNode;
        const toNode = link.toNode;
        if (fromNode && toNode) {
          // Si el nodo de origen está a la derecha del nodo de destino, es un mensaje de respuesta
          const isReturn = fromNode.location.x > toNode.location.x;
          e.diagram.model.setDataProperty(link.data, "isReturn", isReturn);
        }
      }
    });

    // Evento para evitar que los enlaces queden vacíos después de editarse
    this.diagram.addDiagramListener("TextEdited", (e) => {
      const tb = e.subject as go.TextBlock;
      if (tb && tb.text.trim() === "") {
        this.diagram.model.setDataProperty(tb.part!.data, "text", "Escribe aquí...");
      }
    });

    this.diagram.model.addChangedListener(e => { 
      if (e.isTransactionFinished) this.saveDiagram(); 
    });

    this.loadModel();
  }

  initPalette() {
    const $ = go.GraphObject.make;

    this.myPalette = $(go.Palette, this.paletteDiv.nativeElement, {
      nodeTemplateMap: this.diagram.nodeTemplateMap,
      model: new go.GraphLinksModel([
        { key: "Lifeline", text: "Lifeline", isGroup: true, duration: 300 },
        { key: "Action", text: "Action", isGroup: false, groupable: true }
      ])
    });
  }

  loadModel() {
    const modelData = {
      class: "go.GraphLinksModel",
      nodeDataArray: [
        { key: "grupo1", text: "Objeto 1", isGroup: true, duration: 300, loc: "0 0" },
        { key: "grupo2", text: "Objeto 2", isGroup: true, duration: 300, loc: "200 0" },
        { key: "act1", group: "grupo1", loc: "0 50" },
        { key: "act2", group: "grupo2", loc: "200 50" }
      ],
      linkDataArray: [
        { 
          from: "act1", to: "act2", 
          text: "1: Mensaje()", 
          isReturn: false 
        },
        { 
          from: "act2", to: "act1", 
          text: "2: Respuesta", 
          isReturn: true 
        }
      ]
    };

    this.diagram.model = go.Model.fromJson(modelData);
  }
  
  loadVersions() {
      this.versionesService.getVersiones(this.ID_Proyecto).subscribe(
        (data: any) => {
          // Si la respuesta tiene "message" o viene vacía, asumimos que no hay versiones.
          if (data.message || !data || data.length === 0) {
            this.versions = [];
          } else {
            // Filtrar solo las versiones de tipo 2
            this.versions = data.filter((v: any) => v.ID_Tipo === 2);
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
                this.versionData.ID_Tipo = 2;
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
      // Al crear nueva versión, siempre se crea del tipo 2
      this.versionData.ID_Tipo = 2;
      this.versionesService.postVersion(this.versionData).subscribe(
        (data: any) => {
          this.versions.push(data);
          this.currentVersionId = data.ID_V;
          // Reinicia el diagrama para la nueva versión
          this.diagram.model = new go.GraphLinksModel({ linkKeyProperty: "key" });
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
      this.versionData.json = this.diagram.model.toJson();
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
      if (this.diagram && this.versionData.ID_V) {
        const json = this.diagram.model.toJson();
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
          this.diagram.model = model;
          this.diagram.model.addChangedListener(e => { if (e.isTransactionFinished) this.saveDiagram(); });
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