import { defineDisableDraftMode } from "next-sanity/draft-mode";
import { client } from "@/lib/sanity/client";

export const { GET } = defineDisableDraftMode({
  client: client.withConfig({ token: process.env.SANITY_VIEWER_TOKEN }),
});
