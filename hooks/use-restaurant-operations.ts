"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { db } from "@/firebase/config";
import { doc, getDoc } from "firebase/firestore";
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
    let unsubscribeOrders = () => undefined as void;
    let cancelled = false;
    if (user) {
      void (async () => {
        let orderUserId = user.uid;
        if (db) {
          const profile = await getDoc(doc(db, "users", user.uid)).catch(() => null);
          const ownerUserId = profile?.data()?.ownerUserId;
          if (typeof ownerUserId === "string" && ownerUserId) orderUserId = ownerUserId;
        }
        if (cancelled) return;
        unsubscribeOrders = subscribeRestaurantOrders(orderUserId, (items) => {
          setOrders(items);
          setLoadingOrders(false);
        }, reportOrderError);
      })();
    }
    if (!user) setLoadingOrders(false);
    return () => {
      cancelled = true;
      unsubscribeMenu();
      unsubscribeOrders();
    };
  }, [configured, user]);

  return { menu, orders, loading: loadingMenu || loadingOrders, error, demoMode: !configured || !user };
}
