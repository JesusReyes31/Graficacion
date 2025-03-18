import { Component, ElementRef, AfterViewInit, ViewChild } from '@angular/core';
import * as go from 'gojs';

@Component({
  selector: 'app-uml-secuencias',
  standalone: true,
  templateUrl: './secuencia.component.html',
  styleUrls: ['./secuencia.component.css']
})
export class SecuenciaComponent implements AfterViewInit {
  @ViewChild('diagramDiv') diagramDiv!: ElementRef;
  @ViewChild('paletteDiv') paletteDiv!: ElementRef;
  private myDiagram!: go.Diagram;
  private myPalette!: go.Palette;
  diagram!: go.Diagram;

  ngAfterViewInit() {
    this.initDiagram();
    this.initPalette();
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
            fromSpot: go.Spot.Top, toSpot: go.Spot.Top
          }
        ),
        // Rectángulo de activación
        $(go.Shape, "Rectangle", { fill: "white", stroke: "black", width: 12, height: 30 }),
        $(go.Shape, "Rectangle", { fill: "black", width: 12, height: 3 }),
        // Punto inferior para mensajes de respuesta
        $(go.Shape, "Circle",
          {
            width: 6, height: 6, fill: "red", strokeWidth: 0, cursor: "pointer",
            portId: "bottom",
            fromLinkable: true, toLinkable: true,
            fromSpot: go.Spot.Bottom, toSpot: go.Spot.Bottom
          }
        )
      )
    );

    // Plantilla para las conexiones (flechas) con texto editable y placeholder
    this.myDiagram.linkTemplate = $(
      go.Link,
      { 
        curve: go.Link.JumpOver, 
        toShortLength: 2, 
        relinkableFrom: true, 
        relinkableTo: true,
        routing: go.Link.Orthogonal
      },
      new go.Binding("routing", "isReturn", function(v) {
        return v ? go.Link.Orthogonal : go.Link.Normal;
      }),
      // Binding para determinar los puertos de origen y destino basado en si es un mensaje de respuesta
      new go.Binding("fromPortId", "isReturn", function(v) {
        return v ? "bottom" : "top";
      }),
      new go.Binding("toPortId", "isReturn", function(v) {
        return v ? "bottom" : "top";
      }),
      $(go.Shape, { 
        stroke: "black"
      },
      new go.Binding("strokeDashArray", "isReturn", function(v) {
        return v ? [3, 3] : null;
      })),
      $(go.Shape, { toArrow: "OpenTriangle", stroke: "black" }),
      $(go.Panel, "Auto",
        $(go.Shape, "Rectangle", { fill: "white", stroke: "black" }),
        $(go.TextBlock, 'escribe aqui...',
          {
            font: "9pt sans-serif",
            margin: 2,
            editable: true,
            segmentIndex: 0,
            segmentOffset: new go.Point(0, -20)
          },
          new go.Binding("text", "text").makeTwoWay()
        )
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
      nodeDataArray: [],
      linkDataArray: []
    };

    this.myDiagram.model = go.Model.fromJson(modelData);
  }
}