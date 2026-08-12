import React from 'react';
import { Link } from 'react-router-dom';

const CALCULATOR_PATHS = { calculateSIP: '/sip', calculateStepUpSIP: '/sip', calculateGoal: '/goal-sip', calculateSWP: '/swp', calculateLumpsum: '/lumpsum', calculateEMI: '/loan', calculateFD: '/fd', calculateRD: '/rd', calculatePPF: '/ppf', calculateRetirement: '/retirement', calculateInflation: '/inflation', calculateGST: '/income-tax', calculateTax: '/income-tax' };
const CALCULATOR_NAMES = { calculateSIP: 'SIP Calculator', calculateStepUpSIP: 'Step-Up SIP', calculateGoal: 'Goal Planner', calculateSWP: 'SWP Calculator', calculateLumpsum: 'Lumpsum Calculator', calculateEMI: 'EMI Calculator', calculateFD: 'FD Calculator', calculateRD: 'RD Calculator', calculatePPF: 'PPF Calculator', calculateRetirement: 'Retirement Planner', calculateInflation: 'Inflation Calculator', calculateGST: 'GST Calculator', calculateTax: 'Tax Calculator' };

function inlineMarkdown(value) {
  return String(value || '').split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, index) => part.startsWith('**') && part.endsWith('**') ? <strong key={index}>{part.slice(2, -2)}</strong> : part.startsWith('`') && part.endsWith('`') ? <code key={index}>{part.slice(1, -1)}</code> : <React.Fragment key={index}>{part}</React.Fragment>);
}

export function RichText({ text }) {
  return <div className="ai-rich-text">{String(text || '').split(/\n{2,}/).filter(Boolean).map((block, index) => { const lines = block.split('\n').filter(Boolean); if (lines.every((line) => /^[-*] /.test(line))) return <ul key={index}>{lines.map((line, lineIndex) => <li key={lineIndex}>{inlineMarkdown(line.slice(2))}</li>)}</ul>; if (/^#{1,3} /.test(lines[0])) return <h3 key={index}>{inlineMarkdown(lines[0].replace(/^#{1,3} /, ''))}</h3>; return <p key={index}>{lines.map((line, lineIndex) => <React.Fragment key={lineIndex}>{lineIndex ? <br /> : null}{inlineMarkdown(line)}</React.Fragment>)}</p>; })}</div>;
}

export function ChatBubble({ role = 'assistant', children }) {
  const isUser = role === 'user';
  return <article className={`ai-message ai-message-${isUser ? 'user' : 'assistant'}`}><div className="ai-message-avatar"><span className="material-symbols-rounded">{isUser ? 'person' : 'auto_awesome'}</span></div><div className="ai-message-main"><span className="ai-message-name">{isUser ? 'You' : 'FinCalc AI'}</span><div className="ai-message-content">{children}</div></div></article>;
}

export function TypingIndicator() { return <div className="ai-typing" aria-label="AI is thinking"><span className="ai-typing-avatar material-symbols-rounded">auto_awesome</span><span>FinCalc AI is thinking</span><i /><i /><i /></div>; }
export function SuggestedQuestions({ questions, onSelect }) { return <div className="ai-suggestions">{questions.map((question) => <button type="button" key={question} onClick={() => onSelect(question)}>{question}<span className="material-symbols-rounded">north_east</span></button>)}</div>; }
export function SystemMessage({ children }) { return <div className="ai-system-message"><span className="material-symbols-rounded">info</span>{children}</div>; }

export function CalculatorResultCard({ card, onSave }) {
  const rows = card.result?.summary || [];
  const path = CALCULATOR_PATHS[card.title];
  const name = CALCULATOR_NAMES[card.title] || String(card.title || 'Calculation').replace(/^calculate/, '');
  return <section className="ai-calculation-card"><div className="ai-card-header"><span className="ai-card-icon material-symbols-rounded">calculate</span><div><span>Calculation result</span><strong>{name}</strong></div></div>{rows.length ? <div className="ai-calculation-grid">{rows.map((row, index) => <div key={`${row.label}-${index}`}><span>{row.label}</span><b>{row.value}</b></div>)}</div> : null}{card.result?.assumptions?.length ? <p className="ai-card-note"><b>Assumptions:</b> {card.result.assumptions.join(' · ')}</p> : null}<div className="ai-card-actions">{path ? <Link className="ai-card-open" to={path}><span className="material-symbols-rounded">open_in_new</span>Open</Link> : null}{onSave ? <button type="button" className="ai-card-save" onClick={onSave}><span className="material-symbols-rounded">bookmark_add</span>Save Config</button> : null}</div></section>;
}

export function DraftCard({ card, onSave, onDiscard }) {
  const kind = card.kind || 'configuration';
  const meta = { configuration: ['tune', 'Configuration draft', '/sip'], portfolio: ['pie_chart', 'Portfolio draft', '/portfolio'], goal: ['flag', 'Goal draft', '/ai'] }[kind] || ['draft', 'Draft', '/ai'];
  return <section className="ai-draft-card"><div className="ai-card-header"><span className="ai-card-icon material-symbols-rounded">{meta[0]}</span><div><span>{meta[1]}</span><strong>{card.title || 'Untitled draft'}</strong></div></div><p>{card.description || 'Review this proposed change before saving it to your account.'}</p><div className="ai-card-actions"><Link className="ai-card-open" to={meta[2]}><span className="material-symbols-rounded">open_in_new</span>Open</Link>{onSave ? <button type="button" className="ai-card-save" onClick={onSave}><span className="material-symbols-rounded">save</span>Save Config</button> : null}{onDiscard ? <button type="button" className="ai-card-discard" onClick={onDiscard}>Discard</button> : null}</div></section>;
}
