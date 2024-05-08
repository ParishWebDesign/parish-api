import fetch from "node-fetch";

import { getFeed } from "./util/rss.util";
import { createResponse } from "./util/response.util";

import type { Handler } from "@netlify/functions";
import { isNotEmpty } from "./util/string.util";
import { parse } from "date-fns";

const FLOCK_NOTE_RSS_URL = "https://rss.flocknote.com/";

export interface FlockNote {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  guid: string;
}

export interface FlockNoteFeed {
  rss?: {
    script: string;
    channel: {
      title: string;
      link: string;
      description: string;
      item: FlockNote[];
    };
    _version: string;
  };
}

async function getFlockNotes(account: string) {
  try {
    const feed = await getFeed<FlockNoteFeed>(`${FLOCK_NOTE_RSS_URL}${account}`);
    if (feed === null) {
      return [];
    }

    const { item: entries = [] } = feed?.rss?.channel ?? {};
    if (entries.length > 0) {
      return entries
        .filter((note) => isNotEmpty(note.description))
        .map((note) => ({
          title: note.title,
          summary: note.description,
          link: note.link,
          image: "/flocknote.png",
          date: parse(note.pubDate, "EEE, dd MMM yyyy HH:mm:ss xx", new Date()),
          target: "_blank",
        }));
    }
  } catch (e: unknown) {
    console.log("Unknown error", e);
  }

  return [];
}

export const handler: Handler = async (event) => {
  const account = event.path.replace("/.netlify/functions/flocknotes/", "");

  if (!/^[0-9]+$/.test(account)) {
    return createResponse(400, { message: "Invalid account" });
  }

  return createResponse(200, { notes: await getFlockNotes(account) });
};
