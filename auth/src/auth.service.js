const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, PutCommand } = require("@aws-sdk/lib-dynamodb");
const bcrypt = require("bcryptjs");

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TableName = process.env.USERS_TABLE;

async function register(email, password) {
  const existing = await ddb.send(new GetCommand({ TableName, Key: { email } }));
  if (existing.Item) throw new Error("User already exists");

  const passwordHash = await bcrypt.hash(password, 10);
  await ddb.send(new PutCommand({
    TableName,
    Item: {
      email,
      passwordHash,
      createdAt: new Date().toISOString()
    }
  }));

  return { email };
}

async function login(email, password) {
  const found = await ddb.send(new GetCommand({ TableName, Key: { email } }));
  if (!found.Item) throw new Error("Invalid credentials");

  const ok = await bcrypt.compare(password, found.Item.passwordHash);
  if (!ok) throw new Error("Invalid credentials");

  return { email };
}

module.exports = { register, login };
