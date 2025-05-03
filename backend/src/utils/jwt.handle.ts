import{ sign, verify }from "jsonwebtoken";
import { Usuarios } from "../models/usuarios.model";
const JWT_SECRET =process.env.JWT_SECRET || "secreto.01";

const generateToken = (User:Usuarios) =>{
    const jwt = sign({User}, JWT_SECRET,{
        expiresIn:"24h",
    });
    return jwt;
}
const verifyToken = (token:string)=>{
   const isOk= verify(token, JWT_SECRET);
   return isOk;
}

export{generateToken, verifyToken};