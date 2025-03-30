import { Request, Response } from "express";
import { Usuarios } from "../models/usuarios.model";


const getUsuarios = async (req:Request, res:Response) => {
    try {
        const usuarios = await Usuarios.findAll();
        if (usuarios.length === 0) {
            res.status(404).json({ message: "No users found" });
            return;
        }
        res.json(usuarios);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

const postUsuario = async (req:Request, res:Response) => {
    const { Nombre } = req.body;
    try {
        if (!Nombre) {
            res.status(400).json({ error: "Name is required" });
            return;
        }
        const nuevoUsuario = await Usuarios.create({ Nombre });
        res.status(201).json(nuevoUsuario);
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

const putUsuario = async (req:Request, res:Response) => {
    const { id } = req.params;
    const { Nombre } = req.body;
    try {
        const usuario = await Usuarios.findByPk(id);
        if (!usuario) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        usuario.Nombre = Nombre;
        await usuario.save();
        res.json(usuario);
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}
const deleteUsuario = async (req:Request, res:Response) => {
    const { id } = req.params;
    try {
        const usuario = await Usuarios.findByPk(id);
        if (!usuario) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        await usuario.destroy();
        res.json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export { getUsuarios, postUsuario, putUsuario, deleteUsuario };