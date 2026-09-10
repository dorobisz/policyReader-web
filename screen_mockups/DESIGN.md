---
name: PolicyReader Design System
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
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#191c1e'
  on-tertiary-container: '#818486'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#e0e3e5'
  tertiary-fixed-dim: '#c4c7c9'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#444749'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-bold:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  headline-md-mobile:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 20px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style
The design system is engineered for insurance brokers who require precision, speed, and reliability. The brand personality is **authoritative yet accessible**, transforming complex insurance documents into actionable data. 

The visual style follows a **Corporate Modern** aesthetic. It prioritizes information density without sacrificing clarity, utilizing ample whitespace to separate data clusters. The emotional response is one of "organized efficiency"—the UI acts as a calm, steady hand in a high-stakes environment. High-quality typography and a restrained color palette communicate professional rigor and data integrity.

## Colors
The palette is anchored by **Deep Slate (#0F172A)** to convey stability and institutional trust. 

- **Primary:** Deep Slate is used for navigation, primary headings, and high-impact actions.
- **Secondary:** An active Blue (#2563EB) denotes interactivity, links, and focus states.
- **Surface & Background:** The interface relies on a tiered gray scale. Pure white is reserved for cards and content areas, while the tertiary light gray provides a soft background for the application shell.
- **Semantic:** Success Green is used exclusively for completed analysis; Alert Orange highlights errors or missing policy riders; Error Red indicates system failures or critical document rejections.

## Typography
This design system utilizes **Inter** for its exceptional legibility in data-heavy environments and its neutral, systematic character.

Typography is used to create a clear hierarchy in policy analysis. **Headlines** use tighter letter spacing and heavier weights to anchor sections. **Body text** utilizes a standard 14px size for the majority of data points to balance density and readability. **Labels** utilize uppercase styling for column headers in data tables to differentiate metadata from actual policy content.

## Layout & Spacing
The layout follows a **12-column fluid grid** for desktop and a **4-column grid** for mobile. 

The spacing rhythm is based on a **4px baseline grid**. To maintain a professional, data-rich environment, internal card padding is set to `md` (16px), while major section gaps use `xl` (32px). This "compact-out, breathable-in" approach ensures that while the individual data points are dense, the overall page does not feel overwhelming. Use fixed sidebars for primary navigation to maximize vertical space for document viewing.

## Elevation & Depth
Hierarchy is established through **Tonal Layering** and **Low-Contrast Outlines** rather than heavy shadows.

- **Level 0 (Background):** Tertiary gray (#F8FAFC).
- **Level 1 (Cards/Sheets):** Pure white with a 1px border (#E2E8F0).
- **Level 2 (Dropdowns/Modals):** Pure white with a soft, diffused shadow (0px 4px 12px rgba(0,0,0,0.05)) to suggest interaction.

This flat, layered approach ensures that the interface feels modern and digital-first, avoiding the "clunkiness" of traditional enterprise software.

## Shapes
The shape language is **Soft (0.25rem)**. 

Standard components like input fields, buttons, and status badges use a 4px corner radius. This provides a professional, "exact" feel while slightly softening the clinical nature of insurance data. Large containers or "File Upload Zones" may use `rounded-lg` (8px) to create a distinct visual area for drag-and-drop interactions.

## Components

### Buttons & Actions
Primary buttons use the Deep Slate background with white text. Secondary buttons use a subtle gray outline. Action density is key; use small-scale buttons (32px height) within tables and standard-scale (40px) for primary page actions.

### Status Badges
Badges are critical for the workflow. They use a "soft-fill" style (10% opacity background of the semantic color with 100% opacity text).
- **Processing:** Secondary Blue background, pulsing icon.
- **Completed:** Success Green.
- **Failed:** Error Red.

### File Upload Zones
Large dashed-border containers using the Tertiary gray. Upon hover, the border changes to Secondary Blue. Provide a clear "Browse Files" link and a list of accepted file types (PDF, DOCX) in `body-sm`.

### Data Tables
Tables are the heart of the system. They feature a sticky header, alternating row highlights (subtle), and 12px padding. Column headers use `label-bold` to ensure clear categorization of policy terms, premiums, and coverage limits.

### Progress Bars
Thin (4px) bars located at the top of cards or global headers. Use Secondary Blue for active progress and Success Green for 100% completion before the bar fades out.