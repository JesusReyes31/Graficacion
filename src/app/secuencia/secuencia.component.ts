import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import * as go from 'gojs';

const $ = go.GraphObject.make;

interface Mensaje {
  origen: string;
  destino: string;
  mensaje: string;
  tipo: 'sincrono' | 'asincrono' | 'respuesta';
  orden: number;
}

interface Participante {
  nombre: string;
  tipo: 'actor' | 'objeto';
  activaciones: { inicio: number; fin: number; }[];
}

@Component({
  selector: 'app-secuencia',
  templateUrl: './secuencia.component.html',
  styleUrls: ['./secuencia.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class SecuenciaComponent implements OnInit, AfterViewInit {
  @ViewChild('diagramDiv') diagramDiv!: ElementRef;
  
  public diagram: go.Diagram | null = null;
  participantes: Participante[] = [];
  mensajes: Mensaje[] = [];
  
  nuevoParticipante: Participante = {
    nombre: '',
    tipo: 'objeto',
    activaciones: []
  };

  nuevoMensaje: Mensaje = {
    origen: '',
    destino: '',
    mensaje: '',
    tipo: 'sincrono',
    orden: 0
  };

  private MENSAJE_SPACING = 50;
  private PARTICIPANTE_WIDTH = 120;
  private PARTICIPANTE_HEIGHT = 40;
  private LIFELINE_LENGTH = 1000;

  ngOnInit() {}

  ngAfterViewInit() {
    if (this.diagramDiv) {
      this.initDiagram();
      this.actualizarDiagrama();
    }
  }

  private initDiagram() {
    this.diagram = new go.Diagram(this.diagramDiv.nativeElement, {
      "undoManager.isEnabled": true,
      "allowMove": false,
      "allowDelete": false,
      "allowHorizontalScroll": true,
      "allowVerticalScroll": true,
      initialContentAlignment: go.Spot.TopLeft,
      layout: $(go.GridLayout, {
        wrappingWidth: Infinity,
        spacing: new go.Size(200, 50),
        alignment: go.GridLayout.Position
      })
    });

    this.diagram.nodeTemplate =
      $(go.Node, "Position",
        {
          selectable: false,
          movable: false,
          locationSpot: go.Spot.Top
        },
        $(go.Panel, "Auto",
          $(go.Shape, "Rectangle",
            {
              fill: "white",
              stroke: "black",
              strokeWidth: 1,
              width: this.PARTICIPANTE_WIDTH,
              height: this.PARTICIPANTE_HEIGHT
            }
          ),
          $(go.TextBlock,
            {
              margin: 5,
              textAlign: "center",
              font: "12px Arial",
              wrap: go.TextBlock.WrapFit
            },
            new go.Binding("text")
          )
        ),
        $(go.Shape,
          {
            geometryString: `M ${this.PARTICIPANTE_WIDTH/2} ${this.PARTICIPANTE_HEIGHT} V ${this.LIFELINE_LENGTH}`,
            stroke: "black",
            strokeDashArray: [5, 5],
            strokeWidth: 1
          }
        ),
        $(go.Panel, "Position",
          {
            name: "ACTIVATIONS",
            alignment: go.Spot.Center
          },
          new go.Binding("itemArray", "activaciones"),
          {
            itemTemplate:
              $(go.Panel, "Auto",
                new go.Binding("position", "", (data) => new go.Point(this.PARTICIPANTE_WIDTH/2 - 5, data.inicio)),
                $(go.Shape, "Rectangle",
                  {
                    fill: "white",
                    stroke: "black",
                    strokeWidth: 1,
                    width: 10
                  },
                  new go.Binding("height", "", (data) => data.fin - data.inicio)
                )
              )
          }
        )
      );

    this.diagram.linkTemplate =
      $(go.Link,
        {
          routing: go.Link.Normal,
          curve: go.Link.None,
          adjusting: go.Link.None,
          fromEndSegmentLength: 50,
          toEndSegmentLength: 50
        },
        $(go.Shape,
          {
            stroke: "black",
            strokeWidth: 1
          },
          new go.Binding("strokeDashArray", "tipo", t => t === 'respuesta' ? [4, 4] : null)
        ),
        $(go.Shape,
          {
            scale: 0.8
          },
          new go.Binding("toArrow", "tipo", t => t === 'asincrono' ? "OpenTriangle" : "Triangle"),
          new go.Binding("fill", "tipo", t => t === 'respuesta' ? "white" : "black"),
          new go.Binding("stroke", "tipo", t => "black")
        ),
        $(go.TextBlock,
          {
            segmentOffset: new go.Point(0, -10),
            segmentOrientation: go.Link.OrientUpright,
            background: "white",
            font: "11px Arial"
          },
          new go.Binding("text", "", (data) => {
            return `${data.orden + 1}: ${data.text}`;
          })
        ),
        new go.Binding("points").makeTwoWay()
      );
  }

  agregarParticipante() {
    if (this.nuevoParticipante.nombre.trim()) {
      this.participantes.push({...this.nuevoParticipante});
      this.nuevoParticipante = {
        nombre: '',
        tipo: 'objeto',
        activaciones: []
      };
      this.actualizarDiagrama();
    }
  }

  eliminarParticipante(index: number) {
    const participanteEliminado = this.participantes[index].nombre;
    this.participantes.splice(index, 1);
    this.mensajes = this.mensajes.filter(m => 
      m.origen !== participanteEliminado && 
      m.destino !== participanteEliminado
    );
    this.actualizarDiagrama();
  }

  agregarMensaje() {
    if (this.nuevoMensaje.origen && 
        this.nuevoMensaje.destino && 
        this.nuevoMensaje.mensaje.trim()) {
      const nuevoMensaje = {
        ...this.nuevoMensaje,
        orden: this.mensajes.length
      };
      this.mensajes.push(nuevoMensaje);

      // Agregar activación solo para el objeto destino en mensajes síncronos
      if (nuevoMensaje.tipo === 'sincrono') {
        const destinoParticipante = this.participantes.find(p => p.nombre === nuevoMensaje.destino);
        if (destinoParticipante) {
          const inicio = (nuevoMensaje.orden + 1) * this.MENSAJE_SPACING + this.PARTICIPANTE_HEIGHT;
          const fin = inicio + this.MENSAJE_SPACING;
          destinoParticipante.activaciones.push({ inicio, fin });
        }
      }

      this.nuevoMensaje = {
        origen: '',
        destino: '',
        mensaje: '',
        tipo: 'sincrono',
        orden: 0
      };
      this.actualizarDiagrama();
    }
  }

  eliminarMensaje(index: number) {
    // Eliminar las activaciones correspondientes
    const mensaje = this.mensajes[index];
    if (mensaje.tipo === 'sincrono') {
      const destinoParticipante = this.participantes.find(p => p.nombre === mensaje.destino);
      if (destinoParticipante) {
        const inicio = (mensaje.orden + 1) * this.MENSAJE_SPACING + this.PARTICIPANTE_HEIGHT;
        destinoParticipante.activaciones = destinoParticipante.activaciones.filter(
          a => a.inicio !== inicio
        );
      }
    }

    this.mensajes.splice(index, 1);
    // Actualizar el orden de los mensajes restantes y sus activaciones
    this.mensajes.forEach((mensaje, i) => {
      mensaje.orden = i;
    });
    this.actualizarDiagrama();
  }

  private actualizarDiagrama() {
    if (!this.diagram) return;

    const nodeDataArray = this.participantes.map((p, i) => ({
      key: p.nombre,
      text: p.nombre,
      loc: `${i * 200} 0`,
      activaciones: p.activaciones
    }));

    const linkDataArray = this.mensajes.map((m, i) => {
      // Encontrar los índices de los participantes origen y destino
      const fromIndex = this.participantes.findIndex(p => p.nombre === m.origen);
      const toIndex = this.participantes.findIndex(p => p.nombre === m.destino);
      
      const y = (i + 1) * this.MENSAJE_SPACING + this.PARTICIPANTE_HEIGHT;
      const fromX = fromIndex * 200 + this.PARTICIPANTE_WIDTH/2;
      const toX = toIndex * 200 + this.PARTICIPANTE_WIDTH/2;

      return {
        from: m.origen,
        to: m.destino,
        text: m.mensaje,
        tipo: m.tipo,
        orden: i,
        points: [
          new go.Point(fromX, y),
          new go.Point(toX, y)
        ]
      };
    });

    this.diagram.model = new go.GraphLinksModel(nodeDataArray, linkDataArray);
  }
}