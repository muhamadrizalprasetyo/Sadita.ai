"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import {
  AlertTriangle,
  Info,
  CheckCircle2,
  Trash2,
  X,
  Loader2,
  LucideIcon,
} from "lucide-react";

export type ConfirmVariant = "danger" | "warning" | "primary" | "info" | "success";

export interface ConfirmOptions {
  title?: string;
  message?: string | ReactNode;
  confirmText?: string;
  cancelText?: string | null;
  showCancel?: boolean;
  variant?: ConfirmVariant;
  icon?: LucideIcon;
  confirmButtonClassName?: string;
  cancelButtonClassName?: string;
}

export type ConfirmInput = ConfirmOptions | string;

export interface ConfirmDialogProps extends ConfirmOptions {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}

/**
 * Static icon renderer for confirmation dialogs declared at module level
 */
function DialogIcon({
  customIcon: CustomIcon,
  variant,
  className,
}: {
  customIcon?: LucideIcon;
  variant: ConfirmVariant;
  className?: string;
}) {
  if (CustomIcon) {
    return <CustomIcon size={18} className={className} />;
  }
  switch (variant) {
    case "danger":
      return <Trash2 size={18} className={className} />;
    case "warning":
      return <AlertTriangle size={18} className={className} />;
    case "info":
      return <Info size={18} className={className} />;
    case "success":
    case "primary":
    default:
      return <CheckCircle2 size={18} className={className} />;
  }
}

/**
 * Helper to normalize string or object input for confirm()
 */
function normalizeOptions(input: ConfirmInput): ConfirmOptions {
  if (typeof input === "string") {
    const isDanger =
      input.toLowerCase().includes("hapus") ||
      input.toLowerCase().includes("delete") ||
      input.toLowerCase().includes("permanen");
    const isWarning =
      input.toLowerCase().includes("batal") ||
      input.toLowerCase().includes("keluar") ||
      input.toLowerCase().includes("logout") ||
      input.toLowerCase().includes("tutup");

    return {
      title: isDanger
        ? "Konfirmasi Tindakan"
        : isWarning
          ? "Peringatan"
          : "Konfirmasi",
      message: input,
      variant: isDanger ? "danger" : isWarning ? "warning" : "primary",
      confirmText: isDanger ? "Ya, Lanjutkan" : "Konfirmasi",
      cancelText: "Batal",
      showCancel: true,
    };
  }

  const showCancel =
    input.showCancel !== undefined
      ? input.showCancel
      : input.cancelText !== null && input.cancelText !== "";

  return {
    ...input,
    title: input.title || (input.variant === "danger" ? "Peringatan" : "Konfirmasi"),
    message: input.message || "Apakah Anda yakin ingin melanjutkan tindakan ini?",
    variant: input.variant || "primary",
    confirmText: input.confirmText || (showCancel ? "Konfirmasi" : "Mengerti"),
    cancelText: showCancel ? (input.cancelText || "Batal") : null,
    showCancel,
  };
}

/**
 * Styling tokens matching SADITA & UNIPI enterprise standards:
 * - Dialog Box Container: strictly rounded-lg (8px) with solid white / slate-900 surface
 * - Inner elements (buttons, badges, icons): strictly rounded-md (6px)
 */
const variantStyles: Record<
  ConfirmVariant,
  {
    iconBox: string;
    confirmBtn: string;
    iconColor: string;
  }
> = {
  danger: {
    iconBox:
      "w-9 h-9 rounded-md flex items-center justify-center shrink-0 bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60",
    confirmBtn:
      "bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white",
    iconColor: "text-rose-600 dark:text-rose-400",
  },
  warning: {
    iconBox:
      "w-9 h-9 rounded-md flex items-center justify-center shrink-0 bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60",
    confirmBtn:
      "bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  primary: {
    iconBox:
      "w-9 h-9 rounded-md flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60",
    confirmBtn:
      "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  success: {
    iconBox:
      "w-9 h-9 rounded-md flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60",
    confirmBtn:
      "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  info: {
    iconBox:
      "w-9 h-9 rounded-md flex items-center justify-center shrink-0 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60",
    confirmBtn:
      "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
};

/**
 * Universal Confirm Dialog (Standalone Declarative Component)
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Konfirmasi",
  message,
  confirmText = "Konfirmasi",
  cancelText = "Batal",
  showCancel = true,
  variant = "primary",
  icon,
  confirmButtonClassName = "",
  cancelButtonClassName = "",
  loading = false,
}: ConfirmDialogProps) {
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const styles = variantStyles[variant] || variantStyles.primary;
  const shouldShowCancel =
    showCancel !== false && cancelText !== null && cancelText !== "";

  // Handle Escape key and scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const origBodyOverflow = document.body.style.overflow;
    const origHtmlOverflow = document.documentElement.style.overflow;
    const origBodyPaddingRight = document.body.style.paddingRight;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    // Autofocus confirm button for accessibility
    setTimeout(() => {
      confirmBtnRef.current?.focus();
    }, 50);

    return () => {
      document.body.style.overflow = origBodyOverflow;
      document.documentElement.style.overflow = origHtmlOverflow;
      document.body.style.paddingRight = origBodyPaddingRight;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, loading]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-99999 flex items-center justify-center p-4 sm:p-6 bg-black/40 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        className="w-full max-w-110 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-lg overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header row: Icon, Title, and Close Button in dedicated top container */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between gap-3 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`${styles.iconBox} w-9.5 h-9.5 rounded-md`}>
              <DialogIcon customIcon={icon} variant={variant} className={styles.iconColor} />
            </div>
            <h3
              id="confirm-dialog-title"
              className="text-[15px] font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-snug truncate"
            >
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer shrink-0 ml-2"
            aria-label="Tutup dialog"
          >
            <X size={15} />
          </button>
        </div>

        {/* Message body in its own dedicated container below header */}
        <div className="px-6 pt-0 pb-5 bg-white dark:bg-slate-900">
          {message ? (
            <div className="text-[13.5px] text-slate-600 dark:text-slate-300 leading-relaxed font-normal m-0">
              {message}
            </div>
          ) : null}
        </div>

        {/* Footer actions bar: Batal & Konfirmasi */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
          {shouldShowCancel && (
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={`min-h-9 px-4 rounded-md text-[13px] font-medium border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-50 cursor-pointer shadow-xs select-none inline-flex items-center justify-center ${cancelButtonClassName}`}
            >
              {cancelText || "Batal"}
            </button>
          )}
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`min-h-9 px-4.5 rounded-md text-[13px] font-semibold text-white transition-all shadow-xs inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 select-none border border-transparent hover:brightness-95 active:brightness-90 active:translate-y-px ${styles.confirmBtn} ${confirmButtonClassName}`}
          >
            {loading && <Loader2 size={13} className="animate-spin" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Global Context & Hook for Promise-based confirmation: const ok = await confirm(...)
// ============================================================================

export type ConfirmAlertFunction = (
  message: string | ReactNode,
  title?: string,
  variant?: ConfirmVariant
) => Promise<boolean>;

export type ConfirmFunction = ((input: ConfirmInput) => Promise<boolean>) & {
  alert: ConfirmAlertFunction;
};

interface ConfirmContextType {
  confirm: ConfirmFunction;
  alert: ConfirmAlertFunction;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    resolve?: (value: boolean) => void;
  }>({
    isOpen: false,
    options: { title: "Konfirmasi", message: "" },
  });

  const confirmCore = useCallback((input: ConfirmInput): Promise<boolean> => {
    const normalized = normalizeOptions(input);
    return new Promise<boolean>((resolve) => {
      setDialogState({
        isOpen: true,
        options: normalized,
        resolve,
      });
    });
  }, []);

  const alert = useCallback(
    (
      message: string | ReactNode,
      title = "Pemberitahuan",
      variant: ConfirmVariant = "warning"
    ): Promise<boolean> => {
      return confirmCore({
        title,
        message,
        variant,
        confirmText: "Mengerti",
        showCancel: false,
        cancelText: null,
      });
    },
    [confirmCore]
  );

  // Intercept window.alert on client to guarantee zero browser-native alert dialogs
  useEffect(() => {
    if (typeof window !== "undefined") {
      const originalAlert = window.alert;
      window.alert = (message?: unknown) => {
        const text = String(message ?? "");
        const isDanger =
          text.toLowerCase().includes("gagal") ||
          text.toLowerCase().includes("error") ||
          text.toLowerCase().includes("rusak");
        const isWarning =
          text.toLowerCase().includes("lindungi") ||
          text.toLowerCase().includes("harus") ||
          text.toLowerCase().includes("tidak dapat") ||
          text.toLowerCase().includes("pilih");
        void alert(
          text,
          isDanger ? "Gagal" : isWarning ? "Perhatian" : "Pemberitahuan",
          isDanger ? "danger" : isWarning ? "warning" : "info"
        );
      };
      return () => {
        window.alert = originalAlert;
      };
    }
  }, [alert]);

  const confirm = useMemo(() => {
    return Object.assign((input: ConfirmInput) => confirmCore(input), {
      alert,
    });
  }, [confirmCore, alert]);

  const handleConfirm = useCallback(() => {
    dialogState.resolve?.(true);
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  }, [dialogState]);

  const handleCancel = useCallback(() => {
    dialogState.resolve?.(false);
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  }, [dialogState]);

  return (
    <ConfirmContext.Provider value={{ confirm, alert }}>
      {children}
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        {...dialogState.options}
      />
    </ConfirmContext.Provider>
  );
}

/**
 * Universal hook for dynamic confirmation dialogs
 *
 * Supports both object options and simple message strings:
 * ```tsx
 * const confirm = useConfirm();
 *
 * // 1. Detailed confirmation dialog:
 * const ok = await confirm({
 *   title: "Hapus Pengguna",
 *   message: "Data akan dihapus permanen.",
 *   variant: "danger",
 *   confirmText: "Hapus",
 *   cancelText: "Batal",
 * });
 *
 * // 2. Custom alert replacement for window.alert:
 * await confirm.alert("Akun terlindungi dan tidak dapat dihapus.");
 * ```
 */
export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context.confirm;
}

/**
 * Dedicated hook for displaying styled custom alerts instead of window.alert()
 */
export function useAlert() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useAlert must be used within a ConfirmProvider");
  }
  return context.alert;
}

/**
 * Local hook for isolated confirmation without requiring ConfirmProvider
 */
export function useLocalConfirm() {
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    resolve?: (value: boolean) => void;
  }>({
    isOpen: false,
    options: { title: "Konfirmasi", message: "" },
  });

  const confirmCore = useCallback((input: ConfirmInput): Promise<boolean> => {
    const normalized = normalizeOptions(input);
    return new Promise<boolean>((resolve) => {
      setDialogState({
        isOpen: true,
        options: normalized,
        resolve,
      });
    });
  }, []);

  const alert = useCallback(
    (
      message: string | ReactNode,
      title = "Pemberitahuan",
      variant: ConfirmVariant = "warning"
    ): Promise<boolean> => {
      return confirmCore({
        title,
        message,
        variant,
        confirmText: "Mengerti",
        showCancel: false,
        cancelText: null,
      });
    },
    [confirmCore]
  );

  const confirm = useMemo(() => {
    return Object.assign((input: ConfirmInput) => confirmCore(input), {
      alert,
    });
  }, [confirmCore, alert]);

  const handleConfirm = useCallback(() => {
    dialogState.resolve?.(true);
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  }, [dialogState]);

  const handleCancel = useCallback(() => {
    dialogState.resolve?.(false);
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  }, [dialogState]);

  const ConfirmDialogComponent = (
    <ConfirmDialog
      isOpen={dialogState.isOpen}
      onClose={handleCancel}
      onConfirm={handleConfirm}
      {...dialogState.options}
    />
  );

  return { confirm, alert, ConfirmDialogComponent };
}
