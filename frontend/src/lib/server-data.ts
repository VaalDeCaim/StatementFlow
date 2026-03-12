import {cookies} from "next/headers";
import {isAuthDisabled, allowDevMode, DEV_USER_COOKIE} from "./auth-config";
import {mockUser, mockDashboardData, type DashboardData} from "./mock-data";
import {logAuthBypass, logServerDataFailure} from "./security-logger";
import {createClient} from "./supabase/server";

export type CurrentUser = typeof mockUser | null;

export async function getCurrentUser(): Promise<CurrentUser> {
  if (isAuthDisabled()) {
    logAuthBypass("NO_AUTH");
    return mockUser;
  }

  const store = await cookies();
  if (allowDevMode() && store.get(DEV_USER_COOKIE)?.value === "1") {
    logAuthBypass("DEV_USER_COOKIE");
    return mockUser;
  }

  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    try {
      const supabase = await createClient();
      const {
        data: {user},
      } = await supabase.auth.getUser();
      if (!user) return null;
      const {data: profile} = await supabase
        .from("profiles")
        .select("id, name, email")
        .eq("id", user.id)
        .single();
      if (profile) {
        return {
          id: profile.id,
          name:
            profile.name ?? user.user_metadata?.full_name ?? user.email ?? "",
          email: profile.email ?? user.email ?? "",
        };
      }
      return {
        id: user.id,
        name:
          user.user_metadata?.full_name ??
          user.user_metadata?.name ??
          user.email?.split("@")[0] ??
          "",
        email: user.email ?? "",
      };
    } catch (err) {
      logServerDataFailure("getCurrentUser", err);
      return null;
    }
  }

  return null;
}

export async function getDashboardData(): Promise<DashboardData | null> {
  if (isAuthDisabled()) {
    logAuthBypass("NO_AUTH");
    return mockDashboardData;
  }

  const store = await cookies();
  if (allowDevMode() && store.get(DEV_USER_COOKIE)?.value === "1") {
    logAuthBypass("DEV_USER_COOKIE");
    return mockDashboardData;
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return null;
  }

  try {
    const supabase = await createClient();

    const {
      data: {user},
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return null;
    }

    const {data: profile} = await supabase
      .from("profiles")
      .select("name, email, balance")
      .eq("id", user.id)
      .single();

    const displayName =
      profile?.name ??
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      user.email?.split("@")[0] ??
      "";

    const displayEmail = profile?.email ?? user.email ?? "";

    const [{count: conversionsCount}, {data: jobs, error: jobsError}] =
      await Promise.all([
        supabase.from("jobs").select("id", {count: "exact", head: true}),
        supabase
          .from("jobs")
          .select(
            "id, status, format, file_name, created_at, completed_at, account_count, transaction_count",
          )
          .order("created_at", {ascending: false})
          .limit(20),
      ]);

    if (jobsError) {
      return null;
    }

    const metrics: DashboardData["metrics"] = [
      {
        id: "m1",
        label: "Statement Conversions",
        value: String(conversionsCount ?? 0),
      },
    ];

    const recent =
      jobs?.slice(0, 5).map((job) => {
        const isCompleted = job.status === "completed";
        const title = isCompleted
          ? `Exported ${job.file_name}`
          : `Started ${job.file_name}`;

        const subtitleParts = [
          job.format?.toUpperCase?.() ?? "",
          typeof job.account_count === "number"
            ? `${job.account_count} accounts`
            : null,
          typeof job.transaction_count === "number"
            ? `${job.transaction_count} transactions`
            : null,
        ].filter(Boolean);

        const subtitle = subtitleParts.join(" · ");

        const timestampSource = job.completed_at ?? job.created_at;
        const timestamp = timestampSource
          ? new Date(timestampSource).toLocaleString(undefined, {
              dateStyle: "short",
              timeStyle: "short",
            })
          : "";

        return {
          id: job.id,
          title,
          subtitle,
          timestamp,
        };
      }) ?? [];

    return {
      user: {
        id: user.id,
        name: displayName,
        email: displayEmail,
      },
      metrics,
      recent,
    };
  } catch (err) {
    logServerDataFailure("getDashboardData", err);
    return null;
  }
}
