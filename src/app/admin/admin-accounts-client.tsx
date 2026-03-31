"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { SIGNUP_PASSWORD_HINT } from "@/lib/password-policy";
import { ADMIN_PRESENCE_POLL_MS, PRESENCE_HEARTBEAT_MS } from "@/lib/presence-config";

import {
  Activity,
  KeyRound,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Search,
  Shield,
  Store,
  Trash2,
  Users,
  WifiOff,
} from "./admin-icons";

export type AdminUserRow = {
  uid: string;
  email: string | null;
  disabled: boolean;
  accountType: "trial" | "production";
  shopName?: string | null;
  shopSlug: string | null;
  online: boolean;
  lastSeen: number | null;
  lastSignInTime: string | null;
};

type StatusFilter = "all" | "online" | "offline";

function formatLastLoginVi(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const p = (n: number) => n.toString().padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())} ${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function accountTypeLabel(t: AdminUserRow["accountType"]): string {
  return t === "trial" ? "Dùng thử" : "Chính thức";
}

export default function AdminAccountsClient() {
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [pageToken, setPageToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pwdUid, setPwdUid] = useState<string | null>(null);
  const [pwdEmail, setPwdEmail] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<string | null>(null);
  const [viewerUid, setViewerUid] = useState<string | null>(null);
  const [delUid, setDelUid] = useState<string | null>(null);
  const [delEmail, setDelEmail] = useState<string | null>(null);
  const [delConfirm, setDelConfirm] = useState("");
  const [delBusy, setDelBusy] = useState(false);
  const [delMsg, setDelMsg] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [menuUid, setMenuUid] = useState<string | null>(null);
  const rowsRef = useRef<AdminUserRow[]>([]);
  rowsRef.current = rows;

  const load = useCallback(async (token?: string | null, append?: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (token) qs.set("pageToken", token);
      qs.set("limit", "100");
      const res = await fetch(`/api/admin/users?${qs}`, { credentials: "include" });
      const data = (await res.json().catch(() => null)) as
        | {
            users?: AdminUserRow[];
            pageToken?: string | null;
            viewerUid?: string;
            message?: string;
          }
        | null;
      if (!res.ok) {
        setError(data?.message || `Lỗi ${res.status}`);
        if (!append) setRows([]);
        return;
      }
      const chunk = Array.isArray(data?.users) ? data!.users! : [];
      setRows((prev) => (append ? [...prev, ...chunk] : chunk));
      setPageToken(data?.pageToken ?? null);
      if (!append && data?.viewerUid) setViewerUid(data.viewerUid);
    } catch {
      setError("Không tải được danh sách.");
      if (!append) setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const ping = () => {
      void fetch("/api/auth/presence", { method: "POST", credentials: "include" });
    };
    ping();
    const id = window.setInterval(ping, PRESENCE_HEARTBEAT_MS);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const poll = () => {
      if (document.visibilityState !== "visible") return;
      const list = rowsRef.current;
      if (list.length === 0) return;
      const uids = list.map((r) => r.uid).join(",");
      void (async () => {
        try {
          const res = await fetch(`/api/admin/users/presence?uids=${encodeURIComponent(uids)}`, {
            credentials: "include",
          });
          const data = (await res.json().catch(() => null)) as
            | { presence?: Record<string, { lastSeen: number | null; online: boolean }> }
            | null;
          if (!res.ok || !data?.presence) return;
          const p = data.presence;
          setRows((prev) =>
            prev.map((row) => {
              const u = p[row.uid];
              if (!u) return row;
              return { ...row, lastSeen: u.lastSeen, online: u.online };
            }),
          );
        } catch {
          // ignore
        }
      })();
    };
    poll();
    const id = window.setInterval(poll, ADMIN_PRESENCE_POLL_MS);
    const onVisibility = () => {
      if (document.visibilityState === "visible") poll();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest("[data-admin-action-menu]")) setMenuUid(null);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter === "online" && !r.online) return false;
      if (statusFilter === "offline" && r.online) return false;
      if (!q) return true;
      const email = (r.email || "").toLowerCase();
      const shopName = (r.shopName || "").toLowerCase();
      const shop = (r.shopSlug || "").toLowerCase();
      return email.includes(q) || shopName.includes(q) || shop.includes(q);
    });
  }, [rows, search, statusFilter]);

  const stats = useMemo(() => {
    const total = rows.length;
    const online = rows.filter((r) => r.online).length;
    const offline = total - online;
    return { total, online, offline };
  }, [rows]);

  const hint = useMemo(() => SIGNUP_PASSWORD_HINT, []);

  const openPassword = (u: AdminUserRow) => {
    setPwdUid(u.uid);
    setPwdEmail(u.email);
    setNewPassword("");
    setPwdMsg(null);
    setMenuUid(null);
  };

  const openDelete = (u: AdminUserRow) => {
    setDelUid(u.uid);
    setDelEmail(u.email);
    setDelConfirm("");
    setDelMsg(null);
    setMenuUid(null);
  };

  const submitDelete = async () => {
    if (!delUid) return;
    const email = String(delEmail || "").trim();
    const uid = String(delUid || "").trim();
    const ok = email ? delConfirm.trim() === email : delConfirm.trim() === uid;
    if (!ok) {
      setDelMsg(email ? "Nhập đúng email của tài khoản cần xóa." : "Nhập đúng UID của tài khoản cần xóa.");
      return;
    }
    setDelBusy(true);
    setDelMsg(null);
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(delUid)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = (await res.json().catch(() => null)) as { message?: string } | null;
      if (!res.ok) {
        setDelMsg(data?.message || "Không xóa được.");
        return;
      }
      setRows((prev) => prev.filter((r) => r.uid !== delUid));
      setDelUid(null);
      setDelConfirm("");
    } catch {
      setDelMsg("Lỗi mạng.");
    } finally {
      setDelBusy(false);
    }
  };

  const submitPassword = async () => {
    if (!pwdUid) return;
    setPwdBusy(true);
    setPwdMsg(null);
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(pwdUid)}/password`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = (await res.json().catch(() => null)) as { message?: string } | null;
      if (!res.ok) {
        setPwdMsg(data?.message || "Không đổi được mật khẩu.");
        return;
      }
      setPwdMsg("Đã cập nhật mật khẩu.");
      setNewPassword("");
      setTimeout(() => {
        setPwdUid(null);
        setPwdMsg(null);
      }, 1200);
    } catch {
      setPwdMsg("Lỗi mạng.");
    } finally {
      setPwdBusy(false);
    }
  };

  return (
    <div className="adm-page">
      <div className="adm-header">
        <div>
          <h1 className="adm-title">Tài khoản</h1>
          <p className="adm-sub">Quản lý người dùng và trạng thái kết nối.</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="adm-btn-icon"
        >
          <RefreshCw className={loading ? "adm-spin" : undefined} />
          Làm mới
        </button>
      </div>

      <div className="adm-stat-grid">
        <div className="adm-stat-card">
          <div className="adm-stat-inner">
            <div className="adm-stat-icon">
              <Users />
            </div>
            <div>
              <p className="adm-stat-label">Tổng tài khoản</p>
              <p className="adm-stat-value">{loading ? "—" : stats.total}</p>
            </div>
          </div>
        </div>
        <div className="adm-stat-card adm-stat-card--emerald">
          <div className="adm-stat-inner">
            <div className="adm-stat-icon adm-stat-icon--emerald">
              <Activity />
            </div>
            <div>
              <p className="adm-stat-label">Đang online</p>
              <p className="adm-stat-value">{loading ? "—" : stats.online}</p>
            </div>
          </div>
        </div>
        <div className="adm-stat-card">
          <div className="adm-stat-inner">
            <div className="adm-stat-icon adm-stat-icon--rose">
              <WifiOff />
            </div>
            <div>
              <p className="adm-stat-label">Offline</p>
              <p className="adm-stat-value">{loading ? "—" : stats.offline}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="adm-toolbar">
        <div className="adm-search-wrap">
          <Search className="adm-search-icon" />
          <input
            type="search"
            placeholder="Tìm theo email hoặc shop…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="adm-input"
          />
        </div>
        <div className="adm-filters">
          {(
            [
              { id: "all" as const, label: "Tất cả" },
              { id: "online" as const, label: "Online" },
              { id: "offline" as const, label: "Offline" },
            ] as const
          ).map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setStatusFilter(id)}
              className={`adm-filter ${statusFilter === id ? "adm-filter--on" : ""}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error ? <div className="adm-alert">{error}</div> : null}

      <div className="adm-table-card">
        <div className="adm-table-scroll">
          <table className="adm-table">
            <thead className="adm-thead">
              <tr>
                <th>Trạng thái</th>
                <th>Email</th>
                <th>Loại tài khoản</th>
                <th>Cửa hàng</th>
                <th>Đăng nhập gần nhất</th>
                <th className="adm-th-actions">Thao tác</th>
              </tr>
            </thead>
            <tbody className="adm-tbody">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={`sk-${i}`} className="adm-skel-pulse">
                    <td className="adm-td">
                      <div className="adm-skel-bar" style={{ height: 32, width: 96 }} />
                    </td>
                    <td className="adm-td">
                      <div className="adm-skel-bar" style={{ height: 16, width: "100%", maxWidth: 192 }} />
                    </td>
                    <td className="adm-td">
                      <div className="adm-skel-bar" style={{ height: 24, width: 80, borderRadius: 9999 }} />
                    </td>
                    <td className="adm-td">
                      <div className="adm-skel-bar" style={{ height: 16, width: 112 }} />
                    </td>
                    <td className="adm-td">
                      <div className="adm-skel-bar" style={{ height: 16, width: 144 }} />
                    </td>
                    <td className="adm-td">
                      <div className="adm-skel-bar" style={{ height: 36, width: 96, marginLeft: "auto" }} />
                    </td>
                  </tr>
                ))
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="adm-empty">
                      <div className="adm-empty-icon">
                        <Shield />
                      </div>
                      {rows.length === 0 ? (
                        <>
                          <p className="adm-empty-title">Chưa có tài khoản</p>
                          <p className="adm-empty-sub">Chưa có người dùng nào trong hệ thống.</p>
                        </>
                      ) : (
                        <>
                          <p className="adm-empty-title">Không có kết quả</p>
                          <p className="adm-empty-sub">Thử đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRows.map((u, idx) => (
                  <tr
                    key={u.uid}
                    className={`${idx % 2 === 1 ? "adm-tr-alt" : ""} ${u.disabled ? "adm-tr-disabled" : ""}`}
                  >
                    <td className="adm-td">
                      <div className="adm-status-row">
                        {u.online ? (
                          <span className="adm-dot-wrap">
                            <span className="adm-ping" />
                            <span className="adm-dot-on" />
                          </span>
                        ) : (
                          <span className="adm-dot-off" />
                        )}
                        <span className={`adm-status-text ${u.online ? "adm-status-text--on" : "adm-status-text--off"}`}>
                          {u.online ? "Online" : "Offline"}
                        </span>
                      </div>
                    </td>
                    <td className="adm-td adm-email">{u.email || "—"}</td>
                    <td className="adm-td">
                      <span
                        className={`adm-badge ${u.accountType === "trial" ? "adm-badge--trial" : "adm-badge--prod"}`}
                      >
                        {accountTypeLabel(u.accountType)}
                      </span>
                    </td>
                    <td className="adm-td adm-shop">
                      <span className="adm-shop-inner">
                        <Store />
                        {u.shopName || u.shopSlug || "—"}
                      </span>
                    </td>
                    <td className="adm-td adm-lastlogin">{formatLastLoginVi(u.lastSignInTime)}</td>
                    <td className="adm-td adm-td-actions">
                      <div className="adm-actions-m">
                        <div className="adm-dd" data-admin-action-menu>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuUid(menuUid === u.uid ? null : u.uid);
                            }}
                            className="adm-dd-toggle"
                            aria-label="Thao tác"
                          >
                            <MoreHorizontal />
                          </button>
                          {menuUid === u.uid ? (
                            <div data-admin-action-menu className="adm-dd-menu">
                              <button type="button" className="adm-dd-item" onClick={() => openPassword(u)}>
                                <KeyRound />
                                Đổi mật khẩu
                              </button>
                              <button
                                type="button"
                                disabled={viewerUid != null && u.uid === viewerUid}
                                className="adm-dd-item adm-dd-item--danger"
                                onClick={() => openDelete(u)}
                              >
                                <Trash2 />
                                Xóa tài khoản
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                      <div className="adm-actions-d">
                        <button type="button" className="adm-btn-sm" onClick={() => openPassword(u)}>
                          <KeyRound />
                          Đổi mật khẩu
                        </button>
                        <button
                          type="button"
                          disabled={viewerUid != null && u.uid === viewerUid}
                          title={viewerUid != null && u.uid === viewerUid ? "Không thể xóa chính bạn" : undefined}
                          className="adm-btn-sm adm-btn-sm--danger"
                          onClick={() => openDelete(u)}
                        >
                          <Trash2 />
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pageToken && !loading ? (
        <div className="adm-load-more">
          <button type="button" onClick={() => void load(pageToken, true)} disabled={loading} className="adm-btn-icon">
            Tải thêm
          </button>
        </div>
      ) : null}

      {delUid ? (
        <div role="dialog" aria-modal="true" className="adm-modal-bg" onClick={() => !delBusy && setDelUid(null)}>
          <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="adm-modal-title">Xóa tài khoản vĩnh viễn</h2>
            <p className="adm-modal-text">
              <strong style={{ color: "#0f172a" }}>Email:</strong> {delEmail || "—"}
            </p>
            <label className="adm-modal-label">
              {delEmail ? "Nhập lại email để xác nhận" : "Nhập lại UID để xác nhận"}
            </label>
            <input
              type="text"
              autoComplete="off"
              value={delConfirm}
              onChange={(e) => setDelConfirm(e.target.value)}
              placeholder={delEmail || delUid || ""}
              className="adm-modal-input"
            />
            {delMsg ? <p className="adm-msg-err">{delMsg}</p> : null}
            <div className="adm-modal-actions">
              <button type="button" disabled={delBusy} onClick={() => setDelUid(null)} className="adm-btn-ghost">
                Hủy
              </button>
              <button type="button" disabled={delBusy} onClick={() => void submitDelete()} className="adm-btn-rose">
                {delBusy ? <Loader2 className="adm-spin" /> : <Trash2 />}
                {delBusy ? "Đang xóa…" : "Xóa vĩnh viễn"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pwdUid ? (
        <div role="dialog" aria-modal="true" className="adm-modal-bg" onClick={() => !pwdBusy && setPwdUid(null)}>
          <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="adm-modal-title adm-modal-title--dark">Đặt mật khẩu mới</h2>
            <p className="adm-modal-text">{pwdEmail || pwdUid}</p>
            <label className="adm-modal-label" style={{ textTransform: "none", letterSpacing: "normal" }}>
              Mật khẩu mới
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="adm-modal-input"
            />
            <p style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>{hint}</p>
            {pwdMsg ? (
              <p className={pwdMsg.includes("Đã") ? "adm-msg-ok" : "adm-msg-err"}>{pwdMsg}</p>
            ) : null}
            <div className="adm-modal-actions">
              <button type="button" disabled={pwdBusy} onClick={() => setPwdUid(null)} className="adm-btn-ghost">
                Hủy
              </button>
              <button
                type="button"
                disabled={pwdBusy || newPassword.length < 8}
                onClick={() => void submitPassword()}
                className="adm-btn-teal"
              >
                {pwdBusy ? <Loader2 className="adm-spin" /> : <KeyRound />}
                {pwdBusy ? "Đang lưu…" : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
