import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import * as go from 'gojs';

@Component({
  selector: 'app-paquetes',
  imports: [],
  templateUrl: './paquetes.component.html',
  styleUrl: './paquetes.component.css'
})
export class PaquetesComponent {
  @ViewChild('myDiagramDiv', { static: false }) diagramRef!: ElementRef;
  private diagram!: go.Diagram;

  ngAfterViewInit(): void {
    this.initDiagram();
  }

  private initDiagram(): void {
    const $ = go.GraphObject.make;

    this.diagram = $(go.Diagram, 'myDiagramDiv', {
      initialContentAlignment: go.Spot.Center,
      'undoManager.isEnabled': true,
      allowDrop: true,  // Permite arrastrar nodos entre grupos
      layout: $(go.GridLayout, { wrappingColumn: 1, spacing: new go.Size(50, 50) }) // Distribución automática de nodos
    });

    this.diagram.nodeTemplate =
      $(go.Node, 'Auto',
        { 
          selectable: true, resizable: true,
          portId: '', // Todo el nodo actúa como puerto
          doubleClick: (e, obj) => this.renameElement(obj)
        },
        $(go.Shape, 'Rectangle', { fill: 'lightblue', stroke: 'black', name: 'BODY' }),
        $(go.Panel, 'Vertical',
          $(go.Panel, 'Horizontal',
            $(go.Shape, 'Rectangle', { fill: 'lightgray', stroke: 'black', desiredSize: new go.Size(20,20) }),
            $(go.TextBlock, 'Package', { margin: new go.Margin(0, 0, 0, 2), font: 'bold 12px sans-serif' },
              new go.Binding('text', 'name'))
          ),
          $(go.Shape, 'LineH', { stroke: 'black', strokeWidth: 1 })
        )
      );

    this.diagram.groupTemplate =
      $(go.Group, 'Auto',
        {
          isShadowed: true,
          selectable: true,
          resizable: true,
          layout: $(go.GridLayout, { wrappingColumn: 1, spacing: new go.Size(20, 20) }), // Ajuste automático de tamaño
          portId: '',
          doubleClick: (e, obj) => this.renameElement(obj)
        },
        $(go.Shape, 'Rectangle', { fill: 'lightblue', stroke: 'black', name: 'BODY' }),
        $(go.Panel, 'Vertical',
          $(go.Panel, 'Horizontal',
            $(go.Shape, 'Rectangle', { fill: 'lightgray', stroke: 'black', desiredSize: new go.Size(20,20) }),
            $(go.TextBlock, 'Package', { margin: new go.Margin(0, 0, 0, 2), font: 'bold 12px sans-serif' },
              new go.Binding('text', 'name'))
          ),
          $(go.Shape, 'LineH', { stroke: 'black', strokeWidth: 1 }),
          $(go.Placeholder, { padding: 5 })
        )
      );

    this.diagram.linkTemplate = $(go.Link,
      { routing: go.Link.AvoidsNodes, curve: go.Link.JumpOver, corner: 5 },
      $(go.Shape, { stroke: 'black', strokeDashArray: [4, 2] }),
      $(go.Shape, { toArrow: 'OpenTriangle' })
    );

    this.diagram.model = new go.GraphLinksModel();
  }

  addPackage(): void {
    const newKey = Date.now();
    const newGroup = { key: newKey, name: 'Nuevo Paquete', isGroup: true, loc: `${Math.random() * 400} ${Math.random() * 400}` };
    (this.diagram.model as go.GraphLinksModel).addNodeData(newGroup);
  }
  
  addSubPackage(): void {
    const selected = this.diagram.selection.first();
    if (selected && (selected instanceof go.Group)) {
      const newKey = Date.now();
      const newNode = { key: newKey, name: 'Nuevo Subpaquete', group: selected.data.key };
      (this.diagram.model as go.GraphLinksModel).addNodeData(newNode);
      selected.ensureBounds(); // Ajustar tamaño del grupo
    } else {
      alert('Seleccione un paquete (grupo) para agregar un subpaquete.');
    }
  }

  renameElement(obj: go.GraphObject): void {
    const part = obj.part;
    if (part !== null) {
      const currentName = part.data.name;
      const newName = prompt('Renombrar paquete:', currentName);
      if (newName !== null && newName.trim() !== '') {
        this.diagram.model.setDataProperty(part.data, 'name', newName);
      }
    }
  }

  deleteSelected(): void {
    this.diagram.commandHandler.deleteSelection();
  }

  createRelationship(): void {
    const selectedNodes = this.diagram.selection.toArray();
    if (selectedNodes.length === 2) {
      const [fromNode, toNode] = selectedNodes;
      if (fromNode instanceof go.Node && toNode instanceof go.Node) {
        (this.diagram.model as go.GraphLinksModel).addLinkData({ from: fromNode.data.key, to: toNode.data.key });
      }
    } else {
      alert('Seleccione exactamente dos paquetes para crear una relación.');
    }
  }

  deleteRelationship(): void {
    this.diagram.commandHandler.deleteSelection();
  }

  saveDiagram(): void {
    const json = this.diagram.model.toJson();
    localStorage.setItem('umlDiagram', json);
  }

  loadDiagram(): void {
    const json = localStorage.getItem('umlDiagram');
    if (json) {
      this.diagram.model = go.Model.fromJson(json);
    }
  }
}