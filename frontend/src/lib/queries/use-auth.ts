"use client";

import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import {useRouter} from "next/navigation";
import {getSupabaseClient} from "@/lib/supabase/client";
import {queryKeys} from "@/lib/queries/keys";
import type {CurrentUser} from "@/lib/server-data";
import {setDevUserCookie, clearDevUserCookie} from "@/lib/auth-config";
import type {LoginInput} from "@/lib/validations/auth";
import type {SignupInput} from "@/lib/validations/auth";

async function fetchUser(): Promise<CurrentUser> {
  const res = await fetch("/api/auth/user", {credentials: "include"});
  if (!res.ok) return null;
  const data = await res.json();
  return data as CurrentUser;
}

export function useUserQuery(initialData?: CurrentUser) {
  return useQuery({
    queryKey: queryKeys.user,
    queryFn: fetchUser,
    initialData,
    staleTime: 60 * 1000,
  });
}

/** Error thrown when login fails because email is not confirmed. Form should redirect to verify-email. */
export class EmailNotConfirmedError extends Error {
  code = "email_not_confirmed" as const;
  email: string;
  constructor(email: string) {
    super("Email not confirmed");
    this.name = "EmailNotConfirmedError";
    this.email = email;
  }
}

export function useSignInMutation() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const supabase = getSupabaseClient();

  return useMutation({
    mutationFn: async (data: LoginInput) => {
      if (supabase) {
        const {error} = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        if (error) {
          const code = (error as {code?: string}).code;
          if (code === "email_not_confirmed") {
            await supabase.auth.resend({
              type: "signup",
              email: data.email,
            });
            throw new EmailNotConfirmedError(data.email);
          }
          throw new Error(error.message ?? "Invalid email or password");
        }
        return;
      }
      setDevUserCookie();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: queryKeys.user});
      router.refresh();
      router.push("/dashboard");
    },
  });
}

type SignUpResult = {
  authData: {user: unknown; session: unknown} | null;
  email: string;
};

export function useSignUpMutation() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const supabase = getSupabaseClient();

  return useMutation({
    mutationFn: async (data: SignupInput): Promise<SignUpResult> => {
      if (supabase) {
        const origin =
          typeof window !== "undefined" ? window.location.origin : "";
        const {data: authData, error} = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {full_name: data.name},
            emailRedirectTo: `${origin}/auth/callback?next=/onboarding`,
          },
        });
        if (error) throw new Error("Oops! Something went wrong!");
        return {authData, email: data.email};
      }
      setDevUserCookie();
      return {authData: null, email: data.email};
    },
    onSuccess: (result: SignUpResult) => {
      queryClient.invalidateQueries({queryKey: queryKeys.user});
      router.refresh();
      if (result.authData?.session) {
        router.push("/onboarding");
        return;
      }
      if (result.authData?.user && !result.authData?.session) {
        router.push(
          `/signup/verify-email?email=${encodeURIComponent(result.email)}`,
        );
        return;
      }
      router.push("/onboarding");
    },
  });
}

export function useSignOutMutation() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const supabase = getSupabaseClient();

  return useMutation({
    mutationFn: async () => {
      if (supabase) {
        await supabase.auth.signOut();
      }
      clearDevUserCookie();
    },
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.user, null);
      queryClient.invalidateQueries({queryKey: queryKeys.user});
      router.refresh();
      router.push("/login");
    },
  });
}

export function useVerifyOtpMutation() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const supabase = getSupabaseClient();

  return useMutation({
    mutationFn: async ({email, token}: {email: string; token: string}) => {
      if (!supabase) throw new Error("Auth not configured");
      const {error} = await supabase.auth.verifyOtp({
        email,
        token: token.trim(),
        type: "signup",
      });
      if (error) throw new Error(error.message ?? "Invalid or expired code");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: queryKeys.user});
      router.refresh();
      router.push("/onboarding");
    },
  });
}

export function useResendConfirmationMutation() {
  const supabase = getSupabaseClient();

  return useMutation({
    mutationFn: async (email: string) => {
      if (!supabase) throw new Error("Auth not configured");
      const {error} = await supabase.auth.resend({
        type: "signup",
        email,
      });
      if (error) throw new Error(error.message ?? "Failed to resend email");
    },
  });
}

export function useForgotPasswordMutation() {
  const supabase = getSupabaseClient();

  return useMutation({
    mutationFn: async (email: string) => {
      if (supabase) {
        const {error} = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback?next=/reset-password`,
        });
        if (error)
          throw new Error(error.message ?? "Failed to send reset email");
      }
    },
  });
}

export function useVerifyRecoveryOtpMutation() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const supabase = getSupabaseClient();

  return useMutation({
    mutationFn: async ({email, token}: {email: string; token: string}) => {
      if (!supabase) throw new Error("Auth not configured");
      const {error} = await supabase.auth.verifyOtp({
        email,
        token: token.trim(),
        type: "recovery",
      });
      if (error) throw new Error(error.message ?? "Invalid or expired code");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: queryKeys.user});
      router.refresh();
      router.push("/reset-password");
    },
  });
}

export function useResendRecoveryMutation() {
  const supabase = getSupabaseClient();

  return useMutation({
    mutationFn: async (email: string) => {
      if (!supabase) throw new Error("Auth not configured");
      const {error} = await supabase.auth.resend({
        type: "recovery",
        email,
      });
      if (error) throw new Error(error.message ?? "Failed to resend email");
    },
  });
}

export function useUpdatePasswordMutation() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const supabase = getSupabaseClient();

  return useMutation({
    mutationFn: async (password: string) => {
      if (!supabase) throw new Error("Auth not configured");
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw new Error(error.message ?? "Failed to update password");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user });
      router.refresh();
      router.push("/dashboard");
    },
  });
}
