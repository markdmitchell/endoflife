import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, LogOut, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Sign in — endoflife.tech" },
      { name: "description", content: "Sign in to manage lifecycle data and inventory." },
      { property: "og:title", content: "Sign in — endoflife.tech" },
      { property: "og:description", content: "Sign in to manage lifecycle data and inventory." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Auth,
});

function Auth() {
  const nav = useNavigate();
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function checkAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          setCurrentUserEmail(session?.user?.email ?? null);
          setIsCheckingAuth(false);
        }
      } catch {
        if (mounted) setIsCheckingAuth(false);
      }
    }

    void checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setCurrentUserEmail(session?.user?.email ?? null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setCurrentUserEmail(null);
      toast.success("Signed out successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to sign out");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setIsSubmitting(true);
    try {
      const result =
        mode === "signin"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({ email, password });

      if (result.error) {
        setMessage(result.error.message);
      } else if (mode === "signup" && !result.data.session) {
        setMessage("Check your email to confirm your account.");
      } else {
        nav({ to: "/admin" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const google = async () => {
    setMessage("");
    const r = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (r.error) setMessage(r.error.message);
    else if (!r.redirected) nav({ to: "/admin" });
  };

  if (!isCheckingAuth && currentUserEmail) {
    return (
      <div className="mx-auto max-w-md py-12 px-4">
        <div className="mb-8 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
            <User className="size-6" />
          </span>
          <h1 className="mt-4 font-display text-2xl font-semibold">Account Overview</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You are currently signed in to endoflife.tech.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Signed In As
            </span>
            <div className="mt-1.5 rounded-lg border border-border bg-muted/60 px-3.5 py-2.5 font-mono text-sm font-semibold text-foreground break-all">
              {currentUserEmail}
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            <Button asChild className="w-full justify-between" size="lg">
              <Link to="/admin">
                <span>Go to Administration</span>
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-between" size="lg">
              <Link to="/">
                <span>Browse Lifecycle Catalog</span>
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="w-full gap-2 mt-4 cursor-pointer"
              onClick={handleSignOut}
            >
              <LogOut className="size-4" />
              <span>Log out</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-8 px-4">
      <div className="mb-8 text-center">
        <span className="mx-auto grid size-11 place-items-center rounded-md bg-primary text-primary-foreground">
          <ShieldCheck className="size-6" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-semibold">
          {mode === "signin" ? "Sign in to your workspace" : "Create your account"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage inventory, sources, and lifecycle synchronization.
        </p>
      </div>

      <form onSubmit={submit} className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="mt-4 space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            minLength={8}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {message && (
          <p className="mt-4 rounded-md border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive">
            {message}
          </p>
        )}

        <Button className="mt-6 w-full cursor-pointer" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Processing..." : mode === "signin" ? "Sign in" : "Create account"}
        </Button>

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full cursor-pointer"
          onClick={google}
        >
          Continue with Google
        </Button>

        <button
          type="button"
          className="mt-5 w-full text-center text-sm font-medium text-primary hover:underline cursor-pointer"
          onClick={() => {
            setMessage("");
            setMode(mode === "signin" ? "signup" : "signin");
          }}
        >
          {mode === "signin" ? "Create an account" : "Already have an account? Sign in"}
        </button>
      </form>
    </div>
  );
}