import { format } from "date-fns";
import fetch from "node-fetch";

import { isNullish } from "./util/null.util";
import { createResponse } from "./util/response.util";
import { getFeed } from "./util/rss.util";

import type { Handler } from "@netlify/functions";

const DAILY_READINGS_RSS = "https://bible.usccb.org/readings.rss";
const ENTRY_REGEX = /<h4>[ ]*([^\n]+)[ ]*<a[ ]*href="([^\n]+)[ ]*"[ \\]*>[ ]*([^\n]+)[ ]*<\/a>[ ]*<\/h4>/g;

interface Reading {
  title: string;
  link: string;
  description: string;
}

interface FeedReading {
  rss?: {
    channel?: {
      link?: string;
      title?: string;
      item?: {
        link?: string;
        title?: string;
        description?: string;
      }[];
    };
  };
}

async function getDailyReadings(): Promise<Reading[]> {
  try {
    const feed = await getFeed<FeedReading>(DAILY_READINGS_RSS);
    if (feed === null) {
      return [];
    }

    const { item: entries = [] } = feed?.rss?.channel ?? {};
    if (entries.length > 0) {
      const { description = "" } = entries[0];

      const readings: Reading[] = [];

      let match: RegExpExecArray | null;
      do {
        match = ENTRY_REGEX.exec(description);
        if (match && match.length === 4) {
          readings.push({
            title: match[1].trim(),
            link: match[2].trim(),
            description: match[3].trim(),
          });
        }
      } while (match && match.length === 4);

      return readings;
    }
  } catch (e: unknown) {
    console.log("Unknown error", e);
  }

  return [];
}

interface SoundCloudAPIResponse {
  html: string;
}

async function getDailyReadingsPodcast(): Promise<string | null> {
  try {
    const soundCloudResponse = await fetch(
      `https://soundcloud.com/oembed?format=json&url=https%3A%2F%2Fsoundcloud.com%2Fusccb-readings%2Fdaily-mass-reading-podcast-for-${format(
        new Date(),
        "MMMM-d-yyyy"
      ).toLowerCase()}&iframe=true`
    );
    if (!soundCloudResponse.ok) {
      return null;
    }

    const contents = (await soundCloudResponse.json()) as SoundCloudAPIResponse;
    if (isNullish(contents)) {
      return null;
    }

    const matches = /(?<=src=").*?(?=[*"])/i.exec(contents.html);
    if (!matches || matches.length < 1) {
      return null;
    }

    return (
      `${matches[0]}&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=true&visual=true` ??
      null
    );
  } catch (e) {
    console.log("Unknown error", e);
  }

  return null;
}

export const handler: Handler = async () => {
  return createResponse(200, {
    readings: await getDailyReadings(),
    podcastUrl: await getDailyReadingsPodcast(),
  });
};
