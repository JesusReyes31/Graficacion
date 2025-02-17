import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import * as go from 'gojs';

const $ = go.GraphObject.make;

@Component({
  selector: 'app-clases',
  imports: [],
  templateUrl: './clases.component.html',
  styleUrl: './clases.component.css'
})
export class ClasesComponent {
  public diagram: go.Diagram | null = null;
  
  @ViewChild('diagramDiv') diagramDiv!: ElementRef;
  

  constructor() {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.diagram = $(go.Diagram, this.diagramDiv.nativeElement, {
      'undoManager.isEnabled': true
    });

    // Definir la plantilla de nodos (clases)
    this.diagram.nodeTemplate = $(go.Node, 'Auto',
      { locationSpot: go.Spot.Center }, // Ubicación central
      $(go.Shape, 'Rectangle',
        { strokeWidth: 1, stroke: 'black', fill: 'lightgray', minSize: new go.Size(80, 60) }
      ),
      $(go.Panel, 'Table',
        { defaultRowSeparatorStroke: 'black' },

        // Nombre de la clase
        $(go.Panel, 'Auto', { row: 0, margin: 4 },
          $(go.TextBlock,
            { font: 'bold 16px sans-serif', editable: true, textAlign: 'center', stretch: go.GraphObject.Fill },
            new go.Binding('text', 'name').makeTwoWay()
          )
        ),

        // Atributos
        $(go.Panel, 'Auto', { row: 1, margin: 4 },
          $(go.TextBlock,
            { font: 'italic 12px sans-serif', editable: true, stretch: go.GraphObject.Fill },
            new go.Binding('text', 'attributes').makeTwoWay()
          )
        ),

        // Métodos
        $(go.Panel, 'Auto', { row: 2, margin: 4 },
          $(go.TextBlock,
            { font: 'italic 12px sans-serif', editable: true, stretch: go.GraphObject.Fill },
            new go.Binding('text', 'methods').makeTwoWay()
          )
        )
      )
    );

    // Definir la plantilla de enlaces (conexiones entre clases)
    this.diagram.linkTemplate = $(go.Link,
      { routing: go.Link.AvoidsNodes, curve: go.Link.JumpOver },
      $(go.Shape), // Línea del enlace
      $(go.Shape, { toArrow: 'OpenTriangle' }) // Flecha en el destino
    );

    // Inicializa el modelo con una clase y una relación
    this.diagram.model = new go.GraphLinksModel(
      [
        { key: 1, name: 'Clase1', 
          attributes: 'atributo1: tipo\natributo2: tipo',
          methods: 'metodo1(): tipo\nmetodo2(): tipo' },
        { key: 2, name: 'Clase2', 
          attributes: 'atributo1: tipo\natributo2: tipo',
          methods: 'metodo1(): tipo\nmetodo2(): tipo' }
      ],
      [
        { from: 1, to: 2 } // Conexión entre Clase1 y Clase2
      ]
    );
  }

  addClass(): void {
    if (!this.diagram) return;

    const model = this.diagram.model as go.GraphLinksModel;
    const newKey = model.nodeDataArray.length + 1;

    const newClass = {
      key: newKey,
      name: `Clase${newKey}`,
      attributes: 'atributo1: tipo\natributo2: tipo',
      methods: 'metodo1(): tipo\nmetodo2(): tipo'
    };

    model.addNodeData(newClass);

    const newNode = this.diagram.findNodeForKey(newKey);
    if (newNode) {
      newNode.location = new go.Point(Math.random() * 400, Math.random() * 300);
    }
  }

  connectClasses(): void {
    if (!this.diagram) return;
  
    const model = this.diagram.model as go.GraphLinksModel;
  
    // Obtener los nodos seleccionados
    const selectedNodes = this.diagram.selection.toArray().filter(node => node instanceof go.Node) as go.Node[];
  
    if (selectedNodes.length < 2) {
      alert('Selecciona al menos dos clases para conectarlas.');
      return;
    }
  
    // Obtener las claves de los últimos dos nodos seleccionados
    const fromKey = selectedNodes[selectedNodes.length - 2].data.key;
    const toKey = selectedNodes[selectedNodes.length - 1].data.key;
  
    // Agregar un enlace entre ellos
    model.addLinkData({ from: fromKey, to: toKey });
  }
  
  deleteClass(): void {
    if (!this.diagram) return;
  
    // Obtener el nodo seleccionado
    const selectedNode = this.diagram.selection.first();
    
    if (!(selectedNode instanceof go.Node)) {
      alert('Selecciona una clase para eliminar.');
      return;
    }
  
    const model = this.diagram.model as go.GraphLinksModel;
    
    // Obtener la clave del nodo seleccionado
    const nodeKey = selectedNode.data['key']; // Acceso seguro
  
    // Filtrar y eliminar todas las relaciones (enlaces) asociadas al nodo
    const linksToRemove = model.linkDataArray.filter(link => 
      link['from'] === nodeKey || link['to'] === nodeKey
    );
  
    linksToRemove.forEach(link => model.removeLinkData(link));
  
    // Eliminar el nodo seleccionado
    model.removeNodeData(selectedNode.data);
  }
}
