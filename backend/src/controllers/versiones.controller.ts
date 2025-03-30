import { Request,Response } from "express";
import { Versiones } from "../models/versiones.model";
import { Diagrama } from "../models/diagrama.model";

const getVersiones = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ error: "ID_Project parameter is required" });
            return;
        }
        console.log("ID_V", id);
        const versiones = await Versiones.findAll({ where: { ID_Proyecto: parseInt(id) }, include: { model: Diagrama } });
        if (!versiones || versiones.length === 0) {
            res.status(201).json({ message: "No versions found for this project" });
            return;
        }
        res.json(versiones);
    } catch (error) {
        console.error("Error fetching versions:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

const postVersion = async (req: Request, res: Response) => {
    const { ID_Proyecto, ID_Tipo, json } = req.body;
    try {
        console.log("ID_Proyecto", ID_Proyecto, "ID_Tipo", ID_Tipo, "json", json);
        if (!ID_Proyecto || !ID_Tipo || !json) {
            res.status(400).json({ error: "ID_Proyecto, ID_Tipo and json are required" });
            return;
        }
        const nuevaVersion = await Versiones.create({ ID_Proyecto, ID_Tipo, json });
        res.status(201).json(nuevaVersion);
    } catch (error) {
        console.error("Error creating version:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

const putVersion = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { ID_Proyecto, ID_Tipo, json } = req.body;
    try {
        const version = await Versiones.findByPk(id);
        if (!version) {
            res.status(404).json({ error: "Version not found" });
            return;
        }
        version.ID_Proyecto = ID_Proyecto;
        version.ID_Tipo = ID_Tipo;
        version.json = json;
        await version.save();
        res.json(version);
    } catch (error) {
        console.error("Error updating version:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

const deleteVersion = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const version = await Versiones.findByPk(id);
        if (!version) {
            res.status(404).json({ error: "Version not found" });
            return;
        }
        await version.destroy();
        res.json({ message: "Version deleted successfully" });
    } catch (error) {
        console.error("Error deleting version:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export { getVersiones, postVersion, putVersion, deleteVersion };
