import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAIContext } from '../../context/ai/AIContext';
import { aiClient } from '../../services/ai/client';
import {
  CalculatorResultCard,
  ChatBubble,
  DraftCard,
  RichText,
  SuggestedQuestions,
  SystemMessage,
  TypingIndicator,
} from '../../components/ai/AIResponseComponents';
import { CONVERSATION_TYPES } from '../../types/ai';

const QUICK_ACTIONS = [
  { id: 'sip', icon: 'calculate', title: 'Run a calculation', description: 'SIP, loan, FD, tax, or retirement maths.', type: 'calculator' },
  { id: 'portfolio', icon: 'pie_chart', title: 'Review my portfolio', description: 'Understand allocation, diversification, and next steps.', type: 'portfolio' },
  { id: 'goal', icon: 'timeline', title: 'Plan a financial goal', description: 'Turn a future target into a practical plan.', type: 'goal-planning' },
  { id: 'learn', icon: 'article', title: 'Explain a concept', description: 'Clear, educational answers to money questions.', type: 'financial-qa' },
];

const SUGGESTIONS = {
  general: ['How should I start investing?', 'Compare FD and PPF', 'Help me set a monthly budget'],
  calculator: ['Calculate an SIP for ₹20,000 a month', 'What would my EMI be?', 'Plan a retirement corpus'],
  portfolio: ['Is my portfolio diversified?', 'Review my allocation', 'Help me create a portfolio draft'],
  'goal-planning': ['How much do I need for retirement?', 'Plan a child education fund', 'Can I reach my goal on time?'],
  'plan-comparison': ['Compare my saved plans', 'Which plan has better returns?', 'Show me the differences'],
  'financial-qa': ['What is an index fund?', 'How does compounding work?', 'Explain tax-saving investments'],
};

function compactContext(context) {
  const summary = Array.isArray(context.calculatorResults?.summary)
    ? context.calculatorResults.summary.slice(0, 6).map(({ label, value }) => ({ label, value }))
    : undefined;

  return {
    calculator: context.calculator ? { id: context.calculator.id, title: context.calculator.title, results: summary } : undefined,
    portfolio: context.portfolio,
    goals: context.goals,
    savedPlans: context.savedPlans,
    userProfile: context.userProfile,
    conversation: context.conversation,
  };
}

function addOrUpdateChat(chats, nextChat) {
  const withoutCurrent = chats.filter((item) => item.id !== nextChat.id);
  return [nextChat, ...withoutCurrent].sort(
    (left, right) => Number(right.pinned) - Number(left.pinned)
      || new Date(right.updatedAt) - new Date(left.updatedAt)
  );
}

function createPendingMessage(text) {
  return {
    id: `pending-${Date.now()}`,
    role: 'user',
    text,
    createdAt: new Date().toISOString(),
    actions: [],
    cards: [],
  };
}

function IconButton({ label, icon, onClick, className = '' }) {
  return <button type="button" className={`ai-icon-button ${className}`} onClick={onClick} aria-label={label}><span className="material-symbols-rounded">{icon}</span></button>;
}

function ConversationRow({ item, active, onOpen, onPin, onRename, onDelete }) {
  return (
    <div className={`ai-conversation-row ${active ? 'is-active' : ''}`}>
      <button type="button" className="ai-conversation-open" onClick={() => onOpen(item.id)}>
        <span className="material-symbols-rounded">chat_bubble</span>
        <span className="ai-conversation-title">{item.title || 'New conversation'}</span>
        {item.pinned ? <span className="material-symbols-rounded ai-row-pin">keep</span> : null}
      </button>
      <div className="ai-conversation-actions">
        <IconButton label={item.pinned ? 'Unpin conversation' : 'Pin conversation'} icon={item.pinned ? 'keep_off' : 'keep'} onClick={() => onPin(item)} />
        <IconButton label="Rename conversation" icon="edit" onClick={() => onRename(item)} />
        <IconButton label="Delete conversation" icon="delete" onClick={() => onDelete(item.id)} />
      </div>
    </div>
  );
}

function Sidebar({ chats, selectedChat, query, onQueryChange, isLoading, onNew, onOpen, onPin, onRename, onDelete, user }) {
  return (
    <div className="ai-sidebar-content">
      <div className="ai-sidebar-brand">
        <span className="ai-brand-mark material-symbols-rounded">auto_awesome</span>
        <div><strong>FinCalc AI</strong><span>Your AI finance assistant</span></div>
      </div>
      <button type="button" className="ai-new-conversation" onClick={onNew} disabled={isLoading}><span className="material-symbols-rounded">add</span>New conversation</button>
      <label className="ai-search"><span className="material-symbols-rounded">search</span><input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search conversations" /></label>
      <div className="ai-conversations"><p className="ai-sidebar-heading">Recent</p>{chats.length ? chats.map((item) => <ConversationRow key={item.id} item={item} active={selectedChat?.id === item.id} onOpen={onOpen} onPin={onPin} onRename={onRename} onDelete={onDelete} />) : <p className="ai-no-conversations">{user ? 'Your saved conversations will appear here.' : 'Log in to save your conversations.'}</p>}</div>
      <p className="ai-sidebar-privacy"><span className="material-symbols-rounded">lock</span>Financial guidance is educational. Check important decisions and assumptions.</p>
    </div>
  );
}

function EmptyState({ onAction, onPrompt }) {
  return (
    <section className="ai-empty-state">
      <span className="ai-empty-mark material-symbols-rounded">auto_awesome</span>
      <h1>How can I help with your finances?</h1>
      <p>Ask about budgeting, saving, investing, loans, taxes, or your next financial goal.</p>
      <div className="ai-quick-actions">
        {QUICK_ACTIONS.map((action) => <button type="button" key={action.id} onClick={() => onAction(action)}><span className="ai-quick-icon material-symbols-rounded">{action.icon}</span><span><strong>{action.title}</strong><small>{action.description}</small></span><span className="material-symbols-rounded ai-quick-arrow">arrow_forward</span></button>)}
      </div>
      <div className="ai-empty-prompts"><span>Try asking</span>{SUGGESTIONS.general.slice(0, 2).map((prompt) => <button type="button" key={prompt} onClick={() => onPrompt(prompt)}>{prompt}</button>)}</div>
    </section>
  );
}

export default function AIHomePage() {
  const location = useLocation();
  const { user, token } = useAuth();
  const { context, prepareContext, clearContext } = useAIContext();
  const [chats, setChats] = useState([]);
  const [chat, setChat] = useState(null);
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const messageEndRef = useRef(null);
  const inputRef = useRef(null);

  const preparedContext = useMemo(() => compactContext({ ...context, conversation: { type: location.state?.conversationType || context.conversation?.type || 'general' } }), [context, location.state]);
  const activeType = chat?.type || preparedContext.conversation?.type || 'general';
  const suggestions = SUGGESTIONS[activeType] || SUGGESTIONS.general;

  const refreshChats = useCallback(async (search = '') => {
    if (!token) { setChats([]); return; }
    try { const data = await aiClient.listChats(token, search); setChats(data.chats || []); } catch (requestError) { console.error('Unable to load conversations', requestError); }
  }, [token]);

  useEffect(() => { refreshChats(); }, [refreshChats]);
  useEffect(() => { const timer = window.setTimeout(() => refreshChats(query), 250); return () => window.clearTimeout(timer); }, [query, refreshChats]);
  useEffect(() => { messageEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [chat?.messages, loading]);

  const updateChat = useCallback(async (item, payload) => {
    try {
      const data = await aiClient.updateChat(token, item.id, payload);
      setChats((current) => addOrUpdateChat(current, data.chat));
      setChat((current) => current?.id === item.id ? { ...current, ...data.chat } : current);
    } catch (requestError) { setError(requestError.message); }
  }, [token]);

  const openChat = async (id) => {
    if (!token) return;
    setLoading(true); setError('');
    try { const data = await aiClient.getChat(token, id); setChat(data.chat); setDrawerOpen(false); } catch (requestError) { setError(requestError.message); } finally { setLoading(false); }
  };

  const createChat = async (action) => {
    if (!token) { setError('Log in to start a private AI conversation.'); return; }
    setLoading(true); setError('');
    const type = action?.type || preparedContext.conversation?.type || 'general';
    const nextContext = compactContext({ ...preparedContext, conversation: { type } });
    try {
      const data = await aiClient.createChat(token, { type, context: nextContext, title: action?.title || 'New conversation' });
      setChat(data.chat);
      setChats((current) => addOrUpdateChat(current, data.chat));
      prepareContext(nextContext);
      setDrawerOpen(false);
    } catch (requestError) { setError(requestError.message); } finally { setLoading(false); inputRef.current?.focus(); }
  };

  const send = async (text = message, action = 'send', draftId) => {
    const content = String(text || '').trim();
    if (!content && action === 'send') return;
    if (!token) { setError('Log in to start a private AI conversation.'); return; }
    setLoading(true); setError('');
    if (action === 'send') setMessage('');
    try {
      let activeChat = chat;
      if (!activeChat) {
        const type = preparedContext.conversation?.type || 'general';
        const data = await aiClient.createChat(token, { type, context: preparedContext, title: content.slice(0, 58) || 'New conversation' });
        activeChat = data.chat;
        setChats((current) => addOrUpdateChat(current, activeChat));
        prepareContext({ ...preparedContext, conversation: { type } });
      }

      if (action === 'send') {
        const pendingMessage = createPendingMessage(content);
        const optimisticChat = {
          ...activeChat,
          title: activeChat.title === 'New conversation' ? content.slice(0, 58) : activeChat.title,
          updatedAt: pendingMessage.createdAt,
          messages: [...(activeChat.messages || []), pendingMessage],
        };
        setChat(optimisticChat);
        setChats((current) => addOrUpdateChat(current, optimisticChat));
      }

      const data = await aiClient.sendMessage(token, activeChat.id, { message: content, action, draftId, context: preparedContext });
      setChat(data.chat);
      setChats((current) => addOrUpdateChat(current, data.chat));
    } catch (requestError) {
      if (requestError.data?.chat) setChat(requestError.data.chat);
      setError(requestError.message || 'Something went wrong. Please try again.');
    } finally { setLoading(false); window.setTimeout(() => inputRef.current?.focus(), 0); }
  };

  const deleteChat = async (id) => {
    if (!window.confirm('Delete this conversation?')) return;
    try { await aiClient.deleteChat(token, id); if (chat?.id === id) { setChat(null); clearContext(); } await refreshChats(query); } catch (requestError) { setError(requestError.message); }
  };
  const renameChat = (item) => { const title = window.prompt('Conversation name', item.title); if (title?.trim()) updateChat(item, { title: title.trim() }); };
  const newConversation = () => { setChat(null); setError(''); setMessage(''); setDrawerOpen(false); inputRef.current?.focus(); };
  const handleSubmit = (event) => { event.preventDefault(); send(); };

  return (
    <main className="page ai-page">
      <aside className="ai-sidebar"><Sidebar chats={chats} selectedChat={chat} query={query} onQueryChange={setQuery} isLoading={loading} user={user} onNew={newConversation} onOpen={openChat} onPin={(item) => updateChat(item, { pinned: !item.pinned })} onRename={renameChat} onDelete={deleteChat} /></aside>
      <button type="button" className="ai-mobile-menu" onClick={() => setDrawerOpen(true)} aria-label="Open conversations"><span className="material-symbols-rounded">menu</span></button>
      <div className={`ai-drawer-backdrop ${drawerOpen ? 'is-open' : ''}`} onClick={() => setDrawerOpen(false)} />
      <aside className={`ai-mobile-drawer ${drawerOpen ? 'is-open' : ''}`} aria-label="Conversations"><IconButton label="Close conversations" icon="close" className="ai-drawer-close" onClick={() => setDrawerOpen(false)} /><Sidebar chats={chats} selectedChat={chat} query={query} onQueryChange={setQuery} isLoading={loading} user={user} onNew={newConversation} onOpen={openChat} onPin={(item) => updateChat(item, { pinned: !item.pinned })} onRename={renameChat} onDelete={deleteChat} /></aside>
      <section className="ai-workspace">
        <div className="ai-thread">
          {chat ? <>
            
            {Object.values(chat.context || {}).some(Boolean) ? <SystemMessage>Relevant context is attached from your private FinCalc workspace.</SystemMessage> : null}
            <div className="ai-message-list">{(chat.messages || []).map((item, index) => <ChatBubble key={item.id || `${item.role}-${index}`} role={item.role}><RichText text={item.text} />{item.cards?.map((card, cardIndex) => card.type === 'draft' ? <DraftCard key={card.draftId || cardIndex} card={card} onSave={() => send('', 'confirm_save', card.draftId)} onDiscard={() => send('', 'discard_draft', card.draftId)} /> : <CalculatorResultCard key={`${card.title}-${cardIndex}`} card={card} onSave={() => send(`Save this ${card.title.replace(/^calculate/, '')} configuration for me.`)} />)}</ChatBubble>)}{loading ? <TypingIndicator /> : null}<div ref={messageEndRef} /></div>
            {!loading ? <SuggestedQuestions questions={suggestions} onSelect={send} /> : null}
          </> : <EmptyState onAction={createChat} onPrompt={send} />}
        </div>
        {error ? <div className="ai-error" role="alert"><span className="material-symbols-rounded">error</span><span>{error}</span><button type="button" onClick={() => send(message || 'Please try again.')}>Retry</button><button type="button" aria-label="Dismiss error" onClick={() => setError('')}><span className="material-symbols-rounded">close</span></button></div> : null}
        <div className="ai-composer-dock"><form className="ai-composer" onSubmit={handleSubmit}><span className="material-symbols-rounded ai-composer-icon">auto_awesome</span><textarea ref={inputRef} value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send(); } }} disabled={loading} rows="1" placeholder="Ask about your money, goals, or a calculation..." aria-label="Message FinCalc AI" /><button type="submit" disabled={loading || !message.trim()} aria-label="Send message"><span className="material-symbols-rounded">arrow_upward</span></button></form><p>FinCalc AI can make mistakes. Verify important information.</p></div>
      </section>
    </main>
  );
}
