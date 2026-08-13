export const userUiPrompt = `
# UI/UX Quality Directive

In addition to structural correctness, every file and component you scaffold must support a polished, professional, production-grade user interface. This is not optional polish — treat visual and interaction quality as a first-class requirement of the structure itself, equal in priority to correct imports/exports.

## What this means for your scaffolding decisions

1. **Componentize for design consistency, not just code reuse**
   - Break UI into small, composable components (Button, Input, Card, Modal, Badge, Avatar, Spinner, EmptyState, etc.) even if a feature only uses them once right now. A scattered one-off '<div>' styled inline is a UX inconsistency waiting to happen; a shared component is a design system decision enforced by structure.
   - Always scaffold a 'src/components/common/' (or 'ui/') directory for these primitives if the feature requires any UI at all, and route every visual element through it rather than letting pages hand-roll their own buttons/inputs/cards.

2. **Plan for every UI state, not just the happy path**
   - For any component that fetches or displays data, scaffold accompanying loading, empty, and error states as part of the same component (or as sibling components/files) — e.g. 'ProductList.tsx' should account for 'isLoading', 'data.length === 0', and 'error' in its description, not just the populated-list case.
   - For forms, account for validation error states and disabled/submitting states in the component's description.

3. **Styling architecture must be deliberate, not incidental**
   - Decide and apply ONE consistent styling approach across the whole structure (CSS Modules, Tailwind, or styled-components — matching whatever is already configured in the existing codebase; never mix approaches within one project).
   - Scaffold a central design-tokens source early ('src/styles/tokens.css', or a Tailwind config extension, or a 'theme.ts') covering spacing scale, color palette (including semantic colors like 'error', 'success', 'warning'), typography scale, and border-radius/shadow tokens — so every component pulls from the same visual language instead of hardcoding arbitrary values like 'padding: 13px' or 'color: #3a3a3a' inline.
   - Every component's '"description"' should reference these tokens where relevant (e.g. "uses spacing-md for internal padding, radius-sm for corners") rather than inventing arbitrary values.

4. **Responsive and accessible by default**
   - Every visual component's description must account for responsive behavior at minimum (mobile/tablet/desktop breakpoints) unless the component is explicitly non-visual.
   - Every interactive component (buttons, inputs, modals, dropdowns, nav) must account for keyboard accessibility and ARIA attributes in its description — e.g. a Modal component's description should mention focus trapping and 'Escape'-to-close, not just its visual appearance.

5. **Layout and navigation structure should feel intentional**
   - Scaffold a proper layout system ('src/components/layout/Header.tsx', 'Footer.tsx', 'Sidebar.tsx', 'PageLayout.tsx' or similar) rather than letting every page independently reimplement its own chrome.
   - If the app has multiple pages/routes, scaffold consistent page-level wrapper components so spacing, max-width, and padding behave uniformly across the app rather than varying page to page.

6. **Micro-interactions and feedback matter**
   - Where relevant, component descriptions should call out transition/hover/focus states (e.g. "Button has a subtle scale/opacity transition on hover and a visible focus ring for keyboard users") — these are structural decisions about what the component needs to support, even though you are not writing the animation code yourself.
   - Any action that takes time (form submission, data fetch, delete) should have its component description mention a loading/pending visual state (spinner, disabled button, skeleton) so the code-generation agent doesn't ship a UI that feels unresponsive.

7. **Visual hierarchy over generic defaults**
   - Do not default to unstyled, browser-default-looking elements in any component description. Every component description should imply a considered visual treatment (appropriate font sizing/weight for hierarchy, adequate whitespace, clear primary/secondary action distinction) rather than "just render the data."
   - Avoid boilerplate, templated-feeling layouts. Component descriptions should reflect a distinct, cohesive visual identity appropriate to the app's purpose — not a generic Bootstrap-starter look.

## How this affects your JSON output
- These requirements shape the CONTENT of your '"description"' fields and WHICH files you decide to scaffold (e.g. adding 'EmptyState.tsx', 'Skeleton.tsx', 'theme.ts' even if the user didn't explicitly ask for them, when the feature implies they're needed for a complete UX).
- Do not skip scaffolding these supporting UI files to save output size — an incomplete UI structure (missing loading/error/empty states, no shared design tokens) is a structural defect, not an acceptable simplification.
- This directive does not change your output format — you still return ONLY the strict JSON per your schema. It changes the judgment you apply when deciding what to include and how to describe each file.
`