---
name: Technical Support Dashboard System
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#0058be'
  on-secondary: '#ffffff'
  secondary-container: '#2170e4'
  on-secondary-container: '#fefcff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#341100'
  on-tertiary-container: '#d95f00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#ffdbca'
  tertiary-fixed-dim: '#ffb690'
  on-tertiary-fixed: '#341100'
  on-tertiary-fixed-variant: '#783200'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.25'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  title-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: '1'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  container-max: 1440px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style
The design system is engineered for high-stakes, high-performance technical environments where cognitive load must be minimized to facilitate rapid decision-making. The brand personality is **authoritative, precise, and dependable**, evoking the feeling of a sophisticated mission control center.

The chosen style is **Corporate / Modern** with a strong emphasis on **Minimalism**. By utilizing a restricted palette and generous whitespace, the design system ensures that critical data points—such as system outages or high-priority tickets—stand out immediately. The aesthetic prioritizes functional clarity over decorative elements, using subtle depth and refined typography to establish a premium professional atmosphere.

## Colors
The color architecture of this design system is tiered to balance structural stability with urgent communication:

- **Structural Foundation:** Deep Navy (#0F172A) is used for persistent navigation and headers, providing a grounded "anchor" for the UI. 
- **Action Layer:** Highlight Blue (#3B82F6) is reserved exclusively for primary interactive elements, ensuring a clear path for user intent.
- **Surface Strategy:** A dual-surface approach uses Light Gray (#F8FAFC) for the canvas and pure White (#FFFFFF) for interactive cards, creating a natural layering effect without heavy shadows.
- **Semantic Urgency:** High-saturation tones are used for status indicators. These colors must be used sparingly to maintain their effectiveness as visual interrupts.

## Typography
The design system utilizes **Inter** for all roles due to its exceptional x-height and legibility in data-heavy environments. 

- **Hierarchy:** Display and Headline levels use tighter letter spacing and heavier weights to command attention.
- **Data Density:** Body-md (14px) is the primary size for table rows and ticket descriptions, striking a balance between readability and information density.
- **Labels:** Small, semi-bold, uppercase labels are used for metadata and table headers to distinguish them clearly from actionable data.
- **Numerical Data:** For KPI dashboards, tabular lining figures should be enabled to ensure numbers align vertically in tables.

## Layout & Spacing
The layout follows a **fluid grid system** with fixed maximum constraints to ensure performance on ultra-wide monitors.

- **The 8px Rhythm:** All spacing, padding, and margins are multiples of 8px. This creates a predictable visual cadence.
- **Desktop (1280px+):** A 12-column grid with 24px gutters. The side navigation is fixed at 280px, while the main content area remains fluid.
- **Tablet (768px - 1279px):** Content reflows to an 8-column grid. The sidebar collapses into a rail or becomes hidden under a hamburger menu.
- **Mobile (< 767px):** A 4-column grid with 16px margins. Cards stack vertically, and complex tables transition into expandable list items.
- **Information Density:** Use 'lg' (24px) padding for primary containers and 'md' (16px) for internal card components to maintain the "generous grid" requirement.

## Elevation & Depth
Depth in the design system is conveyed through **low-contrast outlines** and **ambient shadows**, avoiding heavy drops or skeuomorphic effects.

- **Base Layer:** The background (#F8FAFC) is the lowest level.
- **Card Layer:** White surfaces (#FFFFFF) use a 1px border of #E2E8F0. For primary content, apply a very soft shadow: `0 4px 6px -1px rgba(15, 23, 42, 0.05)`.
- **Interactive States:** On hover, a card's shadow should slightly intensify (`0 10px 15px -3px rgba(15, 23, 42, 0.08)`) and the border color should shift toward the action blue.
- **Overlays:** Modals and dropdowns use a medium-diffused shadow with a 20% opacity backdrop blur to create focus without losing context of the background data.

## Shapes
The shape language is modern and approachable but retains a professional edge. 

- **Standard Radius:** 8px (0.5rem) is the default for buttons, input fields, and small cards.
- **Large Components:** Main content containers and large dashboard widgets use 16px (1rem) for `rounded-lg`.
- **Inner vs Outer:** When nesting elements (e.g., a button inside a padded card), ensure the inner radius is slightly smaller than the outer radius to maintain geometric harmony.
- **Search Bars:** These are the only elements permitted to use a full pill-shape (9999px) to distinguish global search functionality from standard form inputs.

## Components
- **Buttons:** 
  - *Primary:* Solid #3B82F6 with white text, 8px radius.
  - *Secondary:* Ghost style with #0F172A border and text.
- **Status Chips:** Small badges with a subtle background (10% opacity of the semantic color) and high-contrast text (100% opacity of the semantic color).
- **Data Tables:** 
  - Row height: 52px for standard, 44px for condensed.
  - No vertical borders; use 1px horizontal dividers (#F1F5F9).
  - Header row: Light gray background (#F8FAFC) with uppercase label-sm typography.
- **Inputs:** 1px #E2E8F0 border, 8px radius. Focus state uses a 2px #3B82F6 outer glow with 0px spread.
- **Cards:** 24px internal padding. Title and action items should be placed in a 56px height header section with a bottom divider.
- **Priority Indicators:** Use a vertical 4px bar on the left edge of a ticket card or table row, color-coded to the semantic scale (Critical/High/Medium/Low) for instant scanning.