import { MongoClient, ServerApiVersion } from "mongodb";

export async function getMongoClient(): Promise<MongoClient> {
  const uri = `mongodb+srv://${process.env.MONGO_DATABASE_USERNAME}:${process.env.MONGO_DATABASE_PASSWORD}@${process.env.MONGO_DATABASE_ADDRESS}/?retryWrites=true&w=majority&appName=${process.env.MONGO_DATABASE_APP_NAME}`;

  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  } as any);

  return client.connect();
}
