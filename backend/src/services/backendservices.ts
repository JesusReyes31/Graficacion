import { exec } from "child_process";
import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { crearArchivosClase } from "./backendcreaservices";

export const createProjectBackend = (req: Request, res: Response) => {
    const { projectName, backendName,puerto } = req.body;
    const clases = req.body
    
    if (!projectName || !backendName) { 
         res.status(400).json({ message: "El nombre del proyecto y el backend son obligatorios." });
        return;
    }

    const projectPath = path.join("C:/proyectos", projectName, backendName);

    try {
        // Crear carpetas si no existen
        if (!fs.existsSync(projectPath)) fs.mkdirSync(projectPath, { recursive: true });

        // Inicializar backend en TypeScript
        exec(`cd ${projectPath} && npm init -y && npm install express typescript ts-node @types/node @types/express nodemon`, (err, stdout, stderr) => {
            if (err) {
                console.error(stderr);
                res.status(500).json({ message: "Error creando el backend." });
                return;
            }
            // Crear archivo index.ts
            fs.writeFileSync(path.join(projectPath, "index.ts"), `
import express, { Request, Response } from "express";

const app = express();
app.use(express.json());
const PORT =  ${puerto};


app.get("/", (req: Request, res: Response) => {
  res.json({ message: "¡Backend ${backendName} funcionando!" });
});
app.listen(PORT, () => {
  console.log("Servidor corriendo en http://localhost:${puerto}");
});
            `);

            // Crear archivo tsconfig.json
            fs.writeFileSync(path.join(projectPath, "tsconfig.json"), `
{
  "compilerOptions": {
    "target": "es2016",
    "module": "CommonJS",
    "rootDir": "./",
    "outDir": "./dist",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,  
    "strict": true,
    "skipLibCheck": true
  }
}
            `);

            // Agregar scripts en package.json
            const packageJsonPath = path.join(projectPath, "package.json");
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
            packageJson.scripts = {
                "dev": "nodemon --ext ts --exec ts-node index.ts",
                "start": "npx ts-node index.ts"
            };
            fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

            // // Ejecutar el servidor automáticamente
            // exec(`cd ${projectPath} && code .`, (startErr, startStdout, startStderr) => {
            //     res.json({ message: `Proyecto ${backendName} creado y ejecutándose en ${projectPath}` });
            //     return;
            // });

            //crear archivos por clases
            // for (const clase of clases) {
            //     crearArchivosClase(clase, projectPath);
            // }
            
        });

    } catch (error) {
        res.status(500).json({ message: "Error creando el proyecto.", error });
        return;
    }
};