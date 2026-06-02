import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/firebase/config";
import { slugify } from "@/lib/utils";

export async function uploadReceipt(userId: string, file: File) {
  if (!storage) throw new Error("Firebase Storage is not configured.");
  const path = `receipts/${userId}/${Date.now()}-${slugify(file.name)}`;
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file, { contentType: file.type });
  return getDownloadURL(fileRef);
}
