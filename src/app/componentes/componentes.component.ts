import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as go from 'gojs';

@Component({
  selector: 'app-componentes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './componentes.component.html',
  styleUrl: './componentes.component.css'
})
export class ComponentesComponent implements OnInit {
  @ViewChild('diagramDiv', { static: true }) diagramDiv!: ElementRef;
  private diagram!: go.Diagram;
  public interOfrecida: boolean = false;
  public interSolicitada: boolean = false;

  ngOnInit() {
    this.initDiagram();
    this.addPaletteElements();
    this.enableLinkingTool();
    
  }

  private initDiagram() {
    const $ = go.GraphObject.make;
    this.diagram = $(go.Diagram, this.diagramDiv.nativeElement, {
      "undoManager.isEnabled": true,
      allowMove: true,
      allowLink: true,
      "linkingTool.direction": go.LinkingTool.ForwardsOnly,
      "draggingTool.dragsLink": true,
      "draggingTool.isGridSnapEnabled": true,
      "linkingTool.isUnconnectedLinkValid": true,
      "linkingTool.portGravity": 20,
      "relinkingTool.isUnconnectedLinkValid": true,
      "relinkingTool.portGravity": 20,
      "relinkingTool.fromHandleArchetype":
        $(go.Shape, "Diamond", { segmentIndex: 0, cursor: "pointer", desiredSize: new go.Size(8, 8), fill: "tomato", stroke: "darkred" }),
      "relinkingTool.toHandleArchetype":
        $(go.Shape, "Diamond", { segmentIndex: -1, cursor: "pointer", desiredSize: new go.Size(8, 8), fill: "darkred", stroke: "tomato" }),
      "linkReshapingTool.handleArchetype":
        $(go.Shape, "Diamond", { desiredSize: new go.Size(7, 7), fill: "lightblue", stroke: "deepskyblue" })
    });

    // Template para nodos
    this.diagram.nodeTemplate =
      $(go.Node, "Auto",
        {
          selectionAdorned: true,
          fromLinkable: true,
          toLinkable: true,
          movable: true,
          resizable: true,
          height: 70,
          width:150,
          click: (e, obj) => this.addCircleNode(obj.part) // Detectar clic en el rectángulo
        },
        $(go.Shape, "Rectangle",
          {
            fill: "white",
            stroke: "black",
            strokeWidth: 2
          }),
        $(go.Panel, "Vertical",
          { margin: 8 },
          $(go.Panel, "Horizontal",
            { alignment: go.Spot.Top },
            $(go.TextBlock,
              {
                font: "bold 12px sans-serif",
                editable: true,
                margin: new go.Margin(0, 20, 0, 0)  // margen derecho para el ícono
              },
              new go.Binding("text", "name").makeTwoWay()),
            // Ícono de libreta en la esquina superior derecha
            $(go.Shape,
              {
                geometryString: "M 0,0 L 14,0 14,14 0,14 Z M 2,2 L 12,2 M 2,5 L 12,5 M 2,8 L 12,8 M 2,11 L 12,11", // Dibujo simple de una libreta
                fill: "white",
                stroke: "black",
                strokeWidth: 1,
                width: 14,
                height: 14,
                alignment: go.Spot.TopRight,
                alignmentFocus: go.Spot.TopRight
              })
          )
        )
      );
      this.diagram.nodeTemplateMap.add("semiCircle",
        $(go.Node, "Spot",
          { 
            locationSpot: go.Spot.Center,
            movable: true,
            toLinkable: true,  // Permitir que se conecte algo a él
            zOrder: 1,  // Mantenerlo debajo del círculo
            mouseDrop: (e, obj) => this.attachCircleToSemiCircle(obj as go.Part) // Cuando se suelte un nodo encima
          },
          $(go.Shape,
            {
              geometryString: "M -20 0 A 20 20 0 1 1 20 0",
              fill: "lightblue",
              stroke: "black",
              strokeWidth: 4,
              name: "SHAPE"
            }
          ),
          $(go.TextBlock, "", { margin: 5, alignment: go.Spot.Center })
        )
      );
      
    // Template para enlaces
    this.diagram.linkTemplate =
      $(go.Link,
        {
          selectionAdorned: true,
          relinkableFrom: true,
          relinkableTo: true,
          reshapable: true,
          routing: go.Link.AvoidsNodes,
          curve: go.Link.JumpOver,
        },
        $(go.Shape,
          { strokeWidth: 2, stroke: "#000000" })
      );
  }
  private attachCircleToSemiCircle(semiCircleNode: go.Part) {
    if (!(semiCircleNode instanceof go.Node)) return; // Validar nodo correcto
  
    const circleNode = this.diagram.selection.first();
    if (!(circleNode instanceof go.Node)) return; // Validar que hay un nodo seleccionado
  
    this.diagram.startTransaction("Attach Circle to SemiCircle");
  
    // Ajustar la posición del círculo para que quede justo encima del semicírculo
    const semiCirclePos = semiCircleNode.location.copy();
    circleNode.move(new go.Point(semiCirclePos.x, semiCirclePos.y)); 
  
    // Crear un grupo si aún no existe
    if (!semiCircleNode.data.group) {
      const groupData = {
        key: "group_" + Date.now(),
        isGroup: true
      };
      (this.diagram.model as go.GraphLinksModel).addNodeData(groupData);
      (this.diagram.model as go.GraphLinksModel).setDataProperty(semiCircleNode.data, "group", groupData.key);
    }
  
    // Asignar ambos nodos al grupo
    (this.diagram.model as go.GraphLinksModel).setDataProperty(circleNode.data, "group", semiCircleNode.data.group);
  
    // Bloquear el movimiento de los nodos individuales
    circleNode.movable = false;
    semiCircleNode.movable = false;
  
    this.diagram.commitTransaction("Attach Circle to SemiCircle");
  }
  
  
  private addPaletteElements() {
    const $ = go.GraphObject.make;
    
    // Template para la flecha como nodo
    this.diagram.nodeTemplateMap.add("circle",
      $(go.Node, "Spot",
        { 
          locationSpot: go.Spot.Center,
          movable: true,  // Permitir moverlo
          fromLinkable: true,
          toLinkable: true, 
          zOrder: 2, // Asegurar que el círculo esté sobre el semicírculo
        },
        $(go.Shape, "Circle", { fill: "lightblue", width: 50, height: 50 })
      )
    );
    

    const myPalette = $(go.Palette, "palette",
      {
        maxSelectionCount: 1,
        nodeTemplateMap: this.diagram.nodeTemplateMap,
        model: new go.GraphLinksModel(
          [
            { 
              key: "rect1", 
              category: "rectangle",
              name: "Componente" 
            }
          ]
        )
      }
    );
  }
  private highlightSemiCircle(node: go.Part, highlight: boolean) {
    const shape = node.findObject("SHAPE") as go.Shape; // Forzar el tipo a Shape
    if (shape) {
      shape.stroke = highlight ? "red" : "black";  // Cambiar el borde para resaltar
    }
  }
  
  public enableLinkingTool() {
    const tool = this.diagram.toolManager.linkingTool;
    const flechasElement = document.getElementById("flechas");
    if (tool.isEnabled) {
      tool.isEnabled = false;
      this.diagram.currentCursor = "";
      if (flechasElement) {
        flechasElement.style.setProperty("background-color", "green");
        flechasElement.innerText = "Activar Flechas";
      }
    } else {
      tool.isEnabled = true;
      if (flechasElement) {
        flechasElement.style.setProperty("background-color", "red");
        flechasElement.innerText = "Desactivar Flechas";
      }
      this.diagram.currentCursor = "pointer";
    }
  }
  private addCircleNode(rectNode: go.Part | null) {
    if (!(rectNode instanceof go.Node)) return; // Validamos que sea un nodo
    if (!rectNode.data || !rectNode.data.key) return; // Validamos que tenga un key válido
  
    // Obtener la ubicación del rectángulo y posicionar el nuevo nodo debajo
    const rectLoc = rectNode.location.copy();
    rectLoc.y += 80;
  
    this.diagram.startTransaction("Add Node");
  
    let newNode: any = null; // Inicializamos la variable correctamente
  
    if (this.interSolicitada) {
      newNode = {
        key: "circle_" + Date.now(),
        category: "circle",
        name: "",
        loc: go.Point.stringify(rectLoc)
      };
    } 
    else if (this.interOfrecida) {
      newNode = {
        key: "semi_" + Date.now(),
        category: "semiCircle",
        name: "",
        loc: go.Point.stringify(rectLoc)
      };
    }
  
    if (newNode) {
      // Agregar el nodo al modelo
      (this.diagram.model as go.GraphLinksModel).addNodeData(newNode);
  
      // Crear y agregar el enlace
      (this.diagram.model as go.GraphLinksModel).addLinkDataCollection([
        { from: rectNode.data.key, to: newNode.key }
      ]);
    }
  
    this.diagram.commitTransaction("Add Node");
  }
  
  public toggleInterfaz(mode: 'ofrecida' | 'solicitada') {
    if (mode === 'ofrecida') {
      this.interOfrecida = !this.interOfrecida;
      this.interSolicitada = false;
    } else {
      this.interSolicitada = !this.interSolicitada;
      this.interOfrecida = false;
    }
  }
}
