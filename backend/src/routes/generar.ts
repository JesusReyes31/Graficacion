import { Router } from "express";
import { generarproyecto } from "../controllers/generar.controller";
const router = Router();  

router.post("/", generarproyecto);

export {router};