// Every user-facing route: checked by accessibility (axe), Lighthouse and the per-route JS budget
// (route-budgets.json). Add each new route here when it lands; CONSTRAINTS.md relies on this list.
export const ROUTES = ["/"] as const

// Development reference routes (not user-facing, noindex): accessibility-checked only.
export const DEV_ROUTES = ["/design-system"] as const
