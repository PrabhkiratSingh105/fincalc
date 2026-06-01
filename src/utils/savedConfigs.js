const PREFIX = 'fincalc:configs:';

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `cfg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function listConfigs(pageKey) {
  try {
    const raw = localStorage.getItem(`${PREFIX}${pageKey}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persist(pageKey, configs) {
  localStorage.setItem(`${PREFIX}${pageKey}`, JSON.stringify(configs));
}

function assertName(name, configs, excludeId = null) {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Name is required');
  }
  const duplicate = configs.some(
    (entry) =>
      entry.id !== excludeId && entry.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (duplicate) {
    throw new Error('A configuration with this name already exists');
  }
  return trimmed;
}

export function saveConfig(pageKey, name, config) {
  const configs = listConfigs(pageKey);
  const trimmed = assertName(name, configs);
  const entry = {
    id: generateId(),
    name: trimmed,
    config,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  configs.unshift(entry);
  persist(pageKey, configs);
  return entry;
}

export function updateConfig(pageKey, id, updates) {
  const configs = listConfigs(pageKey);
  const index = configs.findIndex((entry) => entry.id === id);
  if (index === -1) {
    throw new Error('Configuration not found');
  }

  if (updates.name != null) {
    configs[index].name = assertName(updates.name, configs, id);
  }
  if (updates.config != null) {
    configs[index].config = updates.config;
  }
  configs[index].updatedAt = new Date().toISOString();
  persist(pageKey, configs);
  return configs[index];
}

export function deleteConfig(pageKey, id) {
  persist(
    pageKey,
    listConfigs(pageKey).filter((entry) => entry.id !== id)
  );
}
