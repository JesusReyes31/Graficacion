import { exec } from "child_process";
import { Request, Response } from "express";
import path from "path";
import fs from "fs";

export const createProjectFront = (req: Request, res: Response) => {
    const { projectName,frontendName } = req.body;
    
    if (!projectName) { 
        res.status(400).json({ message: "El nombre del proyecto es obligatorio." });
        return;
    }

    const projectPath = path.join("C:/proyectos", projectName);

    try {
        // Crear carpetas si no existen
        if (!fs.existsSync(projectPath)) fs.mkdirSync(projectPath, { recursive: true });

        // Inicializar backend en TypeScript
        exec(`cd ${projectPath} && ng new ${frontendName}`, (err, stdout, stderr) => {
            if (err) {
                console.error(stderr);
                res.status(500).json({ message: "Error creando el backend." });
                return;
            }

            console.log(stdout);
            exec(`cd ${projectPath}/${frontendName} && ng s -o`, (err, stdout, stderr) => {
                if (err) {
                    console.error(stderr);
                    res.status(500).json({ message: "Error creando el backend." });
                }
            res.json({ message: `Proyecto front ${frontendName} creado con éxito en ${projectPath}` });
            return;
            })
        });

    } catch (error) {
        res.status(500).json({ message: "Error creando el proyecto.", error });
        return;
    }
};
