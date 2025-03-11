import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import * as go from 'gojs';

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
        // Nodo para Clase1 con atributos y métodos detallados
        {
          key: 1,
          category: "classWithAttributesAndMethods",
          name: "Clase",  // Nombre de la clase
          properties: [
            { visibility: "-", name: "atributo", type: "tipo", default: null, scope: "instance" }
          ],
          methods: [
            { visibility: "+", name: "metodo", parameters: [{ paramName: "par", paramType: "tipo" }], type: "tipo" }
          ]
        },
        // Nodo para Clase2 con atributos y métodos detallados
        {
          key: 2,
          category: "classWithAttributesAndMethods",
          name: "Clase",  // Nombre de la clase
          properties: [
            { visibility: "-", name: "atributo", type: "tipo", default: null, scope: "instance" },
            { visibility: "-", name: "atributo", type: "tipo", default: null, scope: "instance" }
          ],
          methods: [
            { visibility: "+", name: "metodo1", parameters: [{ paramName: "par", paramType: "tipo" },], type: "tipo" }
          ]
        }
      ],
      [
        // Relación entre Clase1 y Clase2
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
        { category: "classWithAttributes", name: "Clase",
          properties: [
            { visibility: "-", name: "atributo", type: "tipo", default: null, scope: "instance" }
          ]},
        { category: "classWithAttributesAndMethods", name: "Clase",
          properties: [
            { visibility: "-", name: "atributo", type: "tipo", default: null, scope: "instance" }
          ],
          methods: [
            { visibility: "+", name: "metodo", parameters: [{ paramName: "par", paramType: "tipo" }],type: "tipo" }
          ]},
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

     // Template para propiedades
     const propertyTemplate = new go.Panel('Horizontal')
     .add(
       // Botón con tamaño cuadrado fijo para cambiar visibilidad
       go.GraphObject.build("Button", { 
         click: toggleVisibility, 
         margin: 4, 
         width: 20, // Establece el tamaño fijo
         height: 20  // Establece el tamaño fijo (cuadrado)
       })
       .add(
         new go.TextBlock()
           .bind('text', 'visibility')  // El botón muestra el valor de visibilidad
           .set({ alignment: go.Spot.Center })  // Centra el texto dentro del botón
       ),
       
       // Nombre de la propiedad
       new go.TextBlock({ isMultiline: false, editable: true,textEdited: (textblock) => {
        if (textblock.text.trim() === "") {
          textblock.text = "-";
        }
      } })
         .bindTwoWay('text', 'name')
         .bind('isUnderline', 'scope', s => s[0] === 'c'),
       
       // Tipo de la propiedad
       new go.TextBlock('')
         .bind('text', 'type', t => t ? ': ' : ''),
       
       new go.TextBlock({ isMultiline: false, editable: true,textEdited: (textblock) => {
        if (textblock.text.trim() === "") {
          textblock.text = "-";
        }
      } })
         .bindTwoWay('text', 'type'),
       
       // Valor por defecto de la propiedad
       new go.TextBlock({ isMultiline: false, editable: false })
         .bind('text', 'default', s => s ? ' = ' + s : ''),
       // Botón para eliminar un metodo
       go.GraphObject.build("Button", { margin: 4, click: removeAttribute, width: 20, height: 20 })
       .add(
         new go.TextBlock("X")
       )  
     );

     
     const methodTemplate = new go.Panel('Horizontal')
  .add(
    // Botón para cambiar visibilidad
    go.GraphObject.build("Button", { 
      click: toggleVisibility, 
      margin: 4, 
      width: 20, 
      height: 20 
    }).add(
      new go.TextBlock()
        .bind('text', 'visibility')
        .set({ alignment: go.Spot.Center })
    ),
  
    // Nombre del método
    new go.TextBlock({ isMultiline: false, editable: true, textEdited: (textblock) => {
      if (textblock.text.trim() === "") {
        textblock.text = "-";
      }
    } })
      .bindTwoWay('text', 'name')
      .bind('isUnderline', 'scope', s => s[0] === 'c'),
  
    // Parámetros del método (encapsulados en paréntesis)
    new go.Panel('Horizontal', { margin: 2 })
      .add(
        new go.TextBlock('('), // Paréntesis de apertura
        new go.Panel('Horizontal', {
          itemTemplate: new go.Panel('Horizontal')
            .add(
              new go.TextBlock({ isMultiline: false, editable: true, textEdited: (textblock) => {
                if (textblock.text.trim() === "") {
                  textblock.text = "-";
                }
              } })
                .bindTwoWay('text', 'paramName'), // Nombre del parámetro
              new go.TextBlock(': '),
              new go.TextBlock({ isMultiline: false, editable: true, textEdited: (textblock) => {
                if (textblock.text.trim() === "") {
                  textblock.text = "-";
                }
              } })
                .bindTwoWay('text', 'paramType'), // Tipo del parámetro
                new go.TextBlock(',')
                .bind('visible', 'parameters', (parameters, panel) => {
                  if (!parameters || !Array.isArray(parameters)) return false; // Verificar que parameters sea un array

                  const parentPanel = panel.panel; // Obtener el panel padre que contiene la lista de parámetros
                  if (!parentPanel || !parentPanel.itemArray) return false;

                  const index = parentPanel.itemArray.indexOf(panel.data); // Obtener la posición del parámetro actual en su método

                  return index !== -1 && index < parentPanel.itemArray.length - 1; // Mostrar coma si no es el último
                })
            )
        }).bind('itemArray', 'parameters'), // Enlazar a la lista de parámetros
        new go.TextBlock(')') // Paréntesis de cierre
      ),
      // Botón para agregar un parámetro
    go.GraphObject.build("Button", { 
      margin: 4, 
      click: addNewParameter, // Función para agregar parámetro
      width: 20, 
      height: 20 
    }).add(
      new go.TextBlock("+") // Símbolo de adición
    ),

    // Tipo de retorno
    new go.TextBlock('')
      .bind('text', 'type', t => t ? ': ' : ''),
    new go.TextBlock({ isMultiline: false, editable: true, textEdited: (textblock) => {
      if (textblock.text.trim() === "") {
        textblock.text = "-";
      }
    } })
      .bindTwoWay('text', 'type'),
  
    // Botón para eliminar el método
    go.GraphObject.build("Button", { margin: 4, click: removeMethod, width: 20, height: 20 })
      .add(
        new go.TextBlock("X")
      ),
  );

  function addNewParameter(e: go.InputEvent, obj: go.GraphObject) { 
    const panel = obj.panel; // Obtener el panel donde está el botón
    
    if (!panel) {
      console.error("No se encontró el panel.");
      return;
    }
  
    const node = panel.part; // Obtener el nodo (clase)
    if (!node) {
      console.error("No se encontró el nodo.");
      return;
    }
  
    const diagram = node.diagram; // Obtener el diagrama
    if (!diagram) {
      console.error("No se encontró el diagrama.");
      return;
    }
  
    const data = node.data as NodeData; // Asegurar que 'data' tenga el tipo correcto
    if (!data || !Array.isArray(data.methods)) {
      console.error("No se encontraron los métodos en los datos del nodo.");
      return;
    }
  
    // Identificar el método al que pertenece el botón
    const methodPanel = obj.panel; // Panel del método donde se hizo clic
    const methodData = methodPanel.data as Method; // Datos del método
  
    if (!methodData) {
      console.error("No se encontró el método al que pertenece el botón.");
      return;
    }
  
    // Encontrar el índice del método en la lista de métodos
    const methodIndex = data.methods.findIndex(m => m === methodData);
    if (methodIndex === -1) {
      console.error("No se encontró el método en la lista de métodos.");
      return;
    }
  
    // Crear un nuevo parámetro
    const newParameter: Parameter = {
      paramName: "par",
      paramType: "tipo"
    };
  
    // Actualizar los parámetros del método seleccionado
    diagram.model.commit(m => {
      const updatedMethods = data.methods.map((method, index) =>
        index === methodIndex
          ? { ...method, parameters: [...(method.parameters || []), newParameter] }
          : method
      );
  
      m.set(data, "methods", updatedMethods);
    }, "added parameter");
  }
  
  
  
  

     
  function toggleVisibility(e: go.InputEvent, obj: go.GraphObject) { 
    const panel = obj.panel; // Panel donde está el botón de visibilidad
    console.log('Clic en visibilidad');
  
    if (!panel) {
      console.error("No se encontró el panel.");
      return;
    }
  
    const node = panel.part; // Obtener el nodo (clase)
    if (!node) {
      console.error("No se encontró el nodo.");
      return;
    }
  
    const diagram = node.diagram; // Obtener el diagrama
    if (!diagram) {
      console.error("No se encontró el diagrama.");
      return;
    }
  
    const data = panel.data; // Datos del método o atributo
    if (!data || !data.hasOwnProperty("visibility")) {
      console.error("No se encontró la propiedad 'visibility' en los datos.");
      return;
    }
  
    // Determinar la nueva visibilidad
    let newVisibility = "+";
    if (data.visibility === "+") newVisibility = "-";
    else if (data.visibility === "-") newVisibility = "#";
  
    // Forzar actualización del modelo
    diagram.model.commit(m => {
      m.set(data, "visibility", newVisibility);
      
      // 🔹 **Forzar actualización manualmente**
      m.set(node.data, "methods", [...(node.data.methods || [])]);
      m.set(node.data, "attributes", [...(node.data.attributes || [])]); 
    }, "toggle visibility");
  }
  

    function addNewAttribute(e: go.InputEvent, obj: go.GraphObject) { 
      const panel = obj.panel; // Obtener el panel donde está el botón
    
      if (!panel) {
        console.error("No se encontró el panel.");
        return;
      }
    
      const node = panel.part; // Obtener el nodo (clase)
      if (!node) {
        console.error("No se encontró el nodo.");
        return;
      }
    
      const diagram = node.diagram; // Obtener el diagrama
      if (!diagram) {
        console.error("No se encontró el diagrama.");
        return;
      }
    
      const data = node.data; // Obtener los datos del nodo
      if (!data) {
        console.error("No se encontraron los datos del nodo.");
        return;
      }
    
      if (!Array.isArray(data.properties)) {
        console.error("No se encontró la propiedad 'properties' en los datos.");
        return;
      }
    
      // Crear un nuevo atributo con la estructura correcta
      const newAttribute = {
        visibility: "+", // Por defecto público
        name: "Atributo",
        type: "tipo", // Tipo genérico
        default: null, // Sin valor por defecto
        scope: "instance" // Se asume que es de instancia
      };
    
      // Actualizar el modelo para reflejar el cambio
      diagram.model.commit(m => {
        m.set(data, "properties", [...data.properties, newAttribute]);
      }, "added attribute");
    }
    

    function addNewMethod(e: go.InputEvent, obj: go.GraphObject) { 
      const panel = obj.panel; // Obtener el panel donde está el botón
    
      if (!panel) {
        console.error("No se encontró el panel.");
        return;
      }
    
      const node = panel.part; // Obtener el nodo (clase)
      if (!node) {
        console.error("No se encontró el nodo.");
        return;
      }
    
      const diagram = node.diagram; // Obtener el diagrama
      if (!diagram) {
        console.error("No se encontró el diagrama.");
        return;
      }
    
      const data = node.data; // Obtener los datos del nodo
      if (!data) {
        console.error("No se encontraron los datos del nodo.");
        return;
      }
    
      if (!Array.isArray(data.methods)) {
        console.error("No se encontró la propiedad 'methods' en los datos.");
        return;
      }
    
      // Crear un nuevo método con la estructura correcta
      const newMethod = {
        visibility: "+", // Por defecto público
        name: "Metodo",
        parameters: [{ paramName: "par", paramType: "tipo" }], // Un parámetro genérico
        type: "tipo" // Tipo de retorno por defecto
      };
    
      // Actualizar el modelo para reflejar el cambio
      diagram.model.commit(m => {
        m.set(data, "methods", [...data.methods, newMethod]);
      }, "added method");
    }
    

    function removeAttribute(e: go.InputEvent, obj: go.GraphObject) {
      const panel = obj.panel; // Obtener el panel donde está el botón
      if (!panel) {
        console.error("No se encontró el panel.");
        return;
      }
    
      const node = panel.part; // Obtener el nodo (clase)
      if (!node) {
        console.error("No se encontró el nodo.");
        return;
      }
    
      const diagram = node.diagram; // Obtener el diagrama
      if (!diagram) {
        console.error("No se encontró el diagrama.");
        return;
      }
    
      const data = node.data; // Obtener los datos del nodo
      if (!data || !Array.isArray(data.properties)) {
        console.error("No se encontraron los datos o la propiedad 'properties'.");
        return;
      }
    
      const item = obj.panel.data; // Acceder a los datos del atributo
      if (!item) {
        console.error("No se encontró el atributo a eliminar.");
        return;
      }
    
      // 🔹 Definir el tipo de `prop` explícitamente
      const updatedProperties = data.properties.filter((prop: { visibility: string; name: string; type: string; }) => prop !== item);
    
      // Actualizar el modelo
      diagram.model.commit(m => {
        m.set(data, "properties", updatedProperties);
      }, "removed attribute");
    }
    
    function removeMethod(e: go.InputEvent, obj: go.GraphObject) {
      const panel = obj.panel; // Obtener el panel donde está el botón
      if (!panel) {
        console.error("No se encontró el panel.");
        return;
      }
    
      const node = panel.part; // Obtener el nodo (clase)
      if (!node) {
        console.error("No se encontró el nodo.");
        return;
      }
    
      const diagram = node.diagram; // Obtener el diagrama
      if (!diagram) {
        console.error("No se encontró el diagrama.");
        return;
      }
    
      const data = node.data; // Obtener los datos del nodo
      if (!data || !Array.isArray(data.methods)) {
        console.error("No se encontraron los datos o la propiedad 'methods'.");
        return;
      }
    
      const item = obj.panel.data; // Acceder a los datos del método
      if (!item) {
        console.error("No se encontró el método a eliminar.");
        return;
      }
    
      // 🔹 Filtrar el array de métodos para remover el método seleccionado
      const updatedMethods = data.methods.filter(
        (method: { visibility: string; name: string; type: string; parameters: any[] }) => method !== item
      );
    
      // Actualizar el modelo
      diagram.model.commit((m) => {
        m.set(data, "methods", updatedMethods);
      }, "removed method");
    }

    // Template para clases sin atributos ni métodos
    const classOnlyTemplate = $(go.Node, "Auto", commonNodeProps,
      $(go.Shape, "Rectangle", { strokeWidth: 1, stroke: "black", fill: "white" }),
      $(go.Panel, "Table", { defaultRowSeparatorStroke: "black", stretch: go.GraphObject.Fill },
        $(go.Panel, "Auto", { row: 0, margin: 4 },
          $(go.TextBlock, { font: "bold 16px sans-serif", isMultiline: false, editable: true, textAlign: "center", stretch: go.GraphObject.Fill, minSize: new go.Size(100, 20) },
            new go.Binding("text", "name").makeTwoWay())
        )
      )
    );

    // Template para clases con atributos
    const classWithAttributesTemplate = $(go.Node, "Auto", commonNodeProps,
      $(go.Shape, "Rectangle", { strokeWidth: 1, stroke: "black", fill: "white" }),
      $(go.Panel, "Table", { defaultRowSeparatorStroke: "black", stretch: go.GraphObject.Fill },
        $(go.Panel, "Auto", { row: 0, margin: 4 },
          $(go.TextBlock, { font: "bold 16px sans-serif", isMultiline: false, editable: true, textAlign: "center", stretch: go.GraphObject.Fill, minSize: new go.Size(100, 20) },
            new go.Binding("text", "name").makeTwoWay())
        ),
        // Panel de atributos sin encabezado
        $(go.Panel, "Vertical", { row: 1, margin: 4, stretch: go.Stretch.Horizontal, defaultAlignment: go.Spot.Left },
          new go.Panel('Vertical', {
            name: 'PROPERTIES',
            stretch: go.Stretch.Horizontal,
            defaultAlignment: go.Spot.Left,
            itemTemplate: propertyTemplate
          })
          .bind('itemArray', 'properties'),
          // Botón para agregar un atributo
          go.GraphObject.build("Button", { margin: 4, click: addNewAttribute })
            .add(
              new go.TextBlock("Agregar Atributo")
            )
        )
      )
    );

    // Template para clases con atributos y métodos
const classWithAttributesAndMethodsTemplate = $(go.Node, "Auto", commonNodeProps,
  $(go.Shape, "Rectangle", { strokeWidth: 1, stroke: "black", fill: "white" }),
  $(go.Panel, "Table", { defaultRowSeparatorStroke: "black", stretch: go.GraphObject.Fill },
    $(go.Panel, "Auto", { row: 0, margin: 4 },
      $(go.TextBlock, { font: "bold 16px sans-serif", isMultiline: false, editable: true, textAlign: "center", stretch: go.GraphObject.Fill, minSize: new go.Size(100, 20) },
        new go.Binding("text", "name").makeTwoWay())
    ),
    // Panel de atributos con botón para agregar un nuevo atributo
    $(go.Panel, "Vertical", { row: 1, margin: 4, stretch: go.Stretch.Horizontal, defaultAlignment: go.Spot.Left },
      new go.Panel('Vertical', {
        name: 'PROPERTIES',
        stretch: go.Stretch.Horizontal,
        defaultAlignment: go.Spot.Left,
        itemTemplate: propertyTemplate
      })
      .bind('itemArray', 'properties'),
      // Botón para agregar un atributo
      go.GraphObject.build("Button", { margin: 4, click: addNewAttribute })
        .add(
          new go.TextBlock("Agregar Atributo")
        )
    ),
    // Panel de métodos sin encabezado
    $(go.Panel, "Vertical", { row: 2, margin: 4, stretch: go.Stretch.Horizontal, defaultAlignment: go.Spot.Left },
      new go.Panel('Vertical', {
        name: 'METHODS',
        stretch: go.Stretch.Horizontal,
        defaultAlignment: go.Spot.Left,
        itemTemplate: methodTemplate // Este es el itemTemplate que muestra los métodos con parámetros
      })
      .bind('itemArray', 'methods'), // Aquí se está vinculando correctamente el array de métodos
      // Botón para agregar un atributo
      go.GraphObject.build("Button", { margin: 4, click: addNewMethod })
        .add(
          new go.TextBlock("Agregar Método")
        )
    )
  )
);


    // Retorno del mapa de templates con las plantillas
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

     // Plantilla para multiplicidad
    const multiplicityLinkTemplate = $(go.Link, commonLinkProps,
      $(go.Shape, { strokeWidth: 2, stroke: "black" }),  // Forma simple para el enlace
      $(go.TextBlock, {
        textAlign: "center", font: "bold 14px sans-serif", margin: new go.Margin(4, 10, 4, 10),editable: false,background: "yellow", minSize: new go.Size(20, 20)
      },
        new go.Binding("text", "rightText").makeTwoWay())  // Esta parte ahora muestra la multiplicidad
    );

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
      .set("multiplicity", multiplicityLinkTemplate) 
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

  selectedMultiplicity: string = '1..*';  // Valor predeterminado

  setMultiplicity(multiplicity: string): void {
    this.selectedMultiplicity = multiplicity;
    this.createLink("Multiplicidad");
  }

  // Método para crear enlaces con multiplicidad
private createLink(relationshipType: string, symbol: string = "", dashed: boolean = false): void {
  if (!this.diagram) return;

  const model = this.diagram.model as go.GraphLinksModel;
  const selectedNodes = this.diagram.selection.toArray().filter(node => node instanceof go.Node) as go.Node[];

  // Validación: asegúrate de que haya al menos dos nodos seleccionados para relaciones no reflexivas
  if (selectedNodes.length < 2 && relationshipType !== "Asociación Reflexiva") {
    alert("Selecciona al menos dos clases para conectarlas.");
    return;
  }

  // Validación para la Asociación Reflexiva, donde solo se selecciona un nodo
  if (selectedNodes.length < 1 && relationshipType === "Asociación Reflexiva") {
    alert("Selecciona solo 1 clase para conectarla.");
    return;
  }

  // Se determina el "from" y "to" de los nodos dependiendo del tipo de relación
  const fromKey = relationshipType === "Asociación Reflexiva" ? selectedNodes[0].data.key : selectedNodes[selectedNodes.length - 2].data.key;
  const toKey = relationshipType === "Asociación Reflexiva" ? selectedNodes[0].data.key : selectedNodes[selectedNodes.length - 1].data.key;
  
  // Usamos la multiplicidad seleccionada por el usuario
  let multiplicity = this.selectedMultiplicity; 

  // Inicializamos la categoría de enlace y el símbolo de la flecha
  let linkCategory = "solid";
  let symbolArrow = "";

  // Asignamos la categoría y el símbolo de acuerdo al tipo de relación
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
    case "Multiplicidad":
      linkCategory = "multiplicity";
      relationshipType = multiplicity;
      break;
  }
  // Ahora agregamos el enlace al modelo
  model.addLinkData({
    from: fromKey,
    to: toKey,
    rightText: relationshipType,  // Aquí se asigna la multiplicidad seleccionada
    category: linkCategory,  // Establece la categoría de relación (dependiendo del tipo)
  });
  }
  
}