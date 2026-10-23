"use client";

import { useCallback, useEffect, useState } from "react";
import { academicApi, type CourseClass } from "@/lib/api";

export function useLecturerClasses() {
  const [classes, setClasses] = useState<CourseClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const reload = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    const res = await academicApi.getClasses();
    if (res.error) {
      setError(res.error);
      setClasses([]);
    } else {
      setClasses(res.data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { classes, loading, error, reload };
}
