import "dotenv/config"
import express,{Request,Response}  from "express";
import cors from "cors";
import { router } from "./routes";
import "./models"

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({
  origin: '*', // Cambia al origen correcto de tu frontend
  exposedHeaders: ['Authorization'] 
}));
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
