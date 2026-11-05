"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import type { CourseClass } from "@/lib/api";

/** Pilih kelas awal dari query ?class= atau kelas pertama secara reaktif tanpa cascading render. */
export function useInitialClassId(classes: CourseClass[]): [number | undefined, (id: number) => void] {
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<number>();

  const param = searchParams.get("class");
  const parsed = param ? Number(param) : NaN;
  const urlClassId = !Number.isNaN(parsed) && classes.some((c) => c.id === parsed) ? parsed : undefined;

  let activeId: number | undefined;
  if (classes.length === 0) {
    activeId = undefined;
  } else if (selectedId !== undefined && classes.some((c) => c.id === selectedId)) {
    activeId = selectedId;
  } else if (urlClassId !== undefined) {
    activeId = urlClassId;
  } else {
    activeId = classes[0]?.id;
  }

  return [activeId, setSelectedId];
}
