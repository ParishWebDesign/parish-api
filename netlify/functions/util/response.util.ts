import type { HandlerResponse } from "@netlify/functions";

export function createResponse<T extends object>(status: number, body: T): HandlerResponse {
  return {
    statusCode: status,
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      "access-control-allow-origin": "*",
    },
  };
}
