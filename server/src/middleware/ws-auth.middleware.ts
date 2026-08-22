import { IncomingMessage } from "node:http";
import { cognitoVerifier } from "../services/cognito.service.js";
import { error } from "node:console";

export async function authenticateWebSocket(
    req: IncomingMessage
){
    const url = new URL(
        req.url ?? "",
        `http://${req.headers.host}`
    );

    const token = url.searchParams.get("token");

    if(!token){
        throw new Error("Acess token is missing")       
    }

    const payload = await cognitoVerifier.verify(token);
    
    return payload;
}