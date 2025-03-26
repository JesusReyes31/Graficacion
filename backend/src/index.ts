import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { router } from "./routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(router);

// Ruta de prueba
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "¡Servidor con TypeScript funcionando!" });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
