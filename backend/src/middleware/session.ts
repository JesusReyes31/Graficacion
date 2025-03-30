import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Usuarios } from "../models/usuarios.model";

const SECRET_KEY = process.env.JWT_SECRET || "secreto.01";

interface CustomRequest extends Request {
  Usuarios?: JwtPayload;
}

const checkAuth = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers["authorization"];
    if (!token) {
      res.status(401).json({ message: "Token no proporcionado" });
      return;
    }
    const decoded = jwt.verify(token, SECRET_KEY) as JwtPayload;
    req.body.user = decoded.User;
    const userFound = await Usuarios.findByPk(req.body.user.No_Cuenta);
    if (!userFound) {
      res.status(401).json({ message: "Usuario no encontrado" });
      return;
    }
    next();
  } catch (error) {
    res.status(403).json({ message: "Token no válido o expirado" });
    return;
  }
};

const checkRole = (roles: string[]) => {
  return async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.body.user) {
        res.status(401).json({ message: "No autenticado" });
        return;
      }
      const userType = req.body.user.Tipo;
      if (!roles.includes(userType)) {
        res.status(403).json({ message: "Acceso denegado" });
        return;
      }
      next();
    } catch (error) {
      res.status(500).json({ message: "Error en la verificación de rol" });
      return;
    }
  };
};

export { checkAuth, checkRole };