import { Component, ElementRef, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import * as go from 'gojs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CompartidoService } from '../services/compartido/compartido.service';
import { VersionesService } from '../services/versiones/versiones.service';

@Component({
  selector: 'app-cu',
  templateUrl: './cu.component.html',
  styleUrls: ['./cu.component.css'],
  imports: [FormsModule, CommonModule],
  standalone: true
})
export class CUComponent implements OnInit, AfterViewInit {
  @ViewChild('paletteDiv', { static: true }) paletteDiv!: ElementRef;
  @ViewChild('diagramDiv', { static: true }) diagramDiv!: ElementRef;
  relationshipMode = false; 
  relationshipType = ''; 
  diagram!: go.Diagram;
  // currentVersionId almacena el ID_V de la versión actual, pero en el select se mostrará su posición (1, 2, 3, …)
  currentVersionId!: number;
  versions: any[] = []; // Solo se guardarán versiones con ID_Tipo === 1
  ID_Proyecto = 0;
  projectId = '';
  versionData = {
    ID_V: 0,
    ID_Proyecto: 0,
    ID_Tipo: 1,
    json: ''
  };

  constructor(
    private toastr: ToastrService,
    private compartidoService: CompartidoService,
    private versionesService: VersionesService
  ) {
    this.projectId = sessionStorage.getItem('proyecto') || '';
    this.ID_Proyecto = parseInt(sessionStorage.getItem('ID_Proyecto') || '0');
    this.versionData.ID_Proyecto = this.ID_Proyecto;
  }

  ngOnInit() {
    // Cargar las versiones desde el backend
    this.loadVersions();
  }

  ngAfterViewInit() {
    this.initDiagram();
    this.initPalette();
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
    // this.diagram.scale = 0.6; // Ajusta el valor según el tamaño deseado

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
    
    // ['LayoutCompleted', 'SelectionMoved'].forEach(event => 
    //   this.diagram.addDiagramListener(event as go.DiagramEventName, () => this.preventOverlap())
    // );
    
    this.diagram.model.addChangedListener(e => { 
      if (e.isTransactionFinished) this.saveDiagram(); 
    });
  }
  
  // preventOverlap() {
  //   const nodes = this.diagram.nodes;
    
  //   nodes.each((node1: go.Node) => {
  //       nodes.each((node2: go.Node) => {
  //           if (node1 === node2 || node1.category !== node2.category) return;
            
  //           // No evitamos la superposición, solo los colocamos en la posición donde fueron agregados
  //           const node2Loc = node2.location.copy();
            
  //           this.diagram.startTransaction("place nodes");
  //           node2.move(node2Loc);
  //           this.diagram.commitTransaction("place nodes");
  //       });
  //   });
  // }
  
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
      { locationSpot: go.Spot.Center, movable: true, deletable: true, fromLinkable: true, toLinkable: true, width: 100 },
      new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
      $(go.Picture, { source: "assets/icons/icono.jpg", width: 64, height: 64, imageStretch: go.GraphObject.Uniform }),
      $(go.TextBlock, { name: 'ACTOR_LABEL', margin: 5, editable: true, font: "bold 12pt sans-serif", textAlign: "center", textEdited: textEditedHandler },
        new go.Binding("text").makeTwoWay()
      )
    ));
    
    map.add('usecase', $(go.Node, 'Auto', 
      { locationSpot: go.Spot.Center, movable: true, deletable: true, toLinkable: true, fromLinkable: true, resizable: true, minSize: new go.Size(50, 30) },
      new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
      new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),
      $(go.Shape, 'Ellipse', { fill: 'lightblue', stroke: 'black' }),
      $(go.TextBlock, 
        { name: "CULabel", margin: 5, editable: true, font: "bold 12pt sans-serif", textAlign: "center", wrap: go.TextBlock.WrapFit, desiredSize: new go.Size(100, NaN), textEdited: textEditedHandler }, 
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
      $(go.Shape, "Rectangle", { name: "SHAPE", fill: "#f4faff", stroke: "#336699", strokeWidth: 2, minSize: new go.Size(300, 200) }, 
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

  loadVersions() {
    this.versionesService.getVersiones(this.ID_Proyecto).subscribe(
      (data: any) => {
        // Si la respuesta tiene "message" o viene vacía, asumimos que no hay versiones.
        if (data.message || !data || data.length === 0) {
          this.versions = [];
        } else {
          // Filtrar solo las versiones de tipo 1
          this.versions = data.filter((v: any) => v.ID_Tipo === 1);
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
              this.versionData.ID_Tipo = 1;
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
    // Al crear nueva versión, siempre se crea del tipo 1
    this.versionData.ID_Tipo = 1;
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

  // Métodos para gestionar los modos de relación
  setRelationshipMode(type: string) {
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
