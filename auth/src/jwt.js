import jwt from 'jsonwebtoken';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

const ssmClient = new SSMClient({ region: process.env.AWS_REGION || 'ap-south-1' });

let jwtSecret = null;

const getJwtSecret = async () => {
  if (jwtSecret) return jwtSecret;
  
  try {
    const command = new GetParameterCommand({
      Name: process.env.JWT_SECRET_PARAM_PATH || '/auth-basic/dev/JWT_SECRET',
      WithDecryption: true
    });
    
    const response = await ssmClient.send(command);
    jwtSecret = response.Parameter.Value;
    return jwtSecret;
  } catch (error) {
    console.error('Error fetching JWT secret from SSM:', error);
    // Fallback to environment variable or default for development
    return process.env.JWT_SECRET_FALLBACK || 'fallback-secret-key-for-dev-only';
  }
};

export const verify = {
  sign: async (payload) => {
    const secret = await getJwtSecret();
    return jwt.sign(payload, secret, { expiresIn: '24h' });
  },
  
  verify: async (token) => {
    const secret = await getJwtSecret();
    return jwt.verify(token, secret);
  }
};