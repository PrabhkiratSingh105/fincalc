import React, { useCallback, useEffect, useState } from 'react';
import {
  deleteConfig,
  listConfigs,
  saveConfig,
  updateConfig,
} from '../utils/savedConfigs';
import { createPublicConfigLink } from '../utils/share';

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SavedConfigsPanel({
  storageKey,
  pageLabel,
  getConfig,
  applyConfig,
}) {
  const [open, setOpen] = useState(false);
  const [configs, setConfigs] = useState([]);
  const [newName, setNewName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const refresh = useCallback(() => {
    setConfigs(listConfigs(storageKey));
  }, [storageKey]);

  useEffect(() => {
    if (open) {
      refresh();
      setMessage('');
      setError('');
      setEditingId(null);
      setPendingDeleteId(null);
    }
  }, [open, refresh]);

  const showSuccess = (text) => {
    setError('');
    setMessage(text);
  };

  const showError = (text) => {
    setMessage('');
    setError(text);
  };

  const handleSaveNew = () => {
    try {
      saveConfig(storageKey, newName, getConfig());
      setNewName('');
      refresh();
      showSuccess('Configuration saved.');
    } catch (err) {
      showError(err.message);
    }
  };

  const handleLoad = (entry) => {
    applyConfig(entry.config);
    showSuccess(`Loaded "${entry.name}".`);
    setTimeout(() => setOpen(false), 400);
  };

  const handleUpdate = (entry) => {
    try {
      updateConfig(storageKey, entry.id, { config: getConfig() });
      refresh();
      showSuccess(`Updated "${entry.name}" with current settings.`);
    } catch (err) {
      showError(err.message);
    }
  };

  const startRename = (entry) => {
    setEditingId(entry.id);
    setEditingName(entry.name);
    setPendingDeleteId(null);
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleRename = (entry) => {
    try {
      updateConfig(storageKey, entry.id, { name: editingName });
      cancelRename();
      refresh();
      showSuccess('Configuration renamed.');
    } catch (err) {
      showError(err.message);
    }
  };

  const handleDelete = (entry) => {
    deleteConfig(storageKey, entry.id);
    setPendingDeleteId(null);
    if (editingId === entry.id) {
      cancelRename();
    }
    refresh();
    showSuccess(`Deleted "${entry.name}".`);
  };

  const handlePublicShare = async (entry) => {
    try {
      showSuccess('Creating public link...');
      const data = await createPublicConfigLink({
        page: storageKey,
        title: entry.name,
        config: entry.config,
      });
      const url = data.url || `${window.location.origin}/${storageKey}/${data.token}`;
      await navigator.clipboard.writeText(url);
      showSuccess(`Public link copied for "${entry.name}".`);
    } catch (err) {
      showError(err.message || 'Could not create public link.');
    }
  };

  return (
    <>
      <div className="history-actions">
        <button
          type="button"
          className="mini-btn primary"
          onClick={() => {
            setNewName('');
            setOpen(true);
          }}
        >
          <span className="material-symbols-rounded">bookmark_add</span>
          Save config
        </button>
        <button type="button" className="mini-btn" onClick={() => setOpen(true)}>
          <span className="material-symbols-rounded">folder_open</span>
          My configs
        </button>
      </div>

      <div
        className={`saved-config-backdrop ${open ? '' : 'hidden'}`}
        onClick={(e) => e.target === e.currentTarget && setOpen(false)}
      >
        <div className="saved-config-modal" role="dialog" aria-labelledby="saved-config-title">
          <div className="saved-config-head">
            <div>
              <h2 id="saved-config-title">Saved configurations</h2>
              <p>{pageLabel} · stored in this browser</p>
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

          <div className="saved-config-save-row">
            <input
              type="text"
              className="saved-config-input"
              placeholder="Name this configuration…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveNew()}
            />
            <button type="button" className="mini-btn primary" onClick={handleSaveNew}>
              Save current
            </button>
          </div>

          {(message || error) && (
            <div className={`saved-config-alert ${error ? 'error' : 'success'}`}>
              {error || message}
            </div>
          )}

          <div className="saved-config-list">
            {configs.length === 0 ? (
              <div className="saved-config-empty">
                No saved configurations yet. Adjust the inputs and save the current setup.
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
                            if (e.key === 'Enter') handleRename(entry);
                            if (e.key === 'Escape') cancelRename();
                          }}
                          autoFocus
                        />
                        <button
                          type="button"
                          className="saved-config-action"
                          onClick={() => handleRename(entry)}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="saved-config-action muted"
                          onClick={cancelRename}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="saved-config-name">{entry.name}</div>
                        <div className="saved-config-meta">Updated {formatDate(entry.updatedAt)}</div>
                      </>
                    )}
                  </div>

                  {editingId !== entry.id && (
                    <div className="saved-config-actions">
                      <button
                        type="button"
                        className="saved-config-action primary"
                        onClick={() => handleLoad(entry)}
                      >
                        Load
                      </button>
                      <button
                        type="button"
                        className="saved-config-action"
                        onClick={() => handleUpdate(entry)}
                      >
                        Update
                      </button>
                      <button
                        type="button"
                        className="saved-config-action"
                        onClick={() => startRename(entry)}
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        className="saved-config-action"
                        onClick={() => handlePublicShare(entry)}
                      >
                        Public link
                      </button>
                      {pendingDeleteId === entry.id ? (
                        <>
                          <button
                            type="button"
                            className="saved-config-action danger"
                            onClick={() => handleDelete(entry)}
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            className="saved-config-action muted"
                            onClick={() => setPendingDeleteId(null)}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="saved-config-action danger"
                          onClick={() => setPendingDeleteId(entry.id)}
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
        </div>
      </div>
    </>
  );
}
