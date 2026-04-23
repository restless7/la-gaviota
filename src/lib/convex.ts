import { ConvexHttpClient } from "convex/browser";
import { ConvexReactClient } from "convex/react";

export const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL || "https://reminiscent-meadowlark-870.convex.cloud");
