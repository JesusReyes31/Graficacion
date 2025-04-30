import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as go from 'gojs';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import { VersionesService } from '../services/versiones/versiones.service';

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
  currentVersionId!: number;
  versions: any[] = []; // Solo se guardarán versiones con ID_Tipo === 4
  ID_Proyecto = 0;
  projectId = '';
  versionData = {
    ID_V: 0,
    ID_Proyecto: 0,
    ID_Tipo: 4,
    json: ''
  };
  KAPPA = 4 * ((Math.sqrt(2) - 1) / 3);

  ngOnInit() {
    this.initDiagram();
    this.addPaletteElements(); 
    this.loadVersions();   
  }
  constructor(private toastr: ToastrService, private versionesService: VersionesService) {
    this.projectId = sessionStorage.getItem('proyecto') || '';
    this.projectId = sessionStorage.getItem('proyecto') || '';
    this.ID_Proyecto = parseInt(sessionStorage.getItem('ID_Proyecto') || '0');
    this.versionData.ID_Proyecto = this.ID_Proyecto;
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

    go.Shape.defineFigureGenerator('DB', (shape, w, h) => {
      const geo = new go.Geometry();
      const cpxOffset = this.KAPPA * 0.5;
      const cpyOffset = this.KAPPA * 0.1;
      const fig = new go.PathFigure(w, 0.1 * h, true);
      geo.add(fig);
      // Body
      fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.9 * h));
      fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.5 * w, h, w, (0.9 + cpyOffset) * h, (0.5 + cpxOffset) * w, h));
      fig.add(new go.PathSegment(go.SegmentType.Bezier, 0, 0.9 * h, (0.5 - cpxOffset) * w, h, 0, (0.9 + cpyOffset) * h));
      fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0.1 * h));
      fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.5 * w, 0, 0, (0.1 - cpyOffset) * h, (0.5 - cpxOffset) * w, 0));
      fig.add(new go.PathSegment(go.SegmentType.Bezier, w, 0.1 * h, (0.5 + cpxOffset) * w, 0, w, (0.1 - cpyOffset) * h));
      const fig2 = new go.PathFigure(w, 0.1 * h, false);
      geo.add(fig2);
      // Rings
      fig2.add(new go.PathSegment(go.SegmentType.Bezier, 0.5 * w, 0.2 * h, w, (0.1 + cpyOffset) * h, (0.5 + cpxOffset) * w, 0.2 * h));
      fig2.add(new go.PathSegment(go.SegmentType.Bezier, 0, 0.1 * h, (0.5 - cpxOffset) * w, 0.2 * h, 0, (0.1 + cpyOffset) * h));
      fig2.add(new go.PathSegment(go.SegmentType.Move, w, 0.2 * h));
      fig2.add(new go.PathSegment(go.SegmentType.Bezier, 0.5 * w, 0.3 * h, w, (0.2 + cpyOffset) * h, (0.5 + cpxOffset) * w, 0.3 * h));
      fig2.add(new go.PathSegment(go.SegmentType.Bezier, 0, 0.2 * h, (0.5 - cpxOffset) * w, 0.3 * h, 0, (0.2 + cpyOffset) * h));
      fig2.add(new go.PathSegment(go.SegmentType.Move, w, 0.3 * h));
      fig2.add(new go.PathSegment(go.SegmentType.Bezier, 0.5 * w, 0.4 * h, w, (0.3 + cpyOffset) * h, (0.5 + cpxOffset) * w, 0.4 * h));
      fig2.add(new go.PathSegment(go.SegmentType.Bezier, 0, 0.3 * h, (0.5 - cpxOffset) * w, 0.4 * h, 0, (0.3 + cpyOffset) * h));
      geo.spot1 = new go.Spot(0, 0.4);
      geo.spot2 = new go.Spot(1, 0.9);
      return geo;
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
        new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
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
          new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
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
      this.diagram.nodeTemplateMap.add("BD",
        $(go.Node, "Vertical",
          $(go.Shape, "DB",
            { width: 80, height: 120, fill: "lightblue", stroke: "black" }),
          new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify)  
        )
      )
      
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
        new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
        $(go.Shape, "Circle", { fill: "lightblue", width: 30, height: 30 })
      )
    );
    

    const myPalette = $(go.Palette, "palette",
      {
        maxSelectionCount: 1,
        nodeTemplateMap: this.diagram.nodeTemplateMap,
        initialContentAlignment: go.Spot.Center,
        contentAlignment:go.Spot.Center,
        model: new go.GraphLinksModel(
          [
            { 
              key: "rect1", 
              category: "rectangle",
              name: "Componente" 
            }
            // ,
            // {
            //   key: "BD1",
            //   category: "BD",
            //   name: "Base de Datos"
            // }
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
        this.versionesService.getVersiones(this.ID_Proyecto).subscribe(
          (data: any) => {
            // Si la respuesta tiene "message" o viene vacía, asumimos que no hay versiones.
            if (data.message || !data || data.length === 0) {
              this.versions = [];
            } else {
              // Filtrar solo las versiones de tipo 4
              this.versions = data.filter((v: any) => v.ID_Tipo === 4);
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
                  this.versionData.ID_Tipo = 4;
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
        // Al crear nueva versión, siempre se crea del tipo 4
        this.versionData.ID_Tipo = 4;
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
