import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { KeyRound, Plus, Trash2, RefreshCw, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface GeminiKey {
  id: string;
  name: string;
  api_key: string;
  is_active: boolean;
  status: string;
  priority: number;
  last_used_at: string | null;
  last_error: string | null;
  error_count: number;
  created_at: string;
}

export function AdvancedSettings() {
  const { user } = useAuth();
  const [keys, setKeys] = useState<GeminiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [priority, setPriority] = useState("0");
  const [reveal, setReveal] = useState<Record<string, boolean>>({});

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("gemini_api_keys")
      .select("*")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setKeys((data as GeminiKey[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user]);

  const add = async () => {
    if (!user) return toast.error("Sign in required");
    if (!name.trim() || !apiKey.trim()) return toast.error("Name and API key required");
    const { error } = await supabase.from("gemini_api_keys").insert({
      user_id: user.id,
      name: name.trim(),
      api_key: apiKey.trim(),
      priority: Number(priority) || 0,
    });
    if (error) return toast.error(error.message);
    toast.success("Key added");
    setName("");
    setApiKey("");
    setPriority("0");
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("gemini_api_keys").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Key deleted");
    load();
  };

  const toggle = async (k: GeminiKey) => {
    const { error } = await supabase
      .from("gemini_api_keys")
      .update({ is_active: !k.is_active })
      .eq("id", k.id);
    if (error) return toast.error(error.message);
    load();
  };

  const reactivate = async (id: string) => {
    const { error } = await supabase
      .from("gemini_api_keys")
      .update({ status: "active", last_error: null, error_count: 0 })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Key reactivated");
    load();
  };

  const mask = (k: string) => (k.length <= 8 ? "••••" : `${k.slice(0, 4)}••••${k.slice(-4)}`);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <KeyRound className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold font-display">Advanced — Gemini API Keys</h2>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Add a new key</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Keys are tried in priority order (highest first). If one is rate-limited or invalid, the next key is used automatically. If all fail, the built-in AI gateway is used as a fallback.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input placeholder="Personal key" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label>Gemini API Key</Label>
              <Input placeholder="AIza..." value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Priority (higher = used first)</Label>
              <Input type="number" value={priority} onChange={(e) => setPriority(e.target.value)} />
            </div>
          </div>
          <Button onClick={add} className="gap-2">
            <Plus className="h-4 w-4" /> Add Key
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Your Keys ({keys.length})</CardTitle>
          <Button variant="ghost" size="sm" onClick={load} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {keys.length === 0 && (
            <p className="text-sm text-muted-foreground">No keys yet. Add one above to override the built-in AI.</p>
          )}
          {keys.map((k) => (
            <div key={k.id} className="flex flex-wrap items-center gap-3 border rounded-lg p-3">
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{k.name}</span>
                  <Badge variant={k.status === "active" ? "default" : "destructive"}>{k.status}</Badge>
                  <Badge variant="outline">prio {k.priority}</Badge>
                </div>
                <div className="text-xs text-muted-foreground font-mono mt-1 flex items-center gap-2">
                  {reveal[k.id] ? k.api_key : mask(k.api_key)}
                  <button
                    onClick={() => setReveal((r) => ({ ...r, [k.id]: !r[k.id] }))}
                    className="text-primary hover:underline"
                    type="button"
                  >
                    {reveal[k.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </button>
                </div>
                {k.last_error && <div className="text-xs text-destructive mt-1">Last error: {k.last_error}</div>}
                {k.last_used_at && (
                  <div className="text-xs text-muted-foreground">Last used: {new Date(k.last_used_at).toLocaleString()}</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs">Active</Label>
                <Switch checked={k.is_active} onCheckedChange={() => toggle(k)} />
                {k.status !== "active" && (
                  <Button variant="outline" size="sm" onClick={() => reactivate(k.id)}>
                    Reactivate
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => remove(k.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}