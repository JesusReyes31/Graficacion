import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import * as go from 'gojs';

@Component({
  selector: 'app-clases',
  templateUrl: './clases.component.html',
  styleUrls: ['./clases.component.css']
})
export class ClasesComponent implements AfterViewInit {
  public diagram: go.Diagram | null = null;

  @ViewChild('diagramDiv') diagramDiv!: ElementRef;
  @ViewChild('paletteDiv') paletteDiv!: ElementRef;

  ngAfterViewInit(): void {
    this.initDiagram();
    this.initPalette();
  }

  initDiagram(): void {
    const $ = go.GraphObject.make;
    this.diagram = $(go.Diagram, this.diagramDiv.nativeElement, {
      'undoManager.isEnabled': true,
      "draggingTool.isEnabled": true,
      "linkingTool.isEnabled": true,
      "linkReshapingTool.isEnabled": true,
      "model.linkFromKeyProperty": "from",
      "model.linkToKeyProperty": "to",
    });
  
    this.diagram.nodeTemplateMap = this.createNodeTemplates($);
    this.diagram.linkTemplateMap = this.createLinkTemplates($);
    this.diagram.groupTemplateMap = this.createGroupTemplates($);
  
    // Listener para manejar nodos fuera de límites
    this.diagram.addDiagramListener('SelectionMoved', (e) => {
      const diagram = e.diagram;
      if (!diagram) return;
  
      e.subject.each((node: go.Node) => {
        if (node instanceof go.Node && node.containingGroup) {
          const groupBounds = node.containingGroup.actualBounds;
          const nodeBounds = node.actualBounds;
  
          // Comprueba si el nodo está fuera del grupo
          if (!groupBounds.containsRect(nodeBounds)) {
            const model = diagram.model as go.GraphLinksModel;
            const nodeData = node.data;
  
            if (nodeData && model) {
              model.setDataProperty(nodeData, "group", null); // Elimina la referencia al grupo
            }
          }
        }
      });
    });
  
    // Modelo de datos con nodos y relaciones
    this.diagram.model = new go.GraphLinksModel(
      [
        { key: 1, category: "classWithAttributesAndMethods", name: "Clase1", attributes: "-atributo1: tipo\n-atributo2: tipo", methods: "+metodo1(): tipo\n+metodo2(): tipo" },
        { key: 2, category: "classWithAttributesAndMethods", name: "Clase2", attributes: "-atributo1: tipo\n-atributo2: tipo", methods: "+metodo1(): tipo\n+metodo2(): tipo" }
      ],
      [
        { from: 1, to: 2, rightText: "Relación" }
      ]
    );
    (this.diagram.model as go.GraphLinksModel).nodeCategoryProperty = "category";
  }
  

  initPalette(): void {
    const $ = go.GraphObject.make;
    const palette = $(go.Palette, this.paletteDiv.nativeElement, {
      nodeTemplateMap: this.createNodeTemplates($),    // Plantillas de nodos (para clases)
      groupTemplateMap: this.createGroupTemplates($),  // Plantillas de grupos (para paquetes)
      initialContentAlignment: go.Spot.Center,
      model: new go.GraphLinksModel([
        { category: "classOnly", name: "Clase" },
        { category: "classWithAttributes", name: "Clase", attributes: "-atributo1: tipo\n-atributo2: tipo" },
        { category: "classWithAttributesAndMethods", name: "Clase", attributes: "-atributo1: tipo\n-atributo2: tipo", methods: "+metodo1(): tipo\n+metodo2(): tipo" },
        { category: "package", name: "Paquete", isGroup: true }  // Ahora esto se usa para los grupos
      ])
    });
  }
  

  createNodeTemplates($: any): go.Map<string, go.Node> {
    const commonNodeProps = {
      locationSpot: go.Spot.Center,
      movable: true,
      deletable: true,
      resizable: true,
      minSize: new go.Size(100, 50)
    };
  
    const classOnlyTemplate = $(go.Node, "Auto", commonNodeProps,
      $(go.Shape, "Rectangle", { strokeWidth: 1, stroke: "black", fill: "white" }),
      $(go.Panel, "Table", { defaultRowSeparatorStroke: "black", stretch: go.GraphObject.Fill },
        $(go.Panel, "Auto", { row: 0, margin: 4 },
          $(go.TextBlock, { font: "bold 16px sans-serif", editable: true, textAlign: "center", stretch: go.GraphObject.Fill, minSize: new go.Size(100, 20) },
            new go.Binding("text", "name").makeTwoWay())
        )
      )
    );
  
    const classWithAttributesTemplate = $(go.Node, "Auto", commonNodeProps,
      $(go.Shape, "Rectangle", { strokeWidth: 1, stroke: "black", fill: "white" }),
      $(go.Panel, "Table", { defaultRowSeparatorStroke: "black", stretch: go.GraphObject.Fill },
        $(go.Panel, "Auto", { row: 0, margin: 4 },
          $(go.TextBlock, { font: "bold 16px sans-serif", editable: true, textAlign: "center", stretch: go.GraphObject.Fill, minSize: new go.Size(100, 20) },
            new go.Binding("text", "name").makeTwoWay())
        ),
        $(go.Panel, "Auto", { row: 1, margin: 4 },
          $(go.TextBlock, { font: "italic 12px sans-serif", editable: true, stretch: go.GraphObject.Fill, minSize: new go.Size(100, 20) },
            new go.Binding("text", "attributes").makeTwoWay())
        )
      )
    );
  
    const classWithAttributesAndMethodsTemplate = $(go.Node, "Auto", commonNodeProps,
      $(go.Shape, "Rectangle", { strokeWidth: 1, stroke: "black", fill: "white" }),
      $(go.Panel, "Table", { defaultRowSeparatorStroke: "black", stretch: go.GraphObject.Fill },
        $(go.Panel, "Auto", { row: 0, margin: 4 },
          $(go.TextBlock, { font: "bold 16px sans-serif", editable: true, textAlign: "center", stretch: go.GraphObject.Fill, minSize: new go.Size(100, 20) },
            new go.Binding("text", "name").makeTwoWay())
        ),
        $(go.Panel, "Auto", { row: 1, margin: 4 },
          $(go.TextBlock, { font: "italic 12px sans-serif", editable: true, stretch: go.GraphObject.Fill, minSize: new go.Size(100, 20) },
            new go.Binding("text", "attributes").makeTwoWay())
        ),
        $(go.Panel, "Auto", { row: 2, margin: 4 },
          $(go.TextBlock, { font: "italic 12px sans-serif", editable: true, stretch: go.GraphObject.Fill, minSize: new go.Size(100, 20) },
            new go.Binding("text", "methods").makeTwoWay())
        )
      )
    );
  
    // Retorno del mapa de templates
    return new go.Map<string, go.Node>()
      .set("classOnly", classOnlyTemplate)
      .set("classWithAttributes", classWithAttributesTemplate)
      .set("classWithAttributesAndMethods", classWithAttributesAndMethodsTemplate);
  }
  

  createGroupTemplates($: any): go.Map<string, go.Group> {
    const commonNodeProps = {
      locationSpot: go.Spot.Center,
      movable: true,
      deletable: true,
      resizable: true,
      minSize: new go.Size(160, 100)
    };
  
    // Plantilla para los paquetes (estilo visual personalizado)
    const packageTemplate = $(go.Group, "Auto", {
      ...commonNodeProps,
      layout: $(go.GridLayout, { wrappingColumn: 3, alignment: go.GridLayout.Position }),
      computesBoundsAfterDrag: true,
      // Habilitar el grupo completo como puerto de conexión
      // Eventos para manejar arrastre y soltado
      mouseDragEnter: (e: any, grp: go.Group, prev: any) => {
        grp.isHighlighted = true;
        grp.background = "lightgreen"; // Resalta el área de arrastre cuando entra una clase
        if (grp.diagram) {
          grp.diagram.updateAllTargetBindings(); // Usar updateAllTargetBindings en lugar de updateTargetBindings
        }
      },
      mouseDragLeave: (e: any, grp: go.Group, next: any) => {
        grp.isHighlighted = false;
        grp.background = "lightgoldenrodyellow"; // Restaura el fondo del área
        if (grp.diagram) {
          grp.diagram.updateAllTargetBindings(); // Usar updateAllTargetBindings en lugar de updateTargetBindings
        }
      },
      mouseDrop: (e: any, grp: any) => {
        const selection = grp.diagram?.selection;
        if (selection && selection.size > 0) {
          grp.addMembers(selection, true); // Agregar nodos seleccionados al grupo
        }
      }
      
      
    },
      $(go.Shape, 'Rectangle',
        { fill: 'white', stroke: 'black', strokeWidth: 2 },
        new go.Binding('stroke', 'black', (h: boolean) => h ? 'dodgerblue' : 'lightgray').ofObject()
      ),
      $(go.Panel, 'Vertical',
        $(go.Panel, 'Horizontal', {
          stretch: go.GraphObject.Horizontal,
          background: '#DCE8E8',
          padding: 5,
        },
          $('SubGraphExpanderButton', { margin: 5 }),
          $(go.TextBlock, {
            alignment: go.Spot.Left, font: 'Bold 12pt sans-serif', margin: 5, editable: true,minSize: new go.Size(80, 20)
          },
            new go.Binding('text', 'name').makeTwoWay()
          )
        ),
        $(go.Placeholder, { padding: 10 }) // Contenedor para nodos hijos
      )
    );
  
    return new go.Map<string, go.Group>()
      .set("package", packageTemplate); // Registro en el mapa con categoría "package"
  }
  
  
  
  

  createLinkTemplates($: any): go.Map<string, go.Link> {
    const commonLinkProps = {
      routing: go.Link.AvoidsNodes, curve: go.Link.JumpOver, reshapable: true
    };

    const associationLinkTemplate = $(go.Link, commonLinkProps,
      $(go.Shape, { strokeWidth: 2, stroke: "blue" }),
      $(go.Shape, { toArrow: "OpenTriangle", stroke: "blue" }),
      $(go.TextBlock, {
        textAlign: "center", font: "bold 14px sans-serif", margin: new go.Margin(4, 10, 4, 10), editable: true,minSize: new go.Size(80, 20)
      },
        new go.Binding("text", "rightText").makeTwoWay())
    );

    const aggregationLinkTemplate = $(go.Link, commonLinkProps,
      $(go.Shape, { strokeWidth: 2, stroke: "blue" }),
      $(go.Shape, { toArrow: "Diamond", stroke: "blue", fill: "white" }),
      $(go.TextBlock, {
        textAlign: "center", font: "bold 14px sans-serif", margin: new go.Margin(4, 10, 4, 10), editable: true,minSize: new go.Size(80, 20)
      },
        new go.Binding("text", "rightText").makeTwoWay())
    );

    const compositionLinkTemplate = $(go.Link, commonLinkProps,
      $(go.Shape, { strokeWidth: 2, stroke: "blue" }),
      $(go.Shape, { toArrow: "Diamond", stroke: "blue", fill: "blue" }),
      $(go.TextBlock, {
        textAlign: "center", font: "bold 14px sans-serif", margin: new go.Margin(4, 10, 4, 10), editable: true,minSize: new go.Size(80, 20)
      },
        new go.Binding("text", "rightText").makeTwoWay())
    );

    const generalizationLinkTemplate = $(go.Link, commonLinkProps,
      $(go.Shape, { strokeWidth: 2, stroke: "blue" }),
      $(go.Shape, { toArrow: "Triangle", stroke: "blue", fill: "white" }),
      $(go.TextBlock, {
        textAlign: "center", font: "bold 14px sans-serif", margin: new go.Margin(4, 10, 4, 10), editable: true,minSize: new go.Size(80, 20)
      },
        new go.Binding("text", "rightText").makeTwoWay())
    );

    const dependencyLinkTemplate = $(go.Link, commonLinkProps,
      $(go.Shape, { strokeWidth: 2, strokeDashArray: [4, 2] }),
      $(go.Shape, { toArrow: "OpenTriangle", stroke: "black", fill: "white" }),
      $(go.TextBlock, {
        textAlign: "center", font: "bold 14px sans-serif", margin: new go.Margin(4, 10, 4, 10), editable: true,minSize: new go.Size(80, 20)
      },
        new go.Binding("text", "rightText").makeTwoWay())
    );

    const realizationLinkTemplate = $(go.Link, commonLinkProps,
      $(go.Shape, { strokeWidth: 2, strokeDashArray: [4, 4] }),
      $(go.Shape, { toArrow: "Triangle", stroke: "black", fill: "white" }),
      $(go.TextBlock, {
        textAlign: "center", font: "bold 14px sans-serif", margin: new go.Margin(4, 10, 4, 10), editable: true,minSize: new go.Size(80, 20)
      },
        new go.Binding("text", "rightText").makeTwoWay())
    );

    const reflexiveAssociationLinkTemplate = $(go.Link, commonLinkProps,
      $(go.Shape, { strokeWidth: 2, stroke: "blue" }),
      $(go.Shape, { toArrow: "OpenTriangle", stroke: "blue" }),
      $(go.TextBlock, {
        textAlign: "center", font: "bold 14px sans-serif", margin: new go.Margin(4, 10, 4, 10), editable: true,minSize: new go.Size(80, 20)
      },
        new go.Binding("text", "rightText").makeTwoWay())
    );

    return new go.Map<string, go.Link>()
      .set("association", associationLinkTemplate)
      .set("aggregation", aggregationLinkTemplate)
      .set("composition", compositionLinkTemplate)
      .set("generalization", generalizationLinkTemplate)
      .set("dependency", dependencyLinkTemplate)
      .set("realization", realizationLinkTemplate)
      .set("reflexiveAssociation", reflexiveAssociationLinkTemplate);
  }

  connectAssociation(): void {
    this.createLink("Asociación");
  }

  connectAssociationReflexive(): void {
    this.createLink("Asociación Reflexiva", "◯");
  }

  connectAggregation(): void {
    this.createLink("Agregación", "◇");
  }

  connectComposition(): void {
    this.createLink("Composición", "◆");
  }

  connectGeneralization(): void {
    this.createLink("Generalización", "△");
  }

  connectDependency(): void {
    this.createLink("Dependencia", "▷", true);
  }

  connectRealization(): void {
    this.createLink("Realización", "△", true);
  }

  private createLink(relationshipType: string, symbol: string = "", dashed: boolean = false): void {
    if (!this.diagram) return;

    const model = this.diagram.model as go.GraphLinksModel;
    const selectedNodes = this.diagram.selection.toArray().filter(node => node instanceof go.Node) as go.Node[];

    if (selectedNodes.length < 2 && relationshipType !== "Asociación Reflexiva") {
      alert("Selecciona al menos dos clases para conectarlas.");
      return;
    }

    if (selectedNodes.length < 1 && relationshipType === "Asociación Reflexiva") {
      alert("Selecciona solo 1 clase para conectarla.");
      return;
    }

    const fromKey = relationshipType === "Asociación Reflexiva" ? selectedNodes[0].data.key : selectedNodes[selectedNodes.length - 2].data.key;
    const toKey = relationshipType === "Asociación Reflexiva" ? selectedNodes[0].data.key : selectedNodes[selectedNodes.length - 1].data.key;

    let linkCategory = "solid";
    let symbolArrow = "";

    switch (relationshipType) {
      case "Dependencia":
        linkCategory = "dependency";
        symbolArrow = "OpenTriangle";
        break;
      case "Generalización":
        linkCategory = "generalization";
        symbolArrow = "Triangle";
        break;
      case "Composición":
        linkCategory = "composition";
        symbolArrow = "Diamond";
        break;
      case "Realización":
        linkCategory = "realization";
        symbolArrow = "OpenTriangle";
        break;
      case "Agregación":
        linkCategory = "aggregation";
        symbolArrow = "Diamond";
        break;
      case "Asociación Reflexiva":
        linkCategory = "reflexiveAssociation";
        symbolArrow = "Circle";
        break;
      case "Asociación":
        linkCategory = "association";
        break;
    }

    model.addLinkData({
      from: fromKey,
      to: toKey,
      rightText: `${'1..*'}`,
      category: linkCategory,
    });
  }
}