/** A provider-neutral registry. Future tools only need to be registered here. */
const tools = new Map();

export function registerAITool(tool) {
  if (!tool?.id) throw new Error('AI tools require an id');
  tools.set(tool.id, tool);
  return tool;
}

export function getAITool(id) {
  return tools.get(id);
}

export function getAITools(group) {
  return Array.from(tools.values()).filter((tool) => !group || tool.group === group);
}

const toolGroups = {
  calculator: ['calculateSIP', 'calculateStepUpSIP', 'calculateSWP', 'calculateLumpsum', 'calculateGoal', 'calculateRetirement', 'calculateEMI', 'calculateFD', 'calculateRD', 'calculatePPF', 'calculateGST', 'calculateTax', 'comparePlans'],
  portfolio: ['getPortfolio', 'summarizePortfolio', 'comparePortfolio'],
  user: ['getUserProfile', 'getGoals', 'getSavedPlans', 'savePlan', 'loadPlan'],
  chat: ['startChat', 'sendMessage', 'renameChat', 'deleteChat', 'pinChat', 'searchChats'],
};

Object.entries(toolGroups).forEach(([group, ids]) => ids.forEach((id) => registerAITool({
  id,
  group,
  description: `Placeholder for ${id}`,
  execute: async () => ({ status: 'not-connected', tool: id }),
})));
