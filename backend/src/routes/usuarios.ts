import { Router } from "express";
import { deleteUsuario, getUsuarios, postUsuario, putUsuario } from "../controllers/usuarios.controller";
import { checkAuth } from "../middleware/session";

const router = Router();

router.get('/',checkAuth,getUsuarios);
router.post('/',checkAuth,postUsuario);
router.put('/:id',checkAuth,putUsuario);
router.delete('/:id',checkAuth,deleteUsuario);

export { router };