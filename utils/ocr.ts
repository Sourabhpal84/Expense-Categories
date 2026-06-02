import { createWorker } from "tesseract.js";

export async function extractTextFromImage(file: File) {
  const worker = await createWorker("eng");
  try {
    const imageUrl = URL.createObjectURL(file);
    const result = await worker.recognize(imageUrl);
    URL.revokeObjectURL(imageUrl);
    return result.data.text;
  } finally {
    await worker.terminate();
  }
}

export function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
