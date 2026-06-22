"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { subscribeRestaurantMenu, subscribeRestaurantOrders } from "@/services/restaurant-operations-service";
import type { RestaurantMenuItem, RestaurantOrder } from "@/types";

export function useRestaurantOperations() {
  const { user, configured } = useAuth();
  const [menu, setMenu] = useState<RestaurantMenuItem[]>([]);
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!configured) {
      setLoadingMenu(false);
      setLoadingOrders(false);
      return;
    }
    const reportMenuError = (value: Error) => {
      setError(value.message || "Unable to load the live menu.");
      setLoadingMenu(false);
    };
    const reportOrderError = (value: Error) => {
      const firebaseError = value as Error & { code?: string };
      setError(
        firebaseError.code === "permission-denied"
          ? "Restaurant order storage is not enabled in the deployed Firestore rules. Deploy the updated firestore.rules file, then refresh this page."
          : value.message || "Unable to load restaurant orders."
      );
      setLoadingOrders(false);
    };
    const unsubscribeMenu = subscribeRestaurantMenu((items) => {
      setMenu(items);
      setLoadingMenu(false);
    }, reportMenuError);
    const unsubscribeOrders = user
      ? subscribeRestaurantOrders(user.uid, (items) => {
          setOrders(items);
          setLoadingOrders(false);
        }, reportOrderError)
      : () => undefined;
    if (!user) setLoadingOrders(false);
    return () => {
      unsubscribeMenu();
      unsubscribeOrders();
    };
  }, [configured, user]);

  return { menu, orders, loading: loadingMenu || loadingOrders, error, demoMode: !configured || !user };
}
