import { Request, Response } from "express";
import { Proyecto } from "../models/proyectos.model";
import { Versiones } from "../models/versiones.model";
import { createProjectBackend } from "../services/crearbackend";

export const generarproyecto = async (req: Request, res: Response) => {
    const {id,idv_cu,idv_sec,idv_paq,idv_comp,idv_class,conexion} = req.body;
    // console.log(req.body);
    try {
        const proyecto = await Proyecto.findByPk(id);
        if (!proyecto) {
            res.status(404).json({ error: "Proyecto no encontrado" });
            return;
        }
        const clases = await Versiones.findByPk(idv_class);
        if (!clases) {
            res.status(404).json({ error: "Version del Diagrama de clases no encontrada" });
            return;
        }
        const secuencias = await Versiones.findByPk(idv_sec);
        if (!secuencias) {
            res.status(404).json({ error: "Version del Diagrama de secuencias no encontrada" });
            return;
        }
        const paquetes = await Versiones.findByPk(idv_paq);
        if (!paquetes) {
            res.status(404).json({ error: "Version del Diagrama de paquetes no encontrada" });
            return;
        }
        const componentes = await Versiones.findByPk(idv_comp);
        if (!componentes) {
            res.status(404).json({ error: "Version del Diagrama de componentes no encontrada" });
            return;
        }
        const casosUso = await Versiones.findByPk(idv_cu);
        if (!casosUso) {
            res.status(404).json({ error: "Version del Diagrama de casos de uso no encontrada" });
            return;
        }

        // Creacion del boilerplate
        await createProjectBackend(proyecto.Nombre,clases.json,conexion);
        res.status(200).json({ message: "Proyecto generado correctamente" });
    } catch (error) {
        res.status(500).json({ error: "Error al generar el proyecto" });
        console.error("Error al generar el proyecto:", error);
    }
}