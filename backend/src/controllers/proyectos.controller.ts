import { Request, Response } from "express";
import { Proyecto } from "../models/proyectos.model";

const getProyectos = async (req: Request, res: Response) => {
    try {
        const proyectos = await Proyecto.findAll();
        res.json(proyectos);
    } catch (error) {
        console.error("Error fetching projects:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

const getProyecto = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const proyecto = await Proyecto.findByPk(id);
        if (!proyecto) {
            res.status(404).json({ error: "Project not found" });
            return;
        }
        res.json(proyecto);
    } catch (error) {
        console.error("Error fetching project:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

const postProyecto = async (req: Request, res: Response) => {
    const { Nombre } = req.body;
    try {
        const nuevoProyecto = await Proyecto.create({ Nombre });
        res.status(201).json(nuevoProyecto);
    } catch (error) {
        console.error("Error creating project:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

const putProyecto = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { Nombre } = req.body;
    try {
        const proyecto = await Proyecto.findByPk(id);
        if (!proyecto) {
            res.status(404).json({ error: "Project not found" });
            return;
        }
        proyecto.Nombre = Nombre;
        await proyecto.save();
        res.json(proyecto);
    } catch (error) {
        console.error("Error updating project:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

const deleteProyecto = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const proyecto = await Proyecto.findByPk(id);
        if (!proyecto) {
            res.status(404).json({ error: "Project not found" });
            return;
        }
        await proyecto.destroy();
        res.status(204).send();
    } catch (error) {
        console.error("Error deleting project:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export { getProyectos, getProyecto, postProyecto, putProyecto, deleteProyecto };