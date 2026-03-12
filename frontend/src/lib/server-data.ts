import { cookies } from "next/headers";
import { isAuthDisabled, DEV_USER_COOKIE } from "./auth-config";
import {
  mockUser,
  mockDashboardData,
  type DashboardData,
} from "./mock-data";
import { createClient } from "./supabase/server";

export type CurrentUser = typeof mockUser | null;

export async function getCurrentUser(): Promise<CurrentUser> {
  if (isAuthDisabled()) {
    return mockUser;
  }

  const store = await cookies();
  if (store.get(DEV_USER_COOKIE)?.value === "1") {
    return mockUser;
  }

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, name, email")
        .eq("id", user.id)
        .single();
      if (profile) {
        return {
          id: profile.id,
          name: profile.name ?? user.user_metadata?.full_name ?? user.email ?? "",
          email: profile.email ?? user.email ?? "",
        };
      }
      return {
        id: user.id,
        name: (user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email?.split("@")[0]) ?? "",
        email: user.email ?? "",
      };
    } catch {
      return null;
    }
  }

  return null;
}

export async function getDashboardData(): Promise<DashboardData | null> {
  if (isAuthDisabled()) {
    return mockDashboardData;
  }

  const store = await cookies();
  if (store.get(DEV_USER_COOKIE)?.value === "1") {
    return mockDashboardData;
  }

  return null;
}

