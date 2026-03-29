"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { ArrowLeft, LogOut, Moon, Monitor, Sun } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

type ThemeOption = "light" | "dark" | "system";

interface UserData {
  name: string | null;
  email: string;
}

interface Preferences {
  themePreference: ThemeOption;
  notificationsEnabled: boolean;
}

const THEME_OPTIONS: { value: ThemeOption; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export default function PreferencesPage() {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [user, setUser] = useState<UserData | null>(null);
  const [prefs, setPrefs] = useState<Preferences>({
    themePreference: "system",
    notificationsEnabled: true,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [meRes, prefsRes] = await Promise.all([
          fetch("/api/me"),
          fetch("/api/preferences"),
        ]);
        if (meRes.ok) setUser(await meRes.json());
        if (prefsRes.ok) {
          const data = await prefsRes.json();
          setPrefs(data);
          setTheme(data.themePreference);
        }
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [setTheme]);

  const savePreference = useCallback(async (updates: Partial<Preferences>) => {
    const res = await fetch("/api/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      toast.error("Failed to save preference");
    }
  }, []);

  function handleThemeChange(theme: ThemeOption) {
    setPrefs((prev) => ({ ...prev, themePreference: theme }));
    setTheme(theme);
    savePreference({ themePreference: theme });
    toast.success(`Theme set to ${theme}`);
  }

  function handleNotificationsChange(enabled: boolean) {
    setPrefs((prev) => ({ ...prev, notificationsEnabled: enabled }));
    savePreference({ notificationsEnabled: enabled });
    toast.success(enabled ? "Notifications enabled" : "Notifications disabled");
  }

  async function handleLogout() {
    await authClient.signOut();
    router.push("/login");
  }

  if (isLoading) {
    return (
      <main className="mx-auto min-h-svh w-full max-w-xl px-5 pt-[max(env(safe-area-inset-top,0px)+0.5rem,2rem)]">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-32 rounded bg-muted" />
          <div className="h-24 rounded bg-muted" />
          <div className="h-24 rounded bg-muted" />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-svh w-full max-w-xl px-5 pb-safe pt-[max(env(safe-area-inset-top,0px)+0.5rem,2rem)]">
      <header className="mb-8 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/")}
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-2xl font-bold">Preferences</h1>
      </header>

      {/* Appearance */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Appearance
        </h2>
        <div className="flex gap-2">
          {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => handleThemeChange(value)}
              className={`flex flex-1 flex-col items-center gap-1.5 rounded-lg border p-3 transition-colors ${
                prefs.themePreference === value
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-muted-foreground hover:border-foreground/20"
              }`}
            >
              <Icon size={20} />
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Notifications */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Notifications
        </h2>
        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div>
            <Label htmlFor="notifications" className="text-sm font-medium">
              Push notifications
            </Label>
            <p className="text-xs text-muted-foreground">
              Get notified when listings are ready
            </p>
          </div>
          <Switch
            id="notifications"
            checked={prefs.notificationsEnabled}
            onCheckedChange={handleNotificationsChange}
          />
        </div>
      </section>

      {/* Account */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Account
        </h2>
        <div className="space-y-4 rounded-lg border border-border p-4">
          {user?.email && (
            <p className="text-sm text-muted-foreground">{user.email}</p>
          )}
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut size={16} />
            Log out
          </Button>
        </div>
      </section>
    </main>
  );
}
