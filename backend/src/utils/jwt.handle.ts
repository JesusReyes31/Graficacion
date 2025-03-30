import{ sign, verify }from "jsonwebtoken";
import { user } from "../models/users.model";
const JWT_SECRET =process.env.JWT_SECRET || "secreto.01";

const generateToken = (User:user) =>{
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