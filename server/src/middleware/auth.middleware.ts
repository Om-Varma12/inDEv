import type { Request, Response, NextFunction } from 'express';
import { cognitoVerifier } from '../services/cognito.service.js';

export async function authenticate(
    req: Request,
    res: Response,
    next: NextFunction,
){
    try{
        const authHeader = req.headers.authorization;

        if(!authHeader){
            return res.status(401).json({
                message: "Auth header is missing",
            });
        }
        
        if(!authHeader.startsWith("Bearer ")){
            return res.status(401).json({
                message: "Invalid auth format",
            });
        }

        const token = authHeader.substring(7);

        if(!token){
            return res.status(401).json({
                message: "Access token is missing",
            });
        }

        const payload = await cognitoVerifier.verify(token);
        
        req.user = payload;

        next();
        // either return some value, or use next() to pass execution to
        // next function whatever that is
    }
    catch(error){
        console.error("auth failed", error)
        return res.status(401).json({
            message: "invalid or expired access token",
        });
    }
}