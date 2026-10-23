"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { CourseClass } from "@/lib/api";

/** Pilih kelas awal dari query ?class= atau kelas pertama. */
export function useInitialClassId(classes: CourseClass[]): [number | undefined, (id: number) => void] {
  const searchParams = useSearchParams();
  const [classId, setClassId] = useState<number>();

  useEffect(() => {
    if (classes.length === 0) {
      setClassId(undefined);
      return;
    }
    const param = searchParams.get("class");
    const parsed = param ? Number(param) : NaN;
    if (!Number.isNaN(parsed) && classes.some((c) => c.id === parsed)) {
      setClassId(parsed);
    } else if (classId === undefined || !classes.some((c) => c.id === classId)) {
      setClassId(classes[0].id);
    }
  }, [classes, searchParams, classId]);

  return [classId, setClassId];
}
