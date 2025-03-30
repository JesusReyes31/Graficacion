import { Router } from "express";
import { deleteVersion, getVersiones, postVersion, putVersion } from "../controllers/versiones.controller";


const router = Router();

router.get('/:id',getVersiones);
router.post('/',postVersion);
router.put('/:id',putVersion);
router.delete('/:id',deleteVersion);

export { router };