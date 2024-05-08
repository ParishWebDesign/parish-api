import { XMLParser } from "fast-xml-parser";
import fetch from "node-fetch";

import { isEmpty } from "./string.util";

export async function getFeed<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url);
    const contents = await response.text();
    if (isEmpty(contents)) {
      return null;
    }

    return new XMLParser().parse(contents) as T;
  } catch {
    return null;
  }
}
