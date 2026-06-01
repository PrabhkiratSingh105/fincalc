/** @typedef {{ label: string; value: string | number; tone?: string; sub?: string }} SummaryCard */
/** @typedef {{ title: string; type: string; data: object; options?: object; height?: number }} ChartDef */
/** @typedef {{ columns: string[]; rows: (string|number)[][] }} TableDef */

export function buildInsights(insights) {
  return {
    takeaways: insights.takeaways || [],
    mistakes: insights.mistakes || [],
    tips: insights.tips || [],
    faqs: insights.faqs || [],
    formula: insights.formula || '',
    example: insights.example || '',
    inflation: insights.inflation || '',
    tax: insights.tax || '',
  };
}
