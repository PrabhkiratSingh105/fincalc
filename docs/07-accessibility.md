# Accessibility

- Buttons that use icons need meaningful `aria-label`s; menu/toggle controls expose state with `aria-expanded` where applicable.
- Preserve keyboard-operable header menus, visible focus styles, semantic form controls, and readable error/loading states.
- Do not rely on color alone for financial status; summary cards also use labels/text.
- Charts need adjacent summaries/tables/steps that communicate the result without visual interpretation.
- Mobile calculator flow has an explicit Input → Find → Output path; retain a clear “Edit values” return action.
- Respect contrast in both token themes; do not introduce un-tokenized light-only text/surfaces.
