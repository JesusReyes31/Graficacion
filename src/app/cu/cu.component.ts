import { Component } from '@angular/core';
import * as go from 'gojs';

@Component({
  selector: 'app-cu',
  imports: [],
  templateUrl: './cu.component.html',
  styleUrl: './cu.component.css'
})
export class CUComponent {
  constructor() { }

  ngOnInit(): void {
    this.initializeDiagram();
  }

  private initializeDiagram(): void {
    const $ = go.GraphObject.make;

    const diagram = $(go.Diagram, "myDiagramDiv", {
      "undoManager.isEnabled": true, // Habilitar deshacer
    });
    
    // Crear el modelo del diagrama con nodos y enlaces
    diagram.nodeTemplate =
    $(go.Node, "Auto",
      $(go.Shape, "Ellipse", { width: 100, height: 100, fill: "lightblue" }),
      $(go.TextBlock, { margin: 10 }, new go.Binding("text", "key"))
    );

    diagram.linkTemplate =
      $(go.Link, { routing: go.Link.Orthogonal, corner: 10 },
        $(go.Shape, { strokeWidth: 3, stroke: "#f8c300" }), // Flecha
        $(go.Shape, { toArrow: "Standard", stroke: "#f8c300", fill: "#f8c300" })  // Flecha al final
      );

    diagram.model = new go.GraphLinksModel(
      [{ key: "Node1" }, { key: "Node2" }],
      [{ from: 0, to: 1 }]
    );


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
  }
}
