import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from 'bcryptjs';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const register = async (email, password) => {
  // Check if user exists
  const getCommand = new GetCommand({
    TableName: process.env.USERS_TABLE,
    Key: { email }
  });

  const existingUser = await docClient.send(getCommand);
  if (existingUser.Item) {
    throw new Error('User already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const putCommand = new PutCommand({
    TableName: process.env.USERS_TABLE,
    Item: {
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  });

  await docClient.send(putCommand);

  return {
    email,
    createdAt: new Date().toISOString()
  };
};

export const login = async (email, password) => {
  const getCommand = new GetCommand({
    TableName: process.env.USERS_TABLE,
    Key: { email }
  });

  const result = await docClient.send(getCommand);
  const user = result.Item;

  if (!user) {
    throw new Error('User not found');
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new Error('Invalid password');
  }

  return {
    email: user.email,
    createdAt: user.createdAt
  };
};