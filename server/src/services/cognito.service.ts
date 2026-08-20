import { CognitoJwtVerifier } from "aws-jwt-verify";

const userPoolId = process.env.COGNITO_USER_POOL;
const clientId = process.env.COGNITO_CLIENT_ID;

if(!userPoolId){
    throw new Error("COGNITO_USER_POOL_ID is not defined");
}
if(!clientId){
    throw new Error("COGNITO_CLIENT_ID is not defined");
}

export const cognitoVerifier = CognitoJwtVerifier.create({
    userPoolId,
    clientId,
    tokenUse: "access", 
});