import { Router } from "express";
import { deleteProyecto, getProyecto, getProyectos, postProyecto, putProyecto } from "../controllers/proyectos.controller";

const router = Router();

router.get('/',getProyectos);
router.get('/:id',getProyecto);
router.post('/',postProyecto);
router.put('/:id',putProyecto);
router.delete('/:id',deleteProyecto);

export { router };