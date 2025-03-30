import { Response } from "express";

const handleHttp = (res:Response, error:String,errorRaw?:any) => {
    res.status(500);
    res.send({error});
} 

export {handleHttp};