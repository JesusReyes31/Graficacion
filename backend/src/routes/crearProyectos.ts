import { Router } from "express";
import { createProjectBackend } from "../services/backendservices";
import { createProjectFront } from "../services/frontservices";
const router = Router();  

router.post("/createProjectFront", createProjectFront);
router.post("/createProjectBackend", createProjectBackend);

export {router};