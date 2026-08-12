import React from 'react';

export default function QuickActions({ actions, onChoose }) {
  return <div className="ai-quick-actions">{actions.map((action) => <button key={action.id} type="button" onClick={() => onChoose(action)}><span className="material-symbols-rounded">{action.icon}</span><span>{action.label}</span><span className="material-symbols-rounded ai-quick-arrow">arrow_forward</span></button>)}</div>;
}
