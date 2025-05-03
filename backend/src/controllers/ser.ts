
import express, { Request, Response } from "express";
import { alumnos } from "../models/alumnosModel";

// Obtener todos los elementos
const GETalumnosALL = async (req: Request, res: Response) => {
    try {
        const alumnoss = await alumnos.findAll();
        res.json(alumnoss);
    } catch (error) {
        console.error("Error fetching alumnoss:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Obtener un elemento por ID
const GETalumnos = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const alumnosbyID = await alumnos.findByPk(id);
        if (!alumnosbyID) {
            res.status(404).json({ error: "alumnos not found" });
            return;
        }
        res.json(alumnosbyID);
    } catch (error) {
        console.error("Error fetching alumnos:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Crear un nuevo elemento
const POSTalumnos = async (req: Request, res: Response) => {
    const { nombre, apellido, edad } = req.body;
    try {
        const nuevoalumnos = await alumnos.create({ nombre, apellido, edad });
        res.status(201).json(nuevoalumnos);
    } catch (error) {
        console.error("Error creating alumnos:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Actualizar un elemento existente
const PUTalumnos = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { nombre, apellido, edad } = req.body;
    try {
        const alumnosbyID = await alumnos.findByPk(id);
        if (!alumnosbyID) {
            res.status(404).json({ error: "alumnos not found" });
            return;
        }
        alumnosbyID.nombre = nombre;
        alumnosbyID.apellido = apellido;
        alumnosbyID.edad = edad;
        await alumnosbyID.save();
        res.json(alumnosbyID);
    } catch (error) {
        console.error("Error updating alumnos:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Eliminar un elemento
const DELETEalumnos = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const alumnosbyID = await alumnos.findByPk(id);
        if (!alumnosbyID) {
            res.status(404).json({ error: "alumnos not found" });
            return;
        }
        await alumnosbyID.destroy();
        res.status(204).send();
    } catch (error) {
        console.error("Error deleting alumnos:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export {GETalumnosALL, GETalumnos, POSTalumnos, PUTalumnos, DELETEalumnos};
        