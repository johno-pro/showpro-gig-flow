import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_bookings",
  title: "List bookings",
  description:
    "List bookings visible to the signed-in user. Supports optional date-range filtering and result limit. Returns job code, dates, status, artist/client/venue ids, and fees.",
  inputSchema: {
    from: z.string().optional().describe("Optional start date filter (YYYY-MM-DD or ISO). Only bookings with start_date >= from are returned."),
    to: z.string().optional().describe("Optional end date filter (YYYY-MM-DD or ISO). Only bookings with start_date <= to are returned."),
    status: z.string().optional().describe("Optional status filter (e.g. confirmed, pending, cancelled)."),
    limit: z.number().int().min(1).max(200).optional().describe("Max rows to return (default 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ from, to, status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let q = supabase
      .from("bookings")
      .select("id, job_code, start_date, finish_date, status, artist_id, client_id, venue_id, sell_fee, buy_fee, artist_status, client_status")
      .order("start_date", { ascending: false })
      .limit(limit ?? 50);
    if (from) q = q.gte("start_date", from);
    if (to) q = q.lte("start_date", to);
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { bookings: data ?? [] },
    };
  },
});
