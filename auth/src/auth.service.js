import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { hashPassword, comparePassword } from "./hash.js";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TableName = process.env.USERS_TABLE;

export async function register(email, password) {
  const existing = await client.send(new GetCommand({ TableName, Key: { email } }));
  if (existing.Item) throw new Error("User already existssss");

  const passwordHash = await hashPassword(password);
  await client.send(new PutCommand({ TableName, Item: { email, passwordHash } }));
  return { email };
}

export async function login(email, password) {
  const user = await client.send(new GetCommand({ TableName, Key: { email } }));
  if (!user.Item) throw new Error("Invalid email or password");
  
  const ok = await comparePassword(password, user.Item.passwordHash);
  if (!ok) throw new Error("Invalid email or password");
  
  return { email };
}
