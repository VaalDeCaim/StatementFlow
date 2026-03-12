"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { CurrentUser } from "./server-data";
import { useUserQuery, useSignOutMutation } from "./queries/use-auth";

type UserContextValue = {
  user: CurrentUser;
  loading: boolean;
  logout: () => void;
};

const UserContext = createContext<UserContextValue | undefined>(undefined);

type UserProviderProps = {
  initialUser: CurrentUser;
  children: ReactNode;
};

export function UserProvider({ initialUser, children }: UserProviderProps) {
  const { data: user, isFetching: loading } = useUserQuery(initialUser);
  const signOutMutation = useSignOutMutation();

  const logout = () => {
    signOutMutation.mutate();
  };

  return (
    <UserContext.Provider
      value={{
        user: user ?? null,
        loading,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return ctx;
}
