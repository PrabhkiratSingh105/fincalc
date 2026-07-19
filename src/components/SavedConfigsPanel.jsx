import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import AuthModal from "./AuthModal";
import { API } from "../config";

function formatDate(iso) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SavedConfigsPanel({
  storageKey,
  pageLabel,
  getConfig,
  applyConfig,
  results,
}) {
  const { user, token, loading: authLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [configs, setConfigs] = useState([]);
  const [newName, setNewName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("view"); // 'view' or 'save'

  const readErrorMessage = async (response, fallback) => {
    const data = await response.json().catch(() => ({}));
    return data.message || fallback;
  };

  const refresh = useCallback(async () => {
    if (!user || !token) {
      setConfigs([]);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API}/api/configs/${storageKey}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Failed to fetch configurations"));
      }

      const data = await response.json();
      setConfigs(data.configs || []);
    } catch (err) {
      setConfigs([]);
      showError(err.message || "Server configs are unavailable.");
    } finally {
      setLoading(false);
    }
  }, [user, token, storageKey]);

  useEffect(() => {
    if (open) {
      refresh();
      setMessage("");
      setError("");
      setEditingId(null);
      setPendingDeleteId(null);
    }
  }, [open, user, token, refresh]);

  const showSuccess = (text) => {
    setError("");
    setMessage(text);
  };

  const showError = (text) => {
    setMessage("");
    setError(text);
  };

  const handleSaveNew = async () => {
    try {
      setLoading(true);
      const configData = getConfig();
      if (!user || !token) {
        setAuthModalOpen(true);
        showError("Log in to save configurations to Supabase.");
        return;
      }

      const response = await fetch(`${API}/api/configs/${storageKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newName,
          config: configData,
        }),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Failed to save configuration"));
      }

      setNewName("");
      await refresh();
      showSuccess("Configuration saved.");
    } catch (err) {
      showError(err.message || "Failed to save configuration.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoad = (entry) => {
    applyConfig(entry.config);
    showSuccess(`Loaded "${entry.name}".`);
    setTimeout(() => setOpen(false), 400);
  };

  const handleUpdate = async (entry) => {
    try {
      setLoading(true);
      if (!user || !token) {
        setAuthModalOpen(true);
        showError("Log in to update configurations in Supabase.");
        return;
      }

      const response = await fetch(`${API}/api/configs/${storageKey}/${entry.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          config: getConfig(),
        }),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Failed to update configuration"));
      }

      await refresh();
      showSuccess(`Updated "${entry.name}" with current settings.`);
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startRename = (entry) => {
    setEditingId(entry.id);
    setEditingName(entry.name);
    setPendingDeleteId(null);
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleRename = async (entry) => {
    try {
      setLoading(true);
      if (!user || !token) {
        setAuthModalOpen(true);
        showError("Log in to rename configurations in Supabase.");
        return;
      }

      const response = await fetch(`${API}/api/configs/${storageKey}/${entry.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editingName,
        }),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Failed to rename configuration"));
      }

      cancelRename();
      await refresh();
      showSuccess("Configuration renamed.");
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (entry) => {
    try {
      setLoading(true);
      if (!user || !token) {
        setAuthModalOpen(true);
        showError("Log in to delete configurations from Supabase.");
        return;
      }

      const response = await fetch(`${API}/api/configs/${storageKey}/${entry.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Failed to delete configuration"));
      }

      setPendingDeleteId(null);
      if (editingId === entry.id) {
        cancelRename();
      }
      await refresh();
      showSuccess(`Deleted "${entry.name}".`);
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePdfReport = async () => {
    if (results?.pdfData) {
      const { downloadPdfReport } = await import('../utils/pdfExport');
      downloadPdfReport({
        ...results.pdfData,
        steps: results.steps,
        assumptions: results.assumptions,
      });
    }
  };

  return (
    <>
      <div className="history-actions">
        <button
          type="button"
          className="mini-btn primary"
          onClick={() => {
            setNewName("");
            setMode('save');
            setOpen(true);
          }}
          disabled={authLoading}
        >
          <span className="material-symbols-rounded">bookmark_add</span>
          Save Config
        </button>
        <button
          type="button"
          className="mini-btn"
          onClick={() => {
            setMode('view');
            setOpen(true);
          }}
          disabled={authLoading}
        >
          <span className="material-symbols-rounded">folder_open</span>
          Open Config
        </button>
      </div>

      {authModalOpen && (
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
        />
      )}

      <div
        className={`saved-config-backdrop ${open ? "" : "hidden"}`}
        onClick={(e) => e.target === e.currentTarget && setOpen(false)}
      >
        <div
          className="saved-config-modal"
          role="dialog"
          aria-labelledby="saved-config-title"
        >
          <div className="saved-config-head">
            <div>
              <h2 id="saved-config-title">Saved configurations</h2>
              <p>
                {pageLabel} - {user ? `for ${user.username}` : "login required"}
              </p>
            </div>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setOpen(false)}
              aria-label="Close saved configurations"
            >
              <span className="material-symbols-rounded">close</span>
            </button>
          </div>

          {!user ? (
            <div className="saved-config-alert error">
              You must be logged in to save or load configurations.{" "}
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setAuthModalOpen(true);
                }}
                style={{
                  color: "inherit",
                  textDecoration: "underline",
                  cursor: "pointer",
                  background: "none",
                  border: "none",
                }}
              >
                Login now
              </button>
            </div>
          ) : (
            <>
              {mode === 'save' && (
                <div className="saved-config-save-row">
                  <input
                    type="text"
                    className="saved-config-input"
                    placeholder="Name this configuration..."
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveNew()}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="mini-btn primary"
                    onClick={handleSaveNew}
                    disabled={loading}
                  >
                    Save current
                  </button>
                </div>
              )}

              {(message || error) && (
                <div
                  className={`saved-config-alert ${error ? "error" : "success"}`}
                >
                  {error || message}
                </div>
              )}

              <div className="saved-config-list">
                {loading && configs.length === 0 ? (
                  <div className="saved-config-empty">
                    Loading configurations...
                  </div>
                ) : configs.length === 0 ? (
                  <div className="saved-config-empty">
                    No saved configurations yet. Adjust the inputs and save the
                    current setup.
                  </div>
                ) : (
                  configs.map((entry) => (
                    <div className="saved-config-item" key={entry.id}>
                      <div className="saved-config-item-main">
                        {editingId === entry.id ? (
                          <div className="saved-config-rename-row">
                            <input
                              type="text"
                              className="saved-config-input"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleRename(entry);
                                if (e.key === "Escape") cancelRename();
                              }}
                              autoFocus
                              disabled={loading}
                            />
                            <button
                              type="button"
                              className="saved-config-action"
                              onClick={() => handleRename(entry)}
                              disabled={loading}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              className="saved-config-action muted"
                              onClick={cancelRename}
                              disabled={loading}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="saved-config-name">
                              {entry.name}
                            </div>
                            <div className="saved-config-meta">
                              Updated {formatDate(entry.updatedAt)}
                            </div>
                          </>
                        )}
                      </div>

                      {editingId !== entry.id && (
                        <div className="saved-config-actions">
                          <button
                            type="button"
                            className="saved-config-action primary"
                            onClick={() => handleLoad(entry)}
                            disabled={loading}
                          >
                            Load
                          </button>
                          <button
                            type="button"
                            className="saved-config-action"
                            onClick={() => handleUpdate(entry)}
                            disabled={loading}
                          >
                            Update
                          </button>
                          <button
                            type="button"
                            className="saved-config-action"
                            onClick={() => startRename(entry)}
                            disabled={loading}
                          >
                            Rename
                          </button>
                          <button
                            type="button"
                            className="saved-config-action"
                            onClick={handlePdfReport}
                            disabled={loading}
                          >
                            PDF Report
                          </button>
                          {pendingDeleteId === entry.id ? (
                            <>
                              <button
                                type="button"
                                className="saved-config-action danger"
                                onClick={() => handleDelete(entry)}
                                disabled={loading}
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                className="saved-config-action muted"
                                onClick={() => setPendingDeleteId(null)}
                                disabled={loading}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="saved-config-action danger"
                              onClick={() => setPendingDeleteId(entry.id)}
                              disabled={loading}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
