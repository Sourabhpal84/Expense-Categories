import type { User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import type { BusinessProfile } from "@/types";

export async function ensureUserProfile(user: User, fallbackName?: string) {
  if (!db) return;
  const ref = doc(db, "profiles", user.uid);
  const existing = await getDoc(ref);
  if (existing.exists()) return;
  await setDoc(ref, {
    userId: user.uid,
    ownerName: fallbackName || user.displayName || "Founder",
    businessName: "MAGNEETOZ Business OS",
    currency: "INR",
    theme: "dark",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function updateBusinessProfile(userId: string, profile: Partial<BusinessProfile>) {
  if (!db) throw new Error("Firebase is not configured.");
  await updateDoc(doc(db, "profiles", userId), {
    ...profile,
    updatedAt: serverTimestamp()
  });
}
