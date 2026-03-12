"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  realFetchTopupBundles,
  realTopUp,
  realCreateStripeCheckout,
} from "@/lib/convert-api";
import { queryKeys } from "@/lib/queries/keys";

export function useTopupBundles() {
  return useQuery({
    queryKey: queryKeys.pricing,
    queryFn: realFetchTopupBundles,
  });
}

export function useTopUpMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bundleId: string) => realTopUp(bundleId),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.balance, { coins: data.balance });
      queryClient.invalidateQueries({ queryKey: queryKeys.balance });
    },
  });
}

/** Creates Stripe Checkout session and redirects to Stripe-hosted payment page. */
export function useCreateStripeCheckoutMutation() {
  return useMutation({
    mutationFn: (bundleId: string) => realCreateStripeCheckout(bundleId),
    onSuccess: (data) => {
      if (typeof window !== "undefined" && data?.url) {
        window.location.href = data.url;
      }
    },
  });
}

