/** @typedef {'general'|'calculator'|'portfolio'|'goal-planning'|'plan-comparison'|'financial-qa'} ConversationType */

/** @typedef {{ id: string, label: string, icon: string, conversationType: ConversationType, context?: object }} QuickAction */

export const CONVERSATION_TYPES = {
  general: { label: 'New conversation', icon: 'chat' },
  calculator: { label: 'Calculator discussion', icon: 'calculate' },
  portfolio: { label: 'Portfolio discussion', icon: 'pie_chart' },
  'goal-planning': { label: 'Goal planning', icon: 'flag' },
  'plan-comparison': { label: 'Plan comparison', icon: 'compare_arrows' },
  'financial-qa': { label: 'Financial Q&A', icon: 'help' },
};
