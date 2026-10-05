import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-side helper for client-portal API routes: resolves the signed-in
// client user from a bearer token and returns a service-role client for the
// follow-up work. Every route using it must still check that what is being
// asked for belongs to this client.
export type ClientContext = {
  admin: SupabaseClient;
  userId: string;
  email: string;
  clientId: string;
  clientName: string;
};

export async function getClientContext(authHeader: string | null): Promise<ClientContext | { error: string; status: number }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return { error: "This feature isn't fully configured yet.", status: 503 };
  const token = authHeader?.replace(/^Bearer\s+/i, "").trim();
  if (!token) return { error: "Please sign in again.", status: 401 };

  const admin = createSupabaseClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData.user) return { error: "Please sign in again.", status: 401 };

  const { data: cu } = await admin.from("client_users").select("client_id, email").eq("id", userData.user.id).maybeSingle();
  if (!cu?.client_id) return { error: "No client portal access for this account.", status: 403 };
  const { data: client } = await admin.from("clients").select("name").eq("id", cu.client_id).maybeSingle();

  return {
    admin,
    userId: userData.user.id,
    email: (cu.email ?? userData.user.email ?? "").toLowerCase(),
    clientId: cu.client_id as string,
    clientName: (client?.name as string | undefined) ?? "your company",
  };
}
