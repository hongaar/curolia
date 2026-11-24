import { supabase } from "@/lib/supabase";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export type ApiKeyScope = "read" | "write";

export type ApiKeySummary = {
  id: string;
  name: string;
  prefix: string;
  scopes: ApiKeyScope[];
  last_used_at: string | null;
  created_at: string;
  revoked_at: string | null;
};

const apiKeysQueryKey = (userId: string | undefined) => ["api-keys", userId];

export function useApiKeys(userId: string | undefined) {
  return useQuery({
    queryKey: apiKeysQueryKey(userId),
    enabled: Boolean(userId),
    queryFn: async (): Promise<ApiKeySummary[]> => {
      const { data, error } = await supabase
        .from("api_keys")
        .select(
          "id, name, prefix, scopes, last_used_at, created_at, revoked_at",
        )
        .is("revoked_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ApiKeySummary[];
    },
  });
}

export function useApiKeyMutations(userId: string | undefined) {
  const qc = useQueryClient();
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: apiKeysQueryKey(userId) });

  return {
    /** Returns the plaintext key — shown once, never stored client-side. */
    async create(name: string, scopes: ApiKeyScope[]): Promise<string> {
      const { data, error } = await supabase.rpc("create_api_key", {
        p_name: name,
        p_scopes: scopes,
      });
      if (error) throw error;
      const key = data?.[0]?.key;
      if (!key) throw new Error("No key returned");
      await invalidate();
      return key;
    },
    async revoke(id: string): Promise<void> {
      const { error } = await supabase
        .from("api_keys")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      await invalidate();
    },
  };
}
