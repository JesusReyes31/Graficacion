import { Component, ElementRef, ViewChild } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import * as go from 'gojs';

@Component({
  selector: 'app-cu',
  imports: [],
  templateUrl: './cu.component.html',
  styleUrl: './cu.component.css'
})
export class CUComponent {
  @ViewChild('paletteDiv', { static: true }) paletteDiv!: ElementRef;
  @ViewChild('diagramDiv', { static: true }) diagramDiv!: ElementRef;
  public relationshipMode: boolean = false; 
  diagram!: go.Diagram;

  constructor(private toastr:ToastrService){}

  ngAfterViewInit() {
    this.initDiagram();
    this.initPalette();
    this.loadDiagram();
  }

  initDiagram() {
    const $ = go.GraphObject.make;
    this.diagram = $(go.Diagram, this.diagramDiv.nativeElement, {
      initialContentAlignment: go.Spot.Center,
      'undoManager.isEnabled': true,
      'draggingTool.dragsLink': true,
      'linkingTool.isEnabled': false,
      'linkingTool.direction':go.LinkingTool.ForwardsOnly,
      'animationManager.isEnabled': true,
      "draggingTool.isGridSnapEnabled": true,
      "grid.visible":false
    });

    this.diagram.nodeTemplateMap = this.getNodeTemplateMap();
    this.diagram.groupTemplate = this.getGroupTemplate();
    this.diagram.linkTemplate = this.getLinkTemplate();

    this.diagram.model = new go.GraphLinksModel({
      linkKeyProperty: "key",
    });

    this.diagram.addDiagramListener('LinkDrawn', (e) => {
      this.relationshipMode = false;
      this.diagram.toolManager.linkingTool.isEnabled = false;
    });

    // Evento para activar edición después de arrastrar un actor desde la paleta
    this.diagram.addDiagramListener('ExternalObjectsDropped', (e) => {
      let CU = false;
      e.subject.each((part: go.Node) => {
        if (part instanceof go.Node && part.category === "usecase" && part.containingGroup === null) {
          alert("Los casos de uso deben colocarse dentro de un área.");
          // Remueve el nodo si no se encuentra dentro de un grupo (área)
          this.diagram.remove(part);
          CU = true
        }
      });
      e.subject.each((part: go.Part) => {
        if (part.category === 'actor') {
          this.diagram.commandHandler.editTextBlock(<go.TextBlock>part.findObject('ACTOR_LABEL'));
        } else if (part.category === 'usecase') {
          if(!CU){
            this.diagram.commandHandler.editTextBlock(<go.TextBlock>part.findObject('CULabel'));
          }
        }
      });
    });    

    this.diagram.model.addChangedListener((e) => {
      if (e.isTransactionFinished) {  // 🔹 Solo guarda al finalizar una transacción
        this.saveDiagram();
      }
    });
  }

  initPalette() {
    const $ = go.GraphObject.make;
    
    // Crear una plantilla específica para el área en la paleta
    const areaPaletteTemplate = $(go.Group, "Auto",
      {
        background: "transparent",
        layerName: "Background",
        computesBoundsAfterDrag: true,
        mouseDragEnter: null,
        mouseDragLeave: null,
        mouseDrop: null,
        alignment: go.Spot.Center, // Alinea al centro
      },
      $(go.Shape, "Rectangle", {
        fill: "white",
        stroke: "black",
        strokeWidth: 2,
        minSize: new go.Size(100, 100)
      }),
      $(go.Panel, "Vertical", 
        {
          alignment: go.Spot.Center, // Alinea los elementos en el panel al centro
          margin: new go.Margin(0, 0, 0, 0), // Elimina márgenes si es necesario
        },
        $(go.TextBlock, 
          {
            alignment: go.Spot.Center, // Alinea el texto al centro
            margin: 8,
            editable: true,
            font: "bold 12pt sans-serif"
          },
          new go.Binding("text", "nombre").makeTwoWay()),
        $(go.Placeholder, { padding: 5, background: "transparent" })
      )
    );
  
    const palette = $(go.Palette, this.paletteDiv.nativeElement, {
      nodeTemplateMap: this.getNodeTemplateMap(),
      initialContentAlignment: go.Spot.Center,
      contentAlignment: go.Spot.Center,
      groupTemplateMap: new go.Map<string, go.Group>().add("area", areaPaletteTemplate),
      model: new go.GraphLinksModel([
        { category: 'actor', text: 'Actor' }, 
        { category: 'usecase', text: 'Caso de Uso' },
        { category: 'area', isGroup: true }
      ])
    });
  }
  

  getNodeTemplateMap(): go.Map<string, go.Node> {
    const $ = go.GraphObject.make;
    const actorNode = $(go.Node, 'Vertical',
      { locationSpot: go.Spot.Center, movable: true, deletable: true, fromLinkable: true, toLinkable: true, width: 100 },
      new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
      $(go.Shape, 'Circle', { width: 25, height: 25, fill: 'lightgray', stroke: 'black', strokeWidth: 2 }),
      $(go.Panel, 'Vertical',
        $(go.Panel, 'Horizontal',
          $(go.Shape, { geometryString: "M0 0 L-20 0", stroke: "black", strokeWidth: 2 }),
          $(go.Shape, { geometryString: "M0 0 L0 25", stroke: "black", strokeWidth: 2 }),
          $(go.Shape, { geometryString: "M0 0 L20 0", stroke: "black", strokeWidth: 2 })
        )
      ),
      $(go.Panel, 'Horizontal',
        $(go.Shape, { geometryString: "M0 0 L-10 20", stroke: "black", strokeWidth: 2 }),
        $(go.Shape, { geometryString: "M0 0 L10 20", stroke: "black", strokeWidth: 2 })
      ),
      $(go.TextBlock, { name: 'ACTOR_LABEL', margin: 5, editable: true, font: "bold 14pt sans-serif", textAlign: "center" },
        new go.Binding("text").makeTwoWay()
      )
    );
  
    const usecaseNode = $(go.Node, 'Auto',
      { 
        locationSpot: go.Spot.Center, 
        movable: true, 
        deletable: true, 
        toLinkable: true, 
        fromLinkable: false,
        resizable: true, 
        minSize: new go.Size(50, 30),
      },
      new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
      new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),
      $(go.Shape, 'Ellipse', { fill: 'lightblue', stroke: 'black' }),
      $(go.TextBlock, {
        name: "CULabel",
        margin: 5,
        editable: true,
        font: "bold 12pt sans-serif",
        wrap: go.TextBlock.WrapFit,
        textAlign: "center",
        desiredSize: new go.Size(100, NaN)
      },
      new go.Binding('text').makeTwoWay()
      )
    );
  
    // Crear el mapa solo con las definiciones de nodos (sin el grupo)
    const map = new go.Map<string, go.Node>();
    map.set('actor', actorNode);
    map.set('usecase', usecaseNode);
  
    return map;
  }
  

  getGroupTemplate(): go.Group {
    const $ = go.GraphObject.make;
    return $(go.Group, "Auto",
      {
        isSubGraphExpanded: true,
        movable: true,
        handlesDragDropForMembers: true,
        computesBoundsAfterDrag: true,
        memberValidation: (group: any, node: any) => node.category === "usecase",
        mouseDrop: function(e, grp) {
          const diagram = grp.diagram;
          const tool = diagram!.currentTool as any;
          if (!tool.doingDragSelecting) {
            e.handled = true;
            const group = grp as go.Group;
            const groupKey = group.data.key;
            diagram!.model.startTransaction("grouping");
            diagram!.selection.each((part: go.Part) => {
              if (part instanceof go.Node && part.category === "usecase") {
                diagram!.model.setDataProperty(part.data, "group", groupKey);
              }
            });
            diagram!.model.commitTransaction("grouping");
          }
        }
      },
      $(go.Shape, "Rectangle",
        {
          name: "SHAPE",
          fill: "white",
          stroke: "black",
          strokeWidth: 2,
          minSize: new go.Size(200, 200)
        },
        new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify)
      ),
      $(go.Panel, "Vertical",
        $(go.TextBlock,
          {
            alignment: go.Spot.Top,
            margin: 8,
            editable: true,
            font: "bold 12pt sans-serif"
          },
          new go.Binding("text", "nombre").makeTwoWay()),
        $(go.Placeholder,
           { padding: 5, background: "transparent" }
        )
      )
    );
  }

  getLinkTemplate(): go.Link {
    const $ = go.GraphObject.make;
    return $(go.Link,
      { routing: go.Link.Orthogonal,reshapable:true,resegmentable:false,relinkableTo:true,relinkableFrom:true, corner: 5, selectable:true}, 
      $(go.Shape, { stroke: "gray", strokeWidth: 2, strokeDashArray: [4,2] }), // 🔹 Línea de conexión
      $(go.Shape, { toArrow: "OpenTriangle", stroke: "gray", fill: "white" ,strokeWidth:3}),
      new go.Binding("points").makeTwoWay()
    );
  }

  saveDiagram() {
    // console.log("Se Guardó")
    if (this.diagram) {
      const json = this.diagram.model.toJson();
      localStorage.setItem("DiagramCU"+sessionStorage.getItem("proyecto"), json);
      // console.log("Diagrama guardado:", json);
    }
  }

  // Alterna el modo de creación de relaciones
  toggleRelationshipMode(): void {
    this.relationshipMode = !this.relationshipMode;
    this.diagram.toolManager.linkingTool.isEnabled = this.relationshipMode;
  }

  loadDiagram() {
    const savedData = localStorage.getItem("DiagramCU"+sessionStorage.getItem("proyecto"));
    if (savedData) {
      const model = go.Model.fromJson(savedData) as go.GraphLinksModel;
      model.linkKeyProperty = "key";  // 🔹 Restaurar la clave de enlaces únicos
      this.diagram.model = model;     // 🔹 Asignar el modelo al diagrama
  
      // 🔹 Volver a asignar el listener porque se pierde cuando cambiamos el modelo
      this.diagram.model.addChangedListener((e) => {
        if (e.isTransactionFinished) {  
          this.saveDiagram();
        }
      });
    }
  }
}
