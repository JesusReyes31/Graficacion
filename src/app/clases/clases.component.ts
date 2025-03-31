import { CommonModule } from '@angular/common';
import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as go from 'gojs';
import { Toast, ToastrService } from 'ngx-toastr';
import { VersionesService } from '../services/versiones/versiones.service';


interface Parameter {
  paramName: string;
  paramType: string;
}

interface Method {
  visibility: string;
  name: string;
  parameters: Parameter[];
  type: string;
}

interface NodeData {
  methods: Method[];
}

@Component({
  selector: 'app-clases',
  templateUrl: './clases.component.html',
  styleUrls: ['./clases.component.css'],
  imports: [FormsModule, CommonModule],
  standalone: true
})

export class ClasesComponent implements AfterViewInit {
  diagram!: go.Diagram;
  currentVersionId!: number;
  versions: any[] = []; // Solo se guardarán versiones con ID_Tipo === 5
  ID_Proyecto = 0;
  projectId = '';
  versionData = {
    ID_V: 0,
    ID_Proyecto: 0,
    ID_Tipo: 5,
    json: ''
  };
  @ViewChild('diagramDiv') diagramDiv!: ElementRef;
  @ViewChild('paletteDiv') paletteDiv!: ElementRef;

  selectedMultiplicity: string = '1..*';

  constructor(private toastr:ToastrService, private versionesService: VersionesService) {
    this.projectId = sessionStorage.getItem('proyecto') || '';
    this.ID_Proyecto = parseInt(sessionStorage.getItem('ID_Proyecto') || '0');
    this.versionData.ID_Proyecto = this.ID_Proyecto;
  }

  ngOnInit(): void {
    this.loadVersions();
  }

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
    (this.diagram.model as go.GraphLinksModel).nodeCategoryProperty = "category";
    this.diagram.model.addChangedListener(e => { 
      if (e.isTransactionFinished) this.saveDiagram(); 
    });
  }
  

  initPalette(): void {
    const $ = go.GraphObject.make;
    $(go.Palette, this.paletteDiv.nativeElement, {
      nodeTemplateMap: this.createNodeTemplates($),    // Plantillas de nodos (para clases)
      groupTemplateMap: this.createGroupTemplates($),  // Plantillas de grupos (para paquetes)
      initialContentAlignment: go.Spot.Center,
      model: new go.GraphLinksModel([
        { category: "classWithAttributesAndMethods", name: "Clase",
          properties: [{ visibility: "-", name: "atributo", type: "tipo", default: null, scope: "instance" }],
          methods: [{ visibility: "+", name: "metodo", parameters: [{ paramName: "par", paramType: "tipo" }],type: "tipo" }]},
      ])
    });
  }
  

  createNodeTemplates($: any): go.Map<string, go.Node> {
    const commonNodeProps = { locationSpot: go.Spot.Center, movable: true, deletable: true, resizable: true, minSize: new go.Size(100, 50)};
    // Funciones auxiliares para los templates
    const textEditedHandler = (tb: go.TextBlock) => { if (tb.text.trim() === "") tb.text = "-"; };
    
    const toggleVisibility = (e: go.InputEvent, obj: go.GraphObject) => { 
      const panel = obj.panel;
      if (!panel || !panel.part || !panel.part.diagram) return;
      
      const data = panel.data;
      if (!data || !data.hasOwnProperty("visibility")) return;
      
      // Ciclo de visibilidad: +, -, #, espacio
    let newVisibility = "+";
    if (data.visibility === "+") newVisibility = "-";
    else if (data.visibility === "-") newVisibility = "#";
      else if (data.visibility === "#") newVisibility = " ";
      
      const part = panel.part;
      if (!part || !part.diagram) return;
      
      part.diagram.model.commit(m => {
        m.set(data, "visibility", newVisibility);
        if (part.data.methods) {
          m.set(part.data, "methods", [...part.data.methods]);
        }
        if (part.data.attributes) {
          m.set(part.data, "attributes", [...part.data.attributes]);
        }
      }, "toggle visibility");
    };
    
    const addNewAttribute = (e: go.InputEvent, obj: go.GraphObject) => {
      const node = obj.panel?.part;
      if (!node || !node.diagram) return;
      
      const data = node.data;
      if (!data || !Array.isArray(data.properties)) return;
      
      node.diagram.model.commit(m => {
        m.set(data, "properties", [...data.properties, {visibility: "+", name: "Atributo", type: "tipo", default: null, scope: "instance"}]);
      }, "added attribute");
    };
    
    const addNewMethod = (e: go.InputEvent, obj: go.GraphObject) => {
      const node = obj.panel?.part;
      if (!node || !node.diagram) return;
      
      const data = node.data;
      if (!data || !Array.isArray(data.methods)) return;
      
      node.diagram.model.commit(m => {
        m.set(data, "methods", [...data.methods, { visibility: "+", name: "Metodo",  parameters: [{ paramName: "par", paramType: "tipo" }],  type: "tipo"}]);
      }, "added method");
    };
    
    const addNewParameter = (e: go.InputEvent, obj: go.GraphObject) => {
      const methodPanel = obj.panel;
      if (!methodPanel || !methodPanel.part) return;
      
      const node = methodPanel.part;
      const data = node.data as NodeData;
      if (!data || !Array.isArray(data.methods)) return;
      
      const methodData = methodPanel.data as Method;
      if (!methodData) return;
      
      const methodIndex = data.methods.findIndex(m => m === methodData);
      if (methodIndex === -1) return;
      
      node.diagram?.model.commit(m => {
        const updatedMethods = data.methods.map((method, index) =>
          index === methodIndex? { ...method, parameters: [...(method.parameters || []), { paramName: "par", paramType: "tipo" }] } : method
        );
        m.set(data, "methods", updatedMethods);
      }, "added parameter");
    };
    
    const removeAttribute = (e: go.InputEvent, obj: go.GraphObject) => {
      const panel = obj.panel;
      if (!panel || !panel.part || !panel.part.diagram) return;
      
      const data = panel.part.data;
      if (!data || !Array.isArray(data.properties)) return;
      
      const item = panel.data;
      if (!item) return;
      
      const updatedProperties = data.properties.filter((prop: any) => prop !== item);
      panel.part.diagram.model.commit(m => { m.set(data, "properties", updatedProperties);}, "removed attribute");
    };
    
    const removeMethod = (e: go.InputEvent, obj: go.GraphObject) => {
      const panel = obj.panel;
      if (!panel || !panel.part || !panel.part.diagram) return;
      
      const data = panel.part.data;
      if (!data || !Array.isArray(data.methods)) return;
      
      const item = panel.data;
      if (!item) return;
      
      const updatedMethods = data.methods.filter((method: any) => method !== item);
      panel.part.diagram.model.commit(m => { m.set(data, "methods", updatedMethods);}, "removed method");
    };

    // Templates para componentes reutilizables
    const propertyTemplate = new go.Panel('Horizontal')
      .add(
        go.GraphObject.build("Button", { click: toggleVisibility, margin: 4, width: 20, height: 20 })
          .add(new go.TextBlock().bind('text', 'visibility').set({ alignment: go.Spot.Center })),
        new go.TextBlock({ isMultiline: false, editable: true, textEdited: textEditedHandler })
          .bindTwoWay('text', 'name')
          .bind('isUnderline', 'scope', s => s[0] === 'c'),
        new go.TextBlock('').bind('text', 'type', t => t ? ': ' : ''),
        new go.TextBlock({ isMultiline: false, editable: true, textEdited: textEditedHandler })
          .bindTwoWay('text', 'type'),
        new go.TextBlock({ isMultiline: false, editable: false })
          .bind('text', 'default', s => s ? ' = ' + s : ''),
        go.GraphObject.build("Button", { margin: 4, click: removeAttribute, width: 20, height: 20 })
          .add(new go.TextBlock("X"))
      );

    const methodTemplate = new go.Panel('Horizontal')
      .add(
        go.GraphObject.build("Button", { click: toggleVisibility, margin: 4, width: 20, height: 20 })
          .add(new go.TextBlock().bind('text', 'visibility').set({ alignment: go.Spot.Center })),
        new go.TextBlock({ isMultiline: false, editable: true, textEdited: textEditedHandler })
          .bindTwoWay('text', 'name')
          .bind('isUnderline', 'scope', s => s[0] === 'c'),
        new go.Panel('Horizontal', { margin: 2 })
          .add(
            new go.TextBlock('('),
            new go.Panel('Horizontal', {
              itemTemplate: new go.Panel('Horizontal')
                .add(
                  new go.TextBlock({ isMultiline: false, editable: true, textEdited: textEditedHandler })
                    .bindTwoWay('text', 'paramName'),
                  new go.TextBlock(': '),
                  new go.TextBlock({ isMultiline: false, editable: true, textEdited: textEditedHandler })
                    .bindTwoWay('text', 'paramType'),
                  new go.TextBlock(',').bind('visible', 'parameters', (parameters, panel) => {
                    if (!parameters || !Array.isArray(parameters)) return false;
                    const parentPanel = panel.panel;
                    if (!parentPanel || !parentPanel.itemArray) return false;
                    const index = parentPanel.itemArray.indexOf(panel.data);
                    return index !== -1 && index < parentPanel.itemArray.length - 1;
                  })
                )
            }).bind('itemArray', 'parameters'),
            new go.TextBlock(')')
          ),
        go.GraphObject.build("Button", { margin: 4, click: addNewParameter, width: 20, height: 20 })
          .add(new go.TextBlock("+")),
        new go.TextBlock('').bind('text', 'type', t => t ? ': ' : ''),
        new go.TextBlock({ isMultiline: false, editable: true, textEdited: textEditedHandler })
          .bindTwoWay('text', 'type'),
        go.GraphObject.build("Button", { margin: 4, click: removeMethod, width: 20, height: 20 })
          .add(new go.TextBlock("X"))
      );

    // Template para clases con atributos y métodos
    const classWithAttributesAndMethodsTemplate = $(go.Node, "Auto", commonNodeProps,
      $(go.Shape, "Rectangle", { strokeWidth: 1, stroke: "black", fill: "white" }),
      $(go.Panel, "Table", { defaultRowSeparatorStroke: "black", stretch: go.GraphObject.Fill },
        $(go.Panel, "Auto", { row: 0, margin: 4 },
          $(go.TextBlock, { 
            font: "bold 16px sans-serif", isMultiline: false, editable: true, 
            textAlign: "center", stretch: go.GraphObject.Fill, minSize: new go.Size(100, 20) 
          }, new go.Binding("text", "name").makeTwoWay())
        ),
        // Panel de atributos
        $(go.Panel, "Vertical", { row: 1, margin: 4, stretch: go.Stretch.Horizontal, defaultAlignment: go.Spot.Left },
          new go.Panel('Vertical', { name: 'PROPERTIES', stretch: go.Stretch.Horizontal, defaultAlignment: go.Spot.Left, itemTemplate: propertyTemplate}).bind('itemArray', 'properties'),
          go.GraphObject.build("Button", { margin: 4, click: addNewAttribute })
            .add(new go.TextBlock("Agregar Atributo"))
        ),
        // Panel de métodos
        $(go.Panel, "Vertical", { row: 2, margin: 4, stretch: go.Stretch.Horizontal, defaultAlignment: go.Spot.Left },
          new go.Panel('Vertical', { name: 'METHODS', stretch: go.Stretch.Horizontal, defaultAlignment: go.Spot.Left, itemTemplate: methodTemplate}).bind('itemArray', 'methods'),
          go.GraphObject.build("Button", { margin: 4, click: addNewMethod })
            .add(new go.TextBlock("Agregar Método"))
        )
      )
    );

    return new go.Map<string, go.Node>().set("classWithAttributesAndMethods", classWithAttributesAndMethodsTemplate);
  }

  createGroupTemplates($: any): go.Map<string, go.Group> {
    const commonNodeProps = {locationSpot: go.Spot.Center,movable: true,deletable: true,resizable: true,minSize: new go.Size(160, 100)};
    // Plantilla para los paquetes (estilo visual personalizado)
    const packageTemplate = $(go.Group, "Auto", {
      ...commonNodeProps, layout: $(go.GridLayout, { wrappingColumn: 3, alignment: go.GridLayout.Position }), computesBoundsAfterDrag: true,
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
        $(go.Panel, 'Horizontal', { stretch: go.GraphObject.Horizontal, background: '#DCE8E8', padding: 5,},
          $('SubGraphExpanderButton', { margin: 5 }),
          $(go.TextBlock, { alignment: go.Spot.Left, font: 'Bold 12pt sans-serif', margin: 5, editable: true,minSize: new go.Size(80, 20)},new go.Binding('text', 'name').makeTwoWay())
        ),
        $(go.Placeholder, { padding: 10 }) // Contenedor para nodos hijos
      )
    );
  
    return new go.Map<string, go.Group>()
      .set("package", packageTemplate); // Registro en el mapa con categoría "package"
  }

  createLinkTemplates($: any): go.Map<string, go.Link> {
    const commonLinkProps = { routing: go.Link.AvoidsNodes, curve: go.Link.JumpOver, reshapable: true};

    // Función para crear templates de enlaces
    const createLinkTemplate = (stroke: string, toArrow: string, fill: string = "white", dashed: boolean = false) => {
      // Crear elementos base del enlace
      const elements = [
        $(go.Shape, { strokeWidth: 2,  stroke: stroke, strokeDashArray: dashed ? [4, 2] : null }),
        $(go.TextBlock, { textAlign: "center",  font: "bold 14px sans-serif",  margin: new go.Margin(4, 10, 4, 10),  editable: false, background: "white",  minSize: new go.Size(20, 20)}, 
        new go.Binding("text", "rightText").makeTwoWay())
      ];
      // Añadir la flecha solo si toArrow tiene un valor
      if (toArrow) {
        elements.splice(1, 0, $(go.Shape, { toArrow: toArrow, stroke: stroke, fill: fill, strokeWidth: 2 }));
      }
      // Crear y devolver el enlace con los elementos apropiados
      return $(go.Link, commonLinkProps, ...elements);
    };

    const linkMap = new go.Map<string, go.Link>();
    
    // Añadir todos los tipos de enlaces
    linkMap.add("multiplicity", createLinkTemplate("black", "", "yellow"));
    linkMap.add("association", createLinkTemplate("blue", "OpenTriangle"));
    linkMap.add("aggregation", createLinkTemplate("blue", "Diamond"));
    linkMap.add("composition", createLinkTemplate("blue", "Diamond", "blue"));
    linkMap.add("generalization", createLinkTemplate("blue", "Triangle"));
    linkMap.add("dependency", createLinkTemplate("black", "OpenTriangle", "white", true));
    linkMap.add("realization", createLinkTemplate("black", "Triangle", "white", true));
    linkMap.add("reflexiveAssociation", createLinkTemplate("blue", "OpenTriangle"));
    
    return linkMap;
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

  setMultiplicity(multiplicity: string): void {
    this.selectedMultiplicity = multiplicity;
    this.addMultiplicityLabel(multiplicity);
  }

  private addMultiplicityLabel(multiplicity: string): void {
    if (!this.diagram) return;
    const model = this.diagram.model as go.GraphLinksModel;
    const selectedLinks = this.diagram.selection.toArray().filter(part => part instanceof go.Link) as go.Link[];
    if (selectedLinks.length < 1) {
      this.toastr.info("Selecciona una relación para añadir la multiplicidad.");
      return;
    }
    model.startTransaction("update multiplicity");
    selectedLinks.forEach(link => {model.setDataProperty(link.data, "rightText", multiplicity);});
    model.commitTransaction("update multiplicity");
    this.toastr.success(`Multiplicidad ${multiplicity} añadida a la relación`);
  }

private createLink(relationshipType: string, symbol: string = "", dashed: boolean = false): void {
  if (!this.diagram) return;
  const model = this.diagram.model as go.GraphLinksModel;
  const selectedNodes = this.diagram.selection.toArray().filter(node => node instanceof go.Node) as go.Node[];
  if (selectedNodes.length < 2 && relationshipType !== "Asociación Reflexiva") {
    this.toastr.info("Selecciona al menos dos clases para conectarlas.");
    return;
  }
  if (selectedNodes.length < 1 && relationshipType === "Asociación Reflexiva") {
    this.toastr.info("Selecciona solo 1 clase para conectarla.");
    return;
  }
  const fromKey = relationshipType === "Asociación Reflexiva" ? selectedNodes[0].data.key : selectedNodes[selectedNodes.length - 2].data.key;
  const toKey = relationshipType === "Asociación Reflexiva" ? selectedNodes[0].data.key : selectedNodes[selectedNodes.length - 1].data.key;
    const relationshipMap: {[key: string]: string} = {
      "Dependencia": "dependency",
      "Generalización": "generalization",
      "Composición": "composition",
      "Realización": "realization",
      "Agregación": "aggregation",
      "Asociación Reflexiva": "reflexiveAssociation",
      "Asociación": "association"
    };
    const linkCategory = relationshipMap[relationshipType] || "association";
    let existingLink = null;
    const linkDataArray = model.linkDataArray;
    for (let i = 0; i < linkDataArray.length; i++) {
      const linkData = linkDataArray[i];
      if ((linkData['from'] === fromKey && linkData['to'] === toKey) || 
          (linkData['from'] === toKey && linkData['to'] === fromKey)) {
        existingLink = linkData;
      break;
  }
    }
    model.startTransaction("update link");
    if (existingLink) {
      model.setDataProperty(existingLink, "category", linkCategory);
      this.toastr.success(`Relación actualizada a ${relationshipType}`);
    } else {
      model.addLinkData({ from: fromKey, to: toKey, category: linkCategory,rightText: '1..*'});
      this.toastr.success(`Relación ${relationshipType} creada`);
    }
    model.commitTransaction("update link");
  }

  // Gestión de versiones
  loadVersions() {
      this.versionesService.getVersiones(this.ID_Proyecto).subscribe(
        (data: any) => {
          // Si la respuesta tiene "message" o viene vacía, asumimos que no hay versiones.
          if (data.message || !data || data.length === 0) {
            this.versions = [];
          } else {
            // Filtrar solo las versiones de tipo 5
            this.versions = data.filter((v: any) => v.ID_Tipo === 5);
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
                this.versionData.ID_Tipo = 5;
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
      this.versionData.ID_Tipo = 5;
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