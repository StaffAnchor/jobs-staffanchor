"use client";

import { useState } from "react";
import { toast } from "sonner";
import { KeyRound, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Sign-in is an emailed code by default -- nothing to remember. A password is
// a strictly optional extra for people who prefer typing one; setting or
// changing it works the same way (you're already signed in, so it's just
// "choose a new one").
export default function AccountSecurityCard({ email }: { email: string | null | undefined }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }
    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (updateError) {
      // Supabase can require a recent sign-in before a password change.
      setError(
        /reauth|recent/i.test(updateError.message)
          ? "For your security, please sign out, sign back in with an email code, and try again."
          : updateError.message
      );
      return;
    }
    toast.success("Password saved. You can now sign in with it or with an email code.");
    setPassword("");
    setConfirm("");
    setOpen(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.assign("/candidate-login");
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <KeyRound className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Sign-in &amp; security</p>
            <p className="mt-0.5 text-xs leading-5 text-slate-500">
              Signed in as <span className="font-medium text-slate-700">{email ?? "your account"}</span>. You sign in
              with an emailed code — a password is optional.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!open && (
            <Button type="button" variant="outline" onClick={() => setOpen(true)}>
              Set / change password
            </Button>
          )}
          <Button type="button" variant="ghost" onClick={handleSignOut}>
            <LogOut className="mr-1.5 h-3.5 w-3.5" /> Sign out
          </Button>
        </div>
      </div>

      {open && (
        <form onSubmit={handleSave} className="mt-4 grid max-w-md gap-3">
          <Input
            type="password"
            autoComplete="new-password"
            placeholder="New password (8+ characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            type="password"
            autoComplete="new-password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex items-center gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save password"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setOpen(false);
                setError(null);
                setPassword("");
                setConfirm("");
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
