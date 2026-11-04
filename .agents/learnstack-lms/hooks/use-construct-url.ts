import { env } from "@/lib/env";

export function useConstructUrl(key: string): string {
  return `https://learnstack-lms.t3.storage.dev/${key}`;
}

// https://learnstack-lms.t3.storage.dev/11c37a7e-da1e-457e-9664-c86218070ff6-learnstack-hero.png
