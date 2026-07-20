import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Typed wrapper for the Supabase beta auth.oauth namespace so we don't rely on
// SDK type surface that may not yet be exported.
type OAuthClient = { name?: string; client_uri?: string; redirect_uris?: string[] };
type AuthorizationDetails = {
  client?: OAuthClient;
  scope?: string;
  redirect_url?: string;
  redirect_to?: string;
} | null;

const authOAuth = (supabase.auth as any).oauth as {
  getAuthorizationDetails: (id: string) => Promise<{ data: AuthorizationDetails; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
};

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<AuthorizationDetails>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/auth?next=" + encodeURIComponent(next);
        return;
      }
      setUserEmail(sess.session.user.email ?? null);
      if (!authOAuth?.getAuthorizationDetails) {
        setError("This project's authentication service does not have OAuth enabled.");
        return;
      }
      try {
        const { data, error } = await authOAuth.getAuthorizationDetails(authorizationId);
        if (!active) return;
        if (error) {
          setError(error.message ?? "Failed to load authorization request.");
          return;
        }
        const immediate = data?.redirect_url ?? data?.redirect_to;
        if (immediate && !data?.client) {
          window.location.href = immediate;
          return;
        }
        setDetails(data);
      } catch (e: any) {
        if (!active) return;
        setError(e?.message ?? String(e));
      }
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    try {
      const { data, error } = approve
        ? await authOAuth.approveAuthorization(authorizationId)
        : await authOAuth.denyAuthorization(authorizationId);
      if (error) {
        setBusy(false);
        setError(error.message ?? "Request failed.");
        return;
      }
      const target = data?.redirect_url ?? data?.redirect_to;
      if (!target) {
        setBusy(false);
        setError("No redirect returned by the authorization server.");
        return;
      }
      window.location.href = target;
    } catch (e: any) {
      setBusy(false);
      setError(e?.message ?? String(e));
    }
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authorization error</CardTitle>
            <CardDescription>Could not load this authorization request.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  const clientName = details.client?.name ?? "an external app";
  const scopes = (details.scope ?? "").split(/\s+/).filter(Boolean);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-subtle p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Connect {clientName} to ShowPro</CardTitle>
          <CardDescription>
            {clientName} will be able to call ShowPro's enabled tools while you are signed in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {userEmail && (
            <p className="text-sm">
              Signed in as <span className="font-medium">{userEmail}</span>
            </p>
          )}
          {scopes.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-1">Requested access</p>
              <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-0.5">
                {scopes.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            This does not bypass ShowPro's permissions or backend policies.
          </p>
          <div className="flex gap-2 pt-2">
            <Button className="flex-1" disabled={busy} onClick={() => decide(true)}>
              {busy ? "Working…" : "Approve"}
            </Button>
            <Button variant="outline" className="flex-1" disabled={busy} onClick={() => decide(false)}>
              Cancel connection
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
