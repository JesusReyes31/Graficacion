import { Component, ElementRef, ViewChild } from '@angular/core';
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

  diagram!: go.Diagram;

  ngAfterViewInit() {
    this.initDiagram();
    this.initPalette();
    this.loadDiagram();
  }

  initDiagram() {
    const $ = go.GraphObject.make;
    this.diagram = $(go.Diagram, this.diagramDiv.nativeElement, {
      'undoManager.isEnabled': true,
      'draggingTool.dragsLink': true,
      'linkingTool.isEnabled': true,
      'linkingTool.direction':go.LinkingTool.ForwardsOnly,
      'animationManager.isEnabled': true
    });

    this.diagram.nodeTemplateMap = this.getNodeTemplateMap();
    this.diagram.linkTemplate = this.getLinkTemplate();

    this.diagram.model = new go.GraphLinksModel({
      linkKeyProperty: "key", // Necesario para gestionar enlaces únicos
    });

    // Evento para activar edición después de arrastrar un actor desde la paleta
    this.diagram.addDiagramListener('ExternalObjectsDropped', (e) => {
      e.subject.each((part: go.Part) => {
        if (part.category === 'actor') {
          this.diagram.commandHandler.editTextBlock(<go.TextBlock>part.findObject('ACTOR_LABEL'));
        } else if (part.category === 'usecase') {
          this.diagram.commandHandler.editTextBlock(<go.TextBlock>part.findObject('CULabel'));
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
    const palette = $(go.Palette, this.paletteDiv.nativeElement, {
      nodeTemplateMap: this.getNodeTemplateMap(),
      model: new go.GraphLinksModel([
        { category: 'actor', text: 'Actor' },
        { category: 'usecase', text: 'Caso de Uso' },
        {category:'area'}
      ])
    });
  }

  getNodeTemplateMap(): go.Map<string, go.Node> {
    const $ = go.GraphObject.make;
    const map = new go.Map<string, go.Node>();

    map.set('actor',
      $(go.Node, 'Vertical',
        { locationSpot: go.Spot.Center, movable: true, deletable: true, fromLinkable:true,toLinkable:true },
        new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
        // Cabeza
        $(go.Shape, 'Circle', { width: 30, height: 30, fill: 'white', stroke: 'black' }),
    
        // Panel para el cuerpo y los brazos
        $(go.Panel, 'Vertical',
          $(go.Panel, 'Horizontal', // Brazos alineados con el cuerpo
            $(go.Shape, { geometryString: "M0 0 L-15 0", stroke: "black", strokeWidth: 2 }), // Brazo izquierdo
            $(go.Shape, { geometryString: "M0 0 L0 30", stroke: "black", strokeWidth: 2 }),  // Cuerpo
            $(go.Shape, { geometryString: "M0 0 L15 0", stroke: "black", strokeWidth: 2 }),  // Brazo derecho
          )
        ),    
        // Piernas (Dos líneas diagonales)
        $(go.Panel, 'Horizontal',
          $(go.Shape, { geometryString: "M0 0 L-10 15", stroke: "black", strokeWidth: 2 }), // Pierna izquierda
          $(go.Shape, { geometryString: "M0 0 L10 15", stroke: "black", strokeWidth: 2 })  // Pierna derecha
        ),
        // Etiqueta del Actor (Texto editable)
        $(go.TextBlock,
          { 
            name: 'ACTOR_LABEL',  // Para identificarlo y activarlo con código
            margin: 5, 
            editable: true, 
            font: "bold 12pt sans-serif" 
          },
          new go.Binding("text").makeTwoWay()
        )
      )
    );
    
    

    // **Caso de Uso (Óvalo)**
    map.set('usecase',
      $(go.Node, 'Auto',
        { locationSpot: go.Spot.Center, movable: true, deletable: true, toLinkable:true, fromLinkable: false,resizable:true,minSize: new go.Size(50, 30)},
        new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
        new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),
        $(go.Shape, 'Ellipse', 
          { fill: 'lightblue', stroke: 'black' } // ❌ Quitamos `width` y `height`
        ),
        $(go.TextBlock, 
          {
            name: "CULabel",
            margin: 5,  // Espacio alrededor del texto
            editable: true,
            font: "bold 12pt sans-serif",
            wrap: go.TextBlock.WrapFit, // 🔥 Permite saltos de línea automáticos
            textAlign: "center",  // Centrar texto
            desiredSize:new go.Size(100,NaN)
          },
          new go.Binding('text').makeTwoWay()
        )
      )
    );
    

    map.set('area',
      $(go.Node, 'Auto',
        {
          layerName:"Background",
          resizable: true, // Permite redimensionar
          resizeObjectName: "SHAPE", // Define qué objeto se redimensiona
          locationSpot: go.Spot.Center, // Ajusta el punto de referencia
          deletable: true, // Se puede eliminar
          movable: true, // Se puede mover  
        },
        new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
        new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),
        $(go.Shape, 'Rectangle', 
          {
            name: "SHAPE", // Identificador para redimensionar
            width: 150, 
            height: 100, 
            fill: 'transparent', 
            stroke: 'black', 
            strokeWidth: 2,
            stretch: go.GraphObject.Fill
          },
          new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),
          // new go.Binding("width", "size", s => s.width),
          // new go.Binding("height", "size", s => s.height),
        ), 
      )
    );

    return map;
  }
  getLinkTemplate(): go.Link {
    const $ = go.GraphObject.make;
    return $(go.Link,
      { routing: go.Link.Orthogonal, curve: go.Link.JumpOver, reshapable: true }, // 🔹 Línea recta con efecto de "saltar" sobre otras líneas
      $(go.Shape, { stroke: "black", strokeWidth: 2 }), // 🔹 Línea de conexión
      $(go.Shape, { toArrow: "OpenTriangle", stroke: "black", fill: "white" }) // 🔹 Flecha al final
    );
  }

  saveDiagram() {
    // console.log("Se Guardó")
    if (this.diagram) {
      const json = this.diagram.model.toJson();
      localStorage.setItem("umlDiagram", json);
      // console.log("Diagrama guardado:", json);
    }
  }

  loadDiagram() {
    const savedData = localStorage.getItem("umlDiagram");
    // console.log("Cargando diagrama desde localStorage:", savedData);
    
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
  
      // console.log("Diagrama cargado correctamente");
    }
  }
  

  // constructor() { }

  // ngOnInit(): void {
  //   this.initializeDiagram();
  // }

  // private initializeDiagram(): void {
  //   const $ = go.GraphObject.make;

  //   const diagram = $(go.Diagram, "myDiagramDiv", {
  //     "undoManager.isEnabled": true, // Habilitar deshacer
  //   });
    
  //   // Crear el modelo del diagrama con nodos y enlaces
  //   diagram.nodeTemplate =
  //   $(go.Node, "Auto",
  //     $(go.Shape, "Ellipse", { width: 100, height: 100, fill: "lightblue" }),
  //     $(go.TextBlock, { margin: 10 }, new go.Binding("text", "key"))
  //   );

  //   diagram.linkTemplate =
  //     $(go.Link, { routing: go.Link.Orthogonal, corner: 10 },
  //       $(go.Shape, { strokeWidth: 3, stroke: "#f8c300" }), // Flecha
  //       $(go.Shape, { toArrow: "Standard", stroke: "#f8c300", fill: "#f8c300" })  // Flecha al final
  //     );

  //   diagram.model = new go.GraphLinksModel(
  //     [{ key: "Node1" }, { key: "Node2" }],
  //     [{ from: 0, to: 1 }]
  //   );


    //  // Crear la paleta lateral
    // const palette = $(go.Palette, "paletteDiv", {
    //   nodeTemplate:
    //     $(go.Node, "Auto",
    //       $(go.Shape, "Ellipse", { width: 100, height: 100, fill: "lightblue" }),
    //       $(go.TextBlock, { margin: 10 }, new go.Binding("text", "key"))
    //     ),
    // });

    // // Modelo de la paleta
    // palette.model = new go.GraphLinksModel([
    //   { key: "Circle", shape: "Ellipse", fill: "lightblue", width: 100, height: 100 }, // Círculo
    //   { key: "Square", shape: "Rectangle", fill: "lightgreen", width: 80, height: 80 }, // Cuadrado
    //   { key: "Rectangle", shape: "Rectangle", fill: "lightyellow", width: 100, height: 50 }, // Rectángulo
    //   { key: "Oval", shape: "Ellipse", fill: "lightcoral", width: 120, height: 60 }, // Óvalo
    //   { key: "Arrow", shape: "Arrow", fill: "lightblue", width: 120, height: 40 }, // Flecha
    // ]);

    // // Asignar diferentes formas a los nodos en la paleta
    // palette.nodeTemplateMap.add("Circle",  
    //   $(go.Node, "Auto",
    //     $(go.Shape, "Ellipse", { width: 100, height: 100, fill: "lightblue" }),
    //     $(go.TextBlock, { margin: 10 }, new go.Binding("text", "key"))
    //   )
    // );

    // palette.nodeTemplateMap.add("Square",  
    //   $(go.Node, "Auto",
    //     $(go.Shape, "Rectangle", { width: 80, height: 80, fill: "lightgreen" }),
    //     $(go.TextBlock, { margin: 10 }, new go.Binding("text", "key"))
    //   )
    // );

    // palette.nodeTemplateMap.add("Rectangle",  
    //   $(go.Node, "Auto",
    //     $(go.Shape, "Rectangle", { width: 100, height: 50, fill: "lightyellow" }),
    //     $(go.TextBlock, { margin: 10 }, new go.Binding("text", "key"))
    //   )
    // );

    // palette.nodeTemplateMap.add("Oval",  
    //   $(go.Node, "Auto",
    //     $(go.Shape, "Ellipse", { width: 120, height: 60, fill: "lightcoral" }),
    //     $(go.TextBlock, { margin: 10 }, new go.Binding("text", "key"))
    //   )
    // );

    // palette.nodeTemplateMap.add("Arrow",  
    //   $(go.Node, "Auto",
    //     $(go.Shape, "Arrow", { width: 120, height: 40, fill: "lightblue" }),
    //     $(go.TextBlock, { margin: 10 }, new go.Binding("text", "key"))
    //   )
    // );
    // // Asignar el modelo de datos a la paleta
    // palette.model = new go.GraphLinksModel([
    //   { key: "Circle" }, 
    //   { key: "Square" }, 
    //   { key: "Rectangle" }, 
    //   { key: "Oval" },
    //   { key: "Arrow" }
    // ]);

    // Habilitar la paleta para que los usuarios puedan arrastrar formas a la zona del diagrama
    // diagram.toolManager.linkingTool.isEnabled = false;  // Deshabilitar herramientas de enlace (si no las necesitas)
    // diagram.toolManager.relinkingTool.isEnabled = false; // Deshabilitar herramientas de reconexión de enlaces

    // // Modelo de datos: actores y casos de uso
    // diagram.model = new go.GraphLinksModel(
    //   // Nodos (actores y casos de uso)
    //   [
    //     { key: 1, text: "Actor 1", category: "actor" },
    //     { key: 2, text: "Actor 2", category: "actor" },
    //     { key: 3, text: "Login", category: "useCase" },
    //     { key: 4, text: "Register", category: "useCase" },
    //     { key: 5, text: "Search", category: "useCase" }
    //   ],
    //   // Enlaces (relaciones entre actores y casos de uso)
    //   [
    //     { from: 1, to: 2 },

    //   ]
    // );
  // }
}
