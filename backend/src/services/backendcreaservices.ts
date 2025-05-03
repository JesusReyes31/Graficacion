import fs from "fs";
import path from "path";

const crearServices = (clase: any, basePath: string) => {
    const { nombre, atributos } = clase;

    if (!nombre || !atributos || !Array.isArray(atributos)) {
        console.error("La clase debe tener un nombre y una lista de atributos.");
        return;
    }

    const servicepath = path.join(basePath, `src/services/`);
    const serviceFilePath = path.join(servicepath, `${nombre}Service.ts`);
    if (!fs.existsSync(servicepath)) fs.mkdirSync(servicepath, { recursive: true });

    try {
        // Crear contenido del archivo services.ts
        const serviceContent = `
import express, { Request, Response } from "express";
import { ${nombre} } from "../models/${nombre}Model";

// Obtener todos los elementos
const GET${nombre}ALL = async (req: Request, res: Response) => {
    try {
        const ${nombre.toLowerCase()}s = await ${nombre}.findAll();
        res.json(${nombre.toLowerCase()}s);
    } catch (error) {
        console.error("Error fetching ${nombre}s:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Obtener un elemento por ID
const GET${nombre} = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const ${nombre.toLowerCase()}byID = await ${nombre}.findByPk(id);
        if (!${nombre.toLowerCase()}byID) {
            res.status(404).json({ error: "${nombre} not found" });
            return;
        }
        res.json(${nombre.toLowerCase()}byID);
    } catch (error) {
        console.error("Error fetching ${nombre}:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Crear un nuevo elemento
const POST${nombre} = async (req: Request, res: Response) => {
    const { ${atributos.join(", ")} } = req.body;
    try {
        const nuevo${nombre} = await ${nombre}.create({ ${atributos.join(", ")} });
        res.status(201).json(nuevo${nombre});
    } catch (error) {
        console.error("Error creating ${nombre}:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Actualizar un elemento existente
const PUT${nombre} = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { ${atributos.join(", ")} } = req.body;
    try {
        const ${nombre.toLowerCase()}byID = await ${nombre}.findByPk(id);
        if (!${nombre.toLowerCase()}byID) {
            res.status(404).json({ error: "${nombre} not found" });
            return;
        }
        ${atributos.map(attr => `${nombre.toLowerCase()}byID.${attr} = ${attr};`).join("\n        ")}
        await ${nombre.toLowerCase()}byID.save();
        res.json(${nombre.toLowerCase()}byID);
    } catch (error) {
        console.error("Error updating ${nombre}:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Eliminar un elemento
const DELETE${nombre} = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const ${nombre.toLowerCase()}byID = await ${nombre}.findByPk(id);
        if (!${nombre.toLowerCase()}byID) {
            res.status(404).json({ error: "${nombre} not found" });
            return;
        }
        await ${nombre.toLowerCase()}byID.destroy();
        res.status(204).send();
    } catch (error) {
        console.error("Error deleting ${nombre}:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export {GET${nombre}ALL, GET${nombre}, POST${nombre}, PUT${nombre}, DELETE${nombre}};
        `;

        // Escribir el archivo services.ts
        fs.writeFileSync(serviceFilePath, serviceContent);
        console.log(`Archivo ${nombre}Service.ts creado en ${serviceFilePath}`);
    } catch (error) {
        console.error("Error creando el archivo services.ts:", error);
    }
};

const crearRutas = (nombre: string, basePath: string) => {
    if (!nombre) {
        console.error("El nombre de la clase es obligatorio para crear las rutas.");
        return;
    }

    const routesPath = path.join(basePath, `src/routes/`);
    const routesFilePath = path.join(routesPath, `${nombre}Routes.ts`);

    if (!fs.existsSync(routesPath)) fs.mkdirSync(routesPath, { recursive: true });

    try {
        // Crear contenido del archivo de rutas
        const routesContent = `
import { Router } from "express";
import { GET${nombre}ALL, GET${nombre}, POST${nombre}, PUT${nombre}, DELETE${nombre} } from "../services/${nombre}Service";

const router = Router();

// Rutas CRUD
router.get("/${nombre.toLowerCase()}", GET${nombre}ALL);
router.get("/${nombre.toLowerCase()}/:id", GET${nombre});
router.post("/${nombre.toLowerCase()}", POST${nombre});
router.put("/${nombre.toLowerCase()}/:id", PUT${nombre});
router.delete("/${nombre.toLowerCase()}/:id", DELETE${nombre});

export default router;
        `;

        // Escribir el archivo de rutas
        fs.writeFileSync(routesFilePath, routesContent);
        console.log(`Archivo de rutas ${nombre}Routes.ts creado en ${routesFilePath}`);
    } catch (error) {
        console.error("Error creando el archivo de rutas:", error);
    }
};

const crearModelo = (clase: any, basePath: string) => {
    const { nombre, atributos } = clase;

    if (!nombre || !atributos || !Array.isArray(atributos)) {
        console.error("La clase debe tener un nombre y una lista de atributos.");
        return;
    }

    const modelsPath = path.join(basePath, `src/models/`);
    const modelFilePath = path.join(modelsPath, `${nombre.toLowerCase()}Model.ts`);

    if (!fs.existsSync(modelsPath)) fs.mkdirSync(modelsPath, { recursive: true });

    try {
        // Crear contenido del archivo del modelo
        const modelContent = `
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from "../config/mysql";

// Definición de los atributos del modelo
interface ${nombre}Attributes {
    ${atributos.map(attr => `${attr}: string;`).join("\n    ")}
    ID: number;
}

// Atributos opcionales para la creación del modelo
interface ${nombre}CreationAttributes extends Optional<${nombre}Attributes, 'ID'> {}

// Definición de la clase de modelo
class ${nombre} extends Model<${nombre}Attributes, ${nombre}CreationAttributes> implements ${nombre}Attributes {
    public ID!: number;
    ${atributos.map(attr => `public ${attr}!: string;`).join("\n    ")}
}

// Inicialización del modelo
${nombre}.init({
    ID: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    ${atributos
        .map(attr => `
    ${attr}: {
        type: DataTypes.STRING,
        allowNull: false
    }`)
        .join(",")}
}, {
    sequelize,
    tableName: '${nombre.toLowerCase()}',
    timestamps: false,
});

export { ${nombre}, ${nombre}Attributes };
        `;

        // Escribir el archivo del modelo
        fs.writeFileSync(modelFilePath, modelContent);
        console.log(`Archivo de modelo ${nombre.toLowerCase()}.model.ts creado en ${modelFilePath}`);
    } catch (error) {
        console.error("Error creando el archivo del modelo:", error);
    }
};

const crearArchivosClase = (clase: any, basePath: string) => {
    crearServices(clase, basePath);
    crearRutas(clase.nombre, basePath);
    crearModelo(clase, basePath);
}

export {crearArchivosClase};