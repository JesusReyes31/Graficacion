import { CommonModule } from '@angular/common';
import { Component, ElementRef, AfterViewInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as go from 'gojs';
import { ToastrService } from 'ngx-toastr';

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
  private myDiagram!: go.Diagram;
  private myPalette!: go.Palette;
  diagram!: go.Diagram;
  currentVersion = '1.0';
  versions: string[] = [];
  projectId = '';

  constructor(private toastr:ToastrService){
    this.projectId = sessionStorage.getItem('proyecto') || '';
    this.loadVersions();
  }

  ngAfterViewInit() {
    this.initDiagram();
    this.initPalette();
    this.loadDiagram();
  }

  initDiagram() {
    const $ = go.GraphObject.make;

    this.myDiagram = $(go.Diagram, this.diagramDiv.nativeElement, {
      allowCopy: false,
      "undoManager.isEnabled": true,
      "draggingTool.dragsLink": true,
      "linkingTool.isUnconnectedLinkValid": true,
      "linkingTool.portGravity": 20,
      "commandHandler.archetypeGroupData": { isGroup: true, text: "New Group" }
    });

    // Plantilla de los actores principales (grupos)
    this.myDiagram.groupTemplate = $(
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
    this.myDiagram.nodeTemplate = $(
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
    this.myDiagram.linkTemplate = $(
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
    this.myDiagram.addDiagramListener("LinkDrawn", function(e) {
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
    this.myDiagram.addDiagramListener("TextEdited", (e) => {
      const tb = e.subject as go.TextBlock;
      if (tb && tb.text.trim() === "") {
        this.myDiagram.model.setDataProperty(tb.part!.data, "text", "Escribe aquí...");
      }
    });

    this.myDiagram.model.addChangedListener(e => { 
      if (e.isTransactionFinished) this.saveDiagram(); 
    });

    this.loadModel();
  }

  initPalette() {
    const $ = go.GraphObject.make;

    this.myPalette = $(go.Palette, this.paletteDiv.nativeElement, {
      nodeTemplateMap: this.myDiagram.nodeTemplateMap,
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

    this.myDiagram.model = go.Model.fromJson(modelData);
  }
  
  loadDiagram() {
    const savedData = localStorage.getItem(`DiagramSecuencias_${this.projectId}_v${this.currentVersion}`);
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
        `DiagramSecuencias_${this.projectId}_v${this.currentVersion}`, 
        this.myDiagram.model.toJson()
      );
    }
  }

  // Gestión de versiones
  loadVersions() {
    const versionsKey = `DiagramSecuenciasVersions_${this.projectId}`;
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
    
    localStorage.setItem(`DiagramSecuenciasVersions_${this.projectId}`, JSON.stringify(this.versions));
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