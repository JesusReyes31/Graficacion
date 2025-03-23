import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as go from 'gojs';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-componentes',
  standalone: true,
  imports: [CommonModule,FormsModule],  
  templateUrl: './componentes.component.html',
  styleUrl: './componentes.component.css'
})
export class ComponentesComponent implements OnInit {
  @ViewChild('diagramDiv', { static: true }) diagramDiv!: ElementRef;
  private diagram!: go.Diagram;
  public interOfrecida: boolean = false;
  public interSolicitada: boolean = false;
  currentVersion = '1.0';
  versions: string[] = [];
  projectId = '';

  ngOnInit() {
    this.initDiagram();
    this.addPaletteElements();    
  }
  constructor(private toastr: ToastrService) {
    this.projectId = sessionStorage.getItem('proyecto') || '';
    this.loadVersions();
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
      this.diagram.model.addChangedListener((e) => {
        if (e.isTransactionFinished) {
          this.saveDiagram();
          // Revisar si el grupo debe ser eliminado
          if (e.change === go.ChangedEvent.Remove && e.object instanceof go.Node) {
            this.checkAndRemoveGroup(e.object);
          }
        }
    });
  }
  private checkAndRemoveGroup(removedNode: go.Node) {
    const groupKey = removedNode.data.group;
    if (!groupKey) return; // Si no tiene grupo, no hacer nada
    
    // Buscar otros miembros del grupo
    const groupMembers = this.diagram.model.nodeDataArray.filter((n) => n['group'] === groupKey);
    
    // Si solo queda un miembro en el grupo, eliminar el grupo
    if (groupMembers.length === 1) {
      // Buscar el nodo del grupo
      const groupNode = this.diagram.findNodeForData({ key: groupKey });
      if (groupNode) {
        // Empezamos la transacción para eliminar el grupo
        this.diagram.startTransaction("Remove Group");
        // Eliminar el grupo
        this.diagram.model.removeNodeData(groupNode.data);
        // Finalizamos la transacción
        this.diagram.commitTransaction("Remove Group");
      }
    }
  }
  
  
  private attachCircleToSemiCircle(semiCircleNode: go.Part) {
    if (!(semiCircleNode instanceof go.Node)) return;
  
    const circleNode = this.diagram.selection.first();
    if (!(circleNode instanceof go.Node)) return;
  
    // Comprobar si el nodo que estamos intentando conectar es un semicírculo
    if (semiCircleNode.category === "semiCircle" && circleNode.category === "semiCircle") {
      this.toastr.warning("No se pueden conectar dos interfaces ofrecidas.");
      return;
    }
  
    // Obtener los rectKey de ambos nodos
    const semiCircleRectKey = semiCircleNode.data.rectKey; // Propiedad rectKey del semi-círculo
    const circleNodeRectKey = circleNode.data.rectKey; // Propiedad rectKey del círculo
  
    // Validar que ambos nodos no pertenezcan al mismo rectángulo
    if (semiCircleRectKey === circleNodeRectKey) {
      this.toastr.warning("Ambos nodos deben provenir de distintos componentes.");
      return;  // No se conecta si ambos provienen del mismo rectángulo
    }
  
    this.diagram.startTransaction("Attach Circle to SemiCircle");
  
    const existingGroupKey = semiCircleNode.data.group;
  
    // Verificar si ya hay un grupo asignado
    if (existingGroupKey) {
      const groupMembers = this.diagram.model.nodeDataArray.filter(n => n['group'] === existingGroupKey);
  
      // Validar que no haya más de dos nodos en el grupo
      if (groupMembers.length >= 2) {
        this.toastr.warning("Un grupo solo puede tener dos elementos.");
        return;
      }
    }
  
    // Crear grupo si no existe
    if (!existingGroupKey) {
      const groupData = {
        key: '',
        isGroup: true,
        name:''
      };
      (this.diagram.model as go.GraphLinksModel).addNodeData(groupData);
      (this.diagram.model as go.GraphLinksModel).setDataProperty(semiCircleNode.data, "group", groupData.key);
    }
  
    // Asignar el nodo al grupo
    (this.diagram.model as go.GraphLinksModel).setDataProperty(circleNode.data, "group", semiCircleNode.data.group);
  
    // Posicionar los nodos uno abajo y el otro arriba
    const groupLocation = semiCircleNode.location.copy();
    const offset = 5; // Distancia entre los nodos (ajustada para que estén más cerca)
  
    // Posicionar el semicírculo arriba del círculo
    semiCircleNode.location = new go.Point(groupLocation.x, groupLocation.y - offset);
  
    // Posicionar el círculo abajo del semicírculo
    circleNode.location = new go.Point(groupLocation.x, groupLocation.y + offset);
  
    // Bloquear movimiento individual
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
          zOrder: 2, // Asegurar que el círculo esté sobre el semicírculo
        },
        $(go.Shape, "Circle", { fill: "lightblue", width: 30, height: 30 })
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
  private addCircleNode(rectNode: go.Part | null) {
    if (!(rectNode instanceof go.Node)) return; // Validamos que sea un nodo
    if (!rectNode.data || !rectNode.data.key) return; // Validamos que tenga un key válido
  
    // Obtener la ubicación del rectángulo y posicionar el nuevo nodo debajo
    const rectLoc = rectNode.location.copy();
    rectLoc.y += 80;
  
    this.diagram.startTransaction("Add Node");
  
    let newNode: any = null; // Inicializamos la variable correctamente
  
    // Asignamos un rectKey al nuevo nodo
    const rectKey = rectNode.data.key;
  
    if (this.interSolicitada) {
      newNode = {
        key: "circle_" + Date.now(),
        category: "circle",
        name: "",
        loc: go.Point.stringify(rectLoc),
        rectKey: rectKey // Asociamos el rectángulo con el nuevo nodo
      };
    } 
    else if (this.interOfrecida) {
      newNode = {
        key: "semi_" + Date.now(),
        category: "semiCircle",
        name: "",
        loc: go.Point.stringify(rectLoc),
        rectKey: rectKey // Asociamos el rectángulo con el nuevo nodo
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

  // Gestión de versiones
    loadVersions() {
      const versionsKey = `${this.projectId}`;
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
      
      localStorage.setItem(`${this.projectId}`, JSON.stringify(this.versions));
      this.diagram.model = new go.GraphLinksModel({ linkKeyProperty: "key" });
      this.saveDiagram();
      this.toastr.success(`Nueva versión ${this.currentVersion} creada`);
    }
  
    changeVersion(version: string) {
      this.currentVersion = version;
      this.loadDiagram();
      this.toastr.info(`Versión ${version} cargada`);
    }
  
    saveDiagram() {
      if (this.diagram) {
        localStorage.setItem(
          `DiagramComp_${this.projectId}_v${this.currentVersion}`, 
          this.diagram.model.toJson()
        );
      }
    }
    loadDiagram() {
        const savedData = localStorage.getItem(`DiagramComp_${this.projectId}_v${this.currentVersion}`);
        if (savedData) {
          const model = go.Model.fromJson(savedData) as go.GraphLinksModel;
          model.linkKeyProperty = "key";
          this.diagram.model = model;
          this.diagram.model.addChangedListener(e => { if (e.isTransactionFinished) this.saveDiagram(); });
        }
      }
  
}
