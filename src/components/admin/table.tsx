"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/i18n-context";

/* ===== Status badge — mirrors the original statusBadge() mapping ===== */

const APPROVED_STATUSES = ["نشط", "مقبول", "جاهز", "مكتملة", "مكتمل", "مدفوع", "تم الحل"];
const REJECTED_STATUSES = ["منتهي", "مرفوض", "متأخرة", "مسودة", "مشغول", "ملغي"];

export function statusBadgeClass(text: string): "approved" | "pending" | "rejected" {
  const txt = (text || "").trim();
  if (APPROVED_STATUSES.includes(txt)) return "approved";
  if (REJECTED_STATUSES.includes(txt)) return "rejected";
  return "pending";
}

export function StatusBadge({ text }: { text: string }) {
  return (
    <span className={`badge ${statusBadgeClass(text)}`}>
      <span className="d" />
      {text}
    </span>
  );
}

/* ===== Table search input — injected into .table-toolbar like the original ===== */

export function TableSearch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useI18n();
  return (
    <div className="table-search">
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        style={{ flexShrink: 0 }}
      >
        <circle cx="11" cy="11" r="7" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="text"
        placeholder={t("searchPlaceholder")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

/* ===== Pagination — same DOM as buildPagination()/updatePaginationUI() ===== */

export interface TablePager {
  page: number;
  pageSize: string;
  totalPages: number;
  paged: <T>(rows: T[]) => T[];
  setPage: (n: number) => void;
  setPageSize: (s: string) => void;
}

export function useTablePager<T>(rows: T[], searchTerm: string, rowText: (row: T) => string) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState("5");

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((r) => rowText(r).toLowerCase().includes(term));
  }, [rows, searchTerm, rowText]);

  const sizeNum = pageSize === "all" ? filtered.length || 1 : parseInt(pageSize, 10) || 5;
  const totalPages = Math.max(1, Math.ceil(filtered.length / sizeNum));
  const current = Math.max(1, Math.min(page, totalPages));
  const pagedRows = filtered.slice((current - 1) * sizeNum, current * sizeNum);

  return {
    filtered,
    pagedRows,
    page: current,
    pageSize,
    totalPages,
    setPage,
    setPageSize: (s: string) => {
      setPageSize(s);
      setPage(1);
    },
    resetPage: () => setPage(1),
  };
}

export function TablePagination({
  page,
  totalPages,
  pageSize,
  count,
  onPage,
  onPageSize,
}: {
  page: number;
  totalPages: number;
  pageSize: string;
  count: number;
  onPage: (n: number) => void;
  onPageSize: (s: string) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="table-pagination">
      <div className="pagination-left">
        <span className="page-size-label">{t("rowsPerPage")}</span>
        <select className="page-size" value={pageSize} onChange={(e) => onPageSize(e.target.value)}>
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
          <option value="all">{t("allRows")}</option>
        </select>
      </div>
      <div className="page-info">
        {t("pageInfo").replace("{page}", String(page)).replace("{total}", String(totalPages)).replace("{count}", String(count))}
      </div>
      <div className="page-controls">
        <button type="button" disabled={page === 1} onClick={() => onPage(page - 1)}>
          {t("previous")}
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
          <button key={n} type="button" className={n === page ? "active" : undefined} onClick={() => onPage(n)}>
            {n}
          </button>
        ))}
        <button type="button" disabled={page === totalPages} onClick={() => onPage(page + 1)}>
          {t("next")}
        </button>
      </div>
    </div>
  );
}

/* ===== Row actions menu — view / edit / delete (+ download for reports) ===== */

export type TableAction = "view" | "edit" | "download" | "delete";

export function ActionsCell({
  actions,
  onAction,
}: {
  actions: TableAction[];
  onAction: (a: TableAction) => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const labels: Record<TableAction, string> = {
    view: t("viewDetails"),
    edit: t("edit"),
    download: t("download"),
    delete: t("delete"),
  };
  return (
    <td className="actions-cell">
      <button
        type="button"
        className="actions-toggle"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        {t("actions")}
      </button>
      <div className={`actions-menu${open ? " open" : ""}`}>
        {actions.map((a) => (
          <button
            key={a}
            type="button"
            className={a === "delete" ? "delete" : undefined}
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onAction(a);
            }}
          >
            {labels[a]}
          </button>
        ))}
      </div>
    </td>
  );
}

/* ===== Record-detail navigation — same payload the original stored ===== */

export interface DetailField {
  label: string;
  value: string;
}

export function useRecordDetail() {
  const router = useRouter();
  return (payload: { name: string; image?: string; fields: DetailField[]; extra?: Record<string, unknown> }) => {
    try {
      sessionStorage.setItem("recordDetail", JSON.stringify({ name: payload.name, image: payload.image, fields: payload.fields, ...payload.extra }));
    } catch {
      /* sessionStorage unavailable */
    }
    router.push(`/detail?name=${encodeURIComponent(payload.name)}`);
  };
}

/* ===== Modal — .modal-backdrop / .modal-card with .open ===== */

export function AdminModal({
  id,
  open,
  onClose,
  children,
  maxWidth,
}: {
  id: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: number;
}) {
  return (
    <div
      className={`modal-backdrop${open ? " open" : ""}`}
      id={id}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-card" style={maxWidth ? { maxWidth } : undefined}>
        {children}
      </div>
    </div>
  );
}

/* ===== Shared cancel button used inside modal forms (.modal-close) ===== */

export function ModalCancelButton({ onClose, style }: { onClose: () => void; style?: React.CSSProperties }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      className="btn btn-sm modal-close"
      style={{ background: "var(--cream)", border: "1px solid var(--line)", color: "var(--stone)", ...style }}
      onClick={onClose}
    >
      {t("cancel")}
    </button>
  );
}
