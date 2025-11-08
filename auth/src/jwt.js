const jwt = require('jsonwebtoken');
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');

const ssmClient = new SSMClient({ region: process.env.AWS_REGION || 'ap-south-1' });

let jwtSecret = null;

const getJwtSecret = async () => {
  if (jwtSecret) return jwtSecret;
  
  try {
    const paramPath = process.env.JWT_SECRET_PARAM_PATH || '/auth-basic/dev/JWT_SECRET';
    console.log('Fetching JWT secret from:', paramPath);
    
    const command = new GetParameterCommand({
      Name: paramPath,
      WithDecryption: true
    });
    
    const response = await ssmClient.send(command);
    jwtSecret = response.Parameter.Value;
    console.log('JWT secret fetched successfully');
    return jwtSecret;
  } catch (error) {
    console.error('Error fetching JWT secret from SSM:', error);
    // Fallback for development
    const fallback = process.env.JWT_SECRET_FALLBACK || 'dev-secret-key-minimum-32-chars-long-here';
    console.log('Using fallback JWT secret');
    return fallback;
  }
};

const sign = async (payload) => {
  const secret = await getJwtSecret();
  return jwt.sign(payload, secret, { expiresIn: '24h' });
};

const verify = async (token) => {
  const secret = await getJwtSecret();
  return jwt.verify(token, secret);
};

module.exports = { sign, verify };