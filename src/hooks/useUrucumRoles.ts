import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

export function useUrucumRoles() {
  const { session } = useAuth();
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    if (!session?.user.id) {
      setRoles([]);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    supabase
      .from("profile_roles")
      .select("role")
      .eq("profile_id", session.user.id)
      .then(({ data }) => {
        if (!active) return;
        setRoles((data ?? []).map((row) => row.role));
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [session?.user.id]);

  return {
    roles,
    loading,
    hasRole: (role: string) => roles.includes(role),
  };
}
