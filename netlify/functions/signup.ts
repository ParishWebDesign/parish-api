import { getMongoClient } from "./util/mongo.util";
import { isNullish } from "./util/null.util";
import { createErrorResponse, createResponse } from "./util/response.util";
import { isEmpty } from "./util/string.util";

import type { Handler } from "@netlify/functions";
import type { MongoClient } from "mongodb";

interface SignUpForm {
  name: string;
  email: string;
}

export const handler: Handler = async (event) => {
  if (isNullish(event.body)) {
    return createErrorResponse(400, "No input");
  }

  let body: SignUpForm;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    console.log("Unknown error", e, event);
    return createErrorResponse(400, "Bad input");
  }

  if (isEmpty(body.name) || isEmpty(body.email)) {
    return createErrorResponse(400, "Bad input");
  }

  let client: MongoClient | undefined;

  try {
    const client = await getMongoClient();
    const database = client.db(process.env.MONGO_DATABASE_DATABASE);
    const requests = database.collection("requests");

    const doc = {
      name: `${body.name}`,
      email: `${body.email}`,
    };

    await requests.insertOne(doc);

    await client?.close();
    return createResponse(200, { message: "Contact request saved" });
  } catch (e) {
    console.log("Error creating database document", e, event);
    await client?.close();
    return createErrorResponse(500, "Error creating database document");
  }
};
