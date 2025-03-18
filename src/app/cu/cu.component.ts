import { Component, ElementRef, ViewChild } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import * as go from 'gojs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cu',
  templateUrl: './cu.component.html',
  styleUrls: ['./cu.component.css'],
  imports: [FormsModule, CommonModule],
  standalone: true
})
export class CUComponent {
  @ViewChild('paletteDiv', { static: true }) paletteDiv!: ElementRef;
  @ViewChild('diagramDiv', { static: true }) diagramDiv!: ElementRef;
  relationshipMode = false; 
  relationshipType = ''; 
  diagram!: go.Diagram;
  currentVersion = '1.0';
  versions: string[] = [];
  projectId = '';

  constructor(private toastr: ToastrService) {
    this.projectId = sessionStorage.getItem('proyecto') || '';
    this.loadVersions();
  }

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
      'linkingTool.direction': go.LinkingTool.ForwardsOnly,
      'animationManager.isEnabled': true,
      "draggingTool.isGridSnapEnabled": true,
      "grid.visible": false,
      "layout.isOngoing": false,
      "layout.isInitial": false
    });

    this.diagram.nodeTemplateMap = this.getNodeTemplateMap();
    this.diagram.groupTemplate = this.getGroupTemplate();
    this.diagram.linkTemplateMap = this.getLinkTemplateMap();
    this.diagram.model = new go.GraphLinksModel({ linkKeyProperty: "key" });

    this.diagram.addDiagramListener('LinkDrawn', () => this.disableRelationshipMode());
    this.diagram.addDiagramListener('ExternalObjectsDropped', e => {
      let CU = false;
      e.subject.each((part: go.Node) => {
        if (part instanceof go.Node && part.category === "usecase" && part.containingGroup === null) {
          this.diagram.remove(part);
          this.toastr.error("Los casos de uso deben colocarse dentro de un área.");
          CU = true;
        }
      });

      e.subject.each((part: go.Part) => {
        if (part.category === 'actor') {
          this.diagram.commandHandler.editTextBlock(<go.TextBlock>part.findObject('ACTOR_LABEL'));
        } else if (part.category === 'usecase' && !CU) {
          this.diagram.commandHandler.editTextBlock(<go.TextBlock>part.findObject('CULabel'));
        } else if (part instanceof go.Group && part.category === 'area') {
          const nameBlock = part.findObject('GROUP_LABEL');
          if (nameBlock instanceof go.TextBlock) {
            this.diagram.commandHandler.editTextBlock(nameBlock);
          }
        }
      });
    });
    
    ['LayoutCompleted', 'SelectionMoved'].forEach(event => 
      this.diagram.addDiagramListener(event as go.DiagramEventName, () => this.preventOverlap())
    );
    
    this.diagram.model.addChangedListener(e => { 
      if (e.isTransactionFinished) this.saveDiagram(); 
    });
  }
  
  preventOverlap() {
    const nodes = this.diagram.nodes;
    const movedNodes = new Set<go.Node>();
    
    nodes.each((node1: go.Node) => {
      if (movedNodes.has(node1)) return;
      
      nodes.each((node2: go.Node) => {
        if (node1 === node2 || movedNodes.has(node2) || node1.category !== node2.category) return;
        
        const rect1 = node1.actualBounds, rect2 = node2.actualBounds;
        
        if (rect1.intersectsRect(rect2)) {
          const dx = Math.abs(rect1.centerX - rect2.centerX);
          const dy = Math.abs(rect1.centerY - rect2.centerY);
          const node2Loc = node2.location.copy();
          
          if (dx < dy) {
            node2Loc.x += (rect1.centerX < rect2.centerX) ? rect1.width + 20 : -(rect1.width + 20);
          } else {
            node2Loc.y += (rect1.centerY < rect2.centerY) ? rect1.height + 20 : -(rect1.height + 20);
          }
          
          this.diagram.startTransaction("move to avoid overlap");
          node2.move(node2Loc);
          this.diagram.commitTransaction("move to avoid overlap");
          movedNodes.add(node2);
        }
      });
    });
  }
  
  initPalette() {
    const $ = go.GraphObject.make;
    const areaPaletteTemplate = 
      $(go.Group, "Vertical", { background: "transparent", layerName: "Background", computesBoundsAfterDrag: true, movable: false, alignment: go.Spot.Center},
      $(go.TextBlock, { name: "GROUP_LABEL", alignment: go.Spot.Center, margin: 5, editable: false, font: "bold 12pt sans-serif", textAlign: "center" },
        new go.Binding("text", "nombre")
      ),
      $(go.Panel, "Auto",
        $(go.Shape, "Rectangle", {fill: "#f4faff", stroke: "#336699", strokeWidth: 2, minSize: new go.Size(150, 100)}),
        $(go.Placeholder, { padding: 10 })
      )
    );
  
    $(go.Palette, this.paletteDiv.nativeElement, {
      nodeTemplateMap: this.getNodeTemplateMap(),
      groupTemplateMap: new go.Map<string, go.Group>().add("area", areaPaletteTemplate),
      initialContentAlignment: go.Spot.Center,
      contentAlignment: go.Spot.Center,
      model: new go.GraphLinksModel([
        { category: 'actor', text: 'Actor' }, 
        { category: 'usecase', text: 'Caso de Uso' },
        { category: 'area', isGroup: true, nombre: 'Área del sistema' }
      ])
    });
  }
  
  getNodeTemplateMap(): go.Map<string, go.Node> {
    const $ = go.GraphObject.make;
    const textEditedHandler = (tb: go.TextBlock) => { if (tb.text.trim() === "") tb.text = "-"; };
    const map = new go.Map<string, go.Node>();
    
    map.add('actor', $(go.Node, 'Vertical', 
      {locationSpot: go.Spot.Center, movable: true, deletable: true,fromLinkable: true, toLinkable: true, width: 100},
      new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
      $(go.Picture, { source: "assets/icons/icono.jpg", width: 64, height: 64, imageStretch: go.GraphObject.Uniform}),
      $(go.TextBlock, { name: 'ACTOR_LABEL', margin: 5, editable: true, font: "bold 12pt sans-serif", textAlign: "center", textEdited: textEditedHandler },
        new go.Binding("text").makeTwoWay()
      )
    ));
    
    map.add('usecase', $(go.Node, 'Auto', 
      { locationSpot: go.Spot.Center, movable: true, deletable: true, toLinkable: true, fromLinkable: true, resizable: true, minSize: new go.Size(50, 30)},
      new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
      new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),
      $(go.Shape, 'Ellipse', { fill: 'lightblue', stroke: 'black' }),
      $(go.TextBlock, 
        { name: "CULabel", margin: 5, editable: true, font: "bold 12pt sans-serif", textAlign: "center", wrap: go.TextBlock.WrapFit, desiredSize: new go.Size(100, NaN),textEdited: textEditedHandler}, 
        new go.Binding('text').makeTwoWay()
      )
    ));
    
    return map;
  }
  
  getGroupTemplate(): go.Group {
    const $ = go.GraphObject.make;
    return $(go.Group, "Vertical", { isSubGraphExpanded: true, movable: true, computesBoundsAfterDrag: true, handlesDragDropForMembers: true, memberValidation: (_, node) => node.category === "usecase",
      mouseDrop: (e, grp) => {
        const diagram = grp.diagram;
        if (!diagram || (diagram.currentTool as any).doingDragSelecting) return;
        e.handled = true;
        const group = grp as go.Group;
        diagram.model.startTransaction("grouping");
        diagram.selection.each((part: go.Part) => {
          if (part instanceof go.Node && part.category === "usecase") {
            diagram.model.setDataProperty(part.data, "group", group.data.key);
          }
        });
        diagram.model.commitTransaction("grouping");
      }
    },
    $(go.TextBlock, { name: "GROUP_LABEL", alignment: go.Spot.Top, margin: 8, editable: true, font: "bold 12pt sans-serif",
      textEdited: (tb) => { if (tb.text.trim() === "") tb.text = "-"; }
    }, new go.Binding("text", "nombre").makeTwoWay()),
    $(go.Panel, "Auto",
      $(go.Shape, "Rectangle", { name: "SHAPE", fill: "#f4faff", stroke: "#336699", strokeWidth: 2, minSize: new go.Size(300, 200)}, 
      new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify)),
      $(go.Placeholder, { padding: 20, alignment: go.Spot.TopLeft })
    ));
  }
  
  // Mapa de plantillas de enlaces para diferentes tipos de relaciones
  getLinkTemplateMap(): go.Map<string, go.Link> {
    const $ = go.GraphObject.make;
    const commonLinkProps = { 
      routing: go.Link.Orthogonal, reshapable: true, resegmentable: false, 
      relinkableTo: true, relinkableFrom: true, corner: 5, selectable: true 
    };
    
    // Crear el mapa de plantillas de enlaces
    const linkMap = new go.Map<string, go.Link>();
    
    // Asociación
    linkMap.add("association", $(go.Link, commonLinkProps, 
      $(go.Shape, { stroke: "gray", strokeWidth: 2 }),
      new go.Binding("points").makeTwoWay()
    ));
    
    // Include
    linkMap.add("include", $(go.Link, commonLinkProps, 
      $(go.Shape, { stroke: "green", strokeWidth: 2, strokeDashArray: [4, 2] }),
      $(go.Shape, { toArrow: "OpenTriangle", stroke: "green", fill: "white", strokeWidth: 2 }),
      $(go.Panel, "Auto",
        $(go.Shape, "RoundedRectangle", { fill: "white", stroke: "green" }),
        $(go.TextBlock, "«include»", { font: "10pt sans-serif", stroke: "green", margin: 3 })
      ),
      new go.Binding("points").makeTwoWay()
    ));
    
    // Extend
    linkMap.add("extend", $(go.Link, commonLinkProps, 
      $(go.Shape, { stroke: "blue", strokeWidth: 2, strokeDashArray: [4, 2] }),
      $(go.Shape, { toArrow: "OpenTriangle", stroke: "blue", fill: "white", strokeWidth: 2 }),
      $(go.Panel, "Auto",
        $(go.Shape, "RoundedRectangle", { fill: "white", stroke: "blue" }),
        $(go.TextBlock, "«extend»", { font: "10pt sans-serif", stroke: "blue", margin: 3 })
      ),
      new go.Binding("points").makeTwoWay()
    ));
    
    // Generalización
    linkMap.add("generalization", $(go.Link, commonLinkProps, 
      $(go.Shape, { stroke: "black", strokeWidth: 2 }),
      $(go.Shape, { toArrow: "Triangle", stroke: "black", fill: "white", strokeWidth: 2 }),
      new go.Binding("points").makeTwoWay()
    ));
    
    return linkMap;
  }

  // Gestión de versiones
  loadVersions() {
    const versionsKey = `DiagramCUVersions_${this.projectId}`;
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
    
    localStorage.setItem(`DiagramCUVersions_${this.projectId}`, JSON.stringify(this.versions));
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
        `DiagramCU_${this.projectId}_v${this.currentVersion}`, 
        this.diagram.model.toJson()
      );
    }
  }

  // Métodos para gestionar los modos de relación
  setRelationshipMode(type: string) {
    // Desactivar el modo actual si es el mismo
    if (this.relationshipType === type && this.relationshipMode) {
      this.disableRelationshipMode();
      return;
    }
    
    this.relationshipType = type;
    this.relationshipMode = true;
    this.diagram.toolManager.linkingTool.isEnabled = true;
    
    const linkingTool = this.diagram.toolManager.linkingTool;
    linkingTool.isEnabled = true;
    linkingTool.archetypeLinkData = { category: type };
    
    // Configurar validaciones según el tipo
    switch (type) {
      case 'association':
        linkingTool.linkValidation = (from, _, to) => 
          (from.category === 'actor' && to.category === 'usecase') || 
          (from.category === 'usecase' && to.category === 'actor');
        this.toastr.info('Modo de asociación activado: Conecta actores con casos de uso');
        break;
         
      case 'include':
      case 'extend':
        linkingTool.linkValidation = (from, _, to) => 
          from.category === 'usecase' && to.category === 'usecase' && from !== to;
        this.toastr.info(`Modo de ${type === 'include' ? 'inclusión' : 'extensión'} activado: Conecta casos de uso con otros casos de uso`);
        break;
         
      case 'generalization':
        linkingTool.linkValidation = (from, _, to) => 
          from.category === to.category && from !== to;
        this.toastr.info('Modo de generalización activado: Conecta actores con actores o casos de uso con casos de uso');
        break;
    }
  }
  
  disableRelationshipMode() {
    this.relationshipMode = false;
    this.relationshipType = '';
    this.diagram.toolManager.linkingTool.isEnabled = false;
    this.toastr.info('Modo de relación desactivado');
  }

  loadDiagram() {
    const savedData = localStorage.getItem(`DiagramCU_${this.projectId}_v${this.currentVersion}`);
    if (savedData) {
      const model = go.Model.fromJson(savedData) as go.GraphLinksModel;
      model.linkKeyProperty = "key";
      this.diagram.model = model;
      this.diagram.model.addChangedListener(e => { if (e.isTransactionFinished) this.saveDiagram(); });
    }
  }
}
