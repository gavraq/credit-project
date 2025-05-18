

## Color Palette

### Primary Colors

- ICBC Red - `#e31937` (Used for critical actions, alerts, and key CTAs)
- Standard Bank Blue - `#0c4da2` (Used for primary actions, navigation, and key interactive elements)
### Secondary Colors

- Red Light - `#fde8eb` (Used for red-themed backgrounds and hover states)
- Blue Light - `#e6edf7` (Used for blue-themed backgrounds, selected states, and highlights)
### Accent Colors

- Success - `#38B2AC` (For completed states, approvals, and positive confirmations)
- Warning - `#F6AD55` (For warnings, caution states, and pending actions)
- Error - `#E53E3E` (For errors, rejections, and destructive actions)
### Functional Colors

- Interactive Blue - `#1e40af` (For interactive elements and UI components)
- Link Blue - `#3182ce` (For hyperlinks and secondary interactive elements)
- Info Blue - `#4299e1` (For informational messages and tooltips)
### Neutral Colors

- Neutral 100 - `#FFFFFF` (White for card backgrounds and content areas)
- Neutral 200 - `#F5F7FA` (Light gray for app backgrounds and alternating rows)
- Neutral 300 - `#E4E7EB` (Border gray for separators and dividers)
- Neutral 400 - `#CBD2D9` (Medium gray for disabled states and secondary borders)
- Neutral 500 - `#9AA5B1` (Gray for secondary text and icons)
- Neutral 600 - `#7B8794` (Dark gray for tertiary text)
- Neutral 700 - `#4A5568` (Darker gray for form labels and secondary headings)
- Neutral 800 - `#323F4B` (Very dark gray for primary text)
- Neutral 900 - `#1F2933` (Near black for headlines and emphasis)

## Typography

### Font Family

- Primary Font: 'Inter', sans-serif
- Fallback Fonts: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif
### Font Weights

- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700
### Text Styles

#### Headings

- H1: 1.875rem (30px), Bold (700), line-height: 2.25rem
    - Used for page titles and major headers
- H2: 1.5rem (24px), Bold (700), line-height: 2rem
    - Used for section headers and card titles
- H3: 1.125rem (18px), Semibold (600), line-height: 1.75rem
    - Used for form section headers and subsections
#### Body Text

- Body Large: 1rem (16px), Regular (400), line-height: 1.5rem
    - Primary reading text for longer content areas
- Body: 0.875rem (14px), Regular (400), line-height: 1.25rem
    - Standard text for most UI elements and form content
- Body Small: 0.75rem (12px), Regular (400), line-height: 1rem
    - Secondary information, metadata, and supporting text
#### Special Text

- Label: 0.875rem (14px), Medium (500), line-height: 1.25rem
    - Used for form labels and data categories
- Caption: 0.75rem (12px), Medium (500), line-height: 1rem
    - Used for timestamps, badges, and metadata
- Badge Text: 0.75rem (12px), Medium (500), line-height: 1rem
    - Used for status indicators and tags
## Component Styling

### Buttons

- Primary Button
    - Background: Standard Bank Blue (`#0c4da2`)
    - Text: White (`#FFFFFF`)
    - Height: 38px
    - Corner Radius: 0.375rem (6px)
    - Padding: 0.5rem 1rem (8px 16px)
    - Font: 0.875rem (14px), Medium (500)
    - Hover: Slightly darker blue (`#0b4491`)
- Secondary Button
    - Border: 1px Neutral 300 (`#E4E7EB`)
    - Text: Neutral 800 (`#323F4B`)
    - Background: White (`#FFFFFF`)
    - Height: 38px
    - Corner Radius: 0.375rem (6px)
    - Padding: 0.5rem 1rem (8px 16px)
    - Font: 0.875rem (14px), Medium (500)
    - Hover: Neutral 200 (`#F5F7FA`)
- Destructive Button
    - Background: ICBC Red (`#e31937`)
    - Text: White (`#FFFFFF`)
    - Height: 38px
    - Corner Radius: 0.375rem (6px)
    - Padding: 0.5rem 1rem (8px 16px)
    - Font: 0.875rem (14px), Medium (500)
    - Hover: Slightly darker red (`#cc1731`)
- Success Button
    - Background: Success (`#38B2AC`)
    - Text: White (`#FFFFFF`)
    - Height: 38px
    - Corner Radius: 0.375rem (6px)
    - Padding: 0.5rem 1rem (8px 16px)
    - Font: 0.875rem (14px), Medium (500)
    - Hover: Slightly darker teal (`#319795`)
### Cards

- Background: White (`#FFFFFF`)
- Shadow: Y-offset 1px, Blur 3px, Color rgba(0, 0, 0, 0.1)
- Corner Radius: 0.5rem (8px)
- Padding: 1.5rem (24px)
- Border: 1px solid Neutral 300 (`#E4E7EB`) (optional for additional definition)
### Form Sections

- Background: White (`#FFFFFF`)
- Border: 1px solid Neutral 300 (`#E4E7EB`)
- Corner Radius: 0.375rem (6px)
- Padding: 1.5rem (24px)
- Margin Bottom: 1.5rem (24px)
### Input Fields

- Height: 38px
- Corner Radius: 0.375rem (6px)
- Border: 1px solid Neutral 400 (`#CBD2D9`)
- Active Border: 1px solid Standard Bank Blue (`#0c4da2`)
- Background: White (`#FFFFFF`)
- Text: Neutral 800 (`#323F4B`)
- Placeholder Text: Neutral 500 (`#9AA5B1`)
- Focus Shadow: 0 0 0 2px rgba(12, 77, 162, 0.2)
- Padding: 0.5rem (8px)
- Font Size: 0.875rem (14px)
- Label: 0.875rem (14px), Medium (500), Neutral 700 (`#4A5568`)
### Select Inputs

- Same as Input Fields
- Dropdown Icon: Neutral 500 (`#9AA5B1`)
- Selected Background: Blue Light (`#e6edf7`)
- Option Hover: Neutral 200 (`#F5F7FA`)
### Checkboxes and Radio Buttons

- Size: 1rem (16px)
- Border Radius (Checkbox): 0.25rem (4px)
- Border Radius (Radio): 50%
- Border: 1px solid Neutral 400 (`#CBD2D9`)
- Active Border: 1px solid Standard Bank Blue (`#0c4da2`)
- Background (Selected): Standard Bank Blue (`#0c4da2`)
- Checkmark/Dot: White (`#FFFFFF`)
### Badges and Status Indicators

- Success Badge
    - Background: `#d1fae5`
    - Text: `#065f46`
    - Border Radius: 9999px (Full rounded)
    - Padding: 0.125rem 0.625rem (2px 10px)
- Warning Badge
    - Background: `#fef3c7`
    - Text: `#92400e`
    - Border Radius: 9999px (Full rounded)
    - Padding: 0.125rem 0.625rem (2px 10px)
- Error Badge
    - Background: `#fee2e2`
    - Text: `#b91c1c`
    - Border Radius: 9999px (Full rounded)
    - Padding: 0.125rem 0.625rem (2px 10px)
- Info Badge
    - Background: `#dbeafe`
    - Text: `#1e40af`
    - Border Radius: 9999px (Full rounded)
    - Padding: 0.125rem 0.625rem (2px 10px)
- Neutral Badge
    - Background: `#f3f4f6`
    - Text: `#1f2937`
    - Border Radius: 9999px (Full rounded)
    - Padding: 0.125rem 0.625rem (2px 10px)
### Icons

- Primary Icons: 24px x 24px
- Small Icons: 16px x 16px
- Navigation Icons: 20px x 20px
- Primary color for interactive icons: Standard Bank Blue (`#0c4da2`)
- Secondary color for inactive/decorative icons: Neutral 500 (`#9AA5B1`)
- System icons: Info (ℹ️), Warning (⚠️), Success (✓), Error (✕)
## Spacing System

- 0.25rem (4px) - Micro spacing (between related elements)
- 0.5rem (8px) - Small spacing (internal padding)
- 0.75rem (12px) - Medium-small spacing
- 1rem (16px) - Default spacing (standard margins)
- 1.5rem (24px) - Medium spacing (between sections)
- 2rem (32px) - Large spacing (major sections separation)
- 3rem (48px) - Extra large spacing (screen padding top/bottom)
## Motion & Animation

- Standard Transition: 200ms, Ease-out curve
- Emphasis Transition: 300ms, Ease curve
- Hover Transitions: 150ms, Ease-in-out
- Page Transitions: 350ms, Ease-in-out
## Workflow Status Component

- Step size: 2rem (32px)
- Connector height: 0.25rem (4px)
- Completed step background: Success (`#38B2AC`)
- Current step background: Standard Bank Blue (`#0c4da2`)
- Future step background: Neutral 300 (`#E4E7EB`)
- Completed step text: Success (`#38B2AC`)
- Current step text: Neutral 800 (`#323F4B`)
- Future step text: Neutral 500 (`#9AA5B1`)
## Form Components

### Form Wizard Navigation

- Border bottom: 2px
- Active step: Standard Bank Blue (`#0c4da2`)
- Completed step: Success (`#38B2AC`)
- Future step: Neutral 300 (`#E4E7EB`)
- Font: 0.875rem (14px), Medium (500)
- Padding: 1rem (16px)
### Form Section

- Title: 1.125rem (18px), Semibold (600)
- Description: 0.875rem (14px), Regular (400), Neutral 500 (`#9AA5B1`)
- Background panels: Neutral 200 (`#F5F7FA`)
- Inner cards: White (`#FFFFFF`), Border: 1px solid Neutral 300 (`#E4E7EB`)
### Notifications and Alerts

- Info alert: Blue Light (`#e6edf7`), Border-left: 4px solid Standard Bank Blue (`#0c4da2`)
- Warning alert: `#fef3c7`, Border-left: 4px solid Warning (`#F6AD55`)
- Error alert: Red Light (`#fde8eb`), Border-left: 4px solid ICBC Red (`#e31937`)
- Success alert: `#d1fae5`, Border-left: 4px solid Success (`#38B2AC`)
- Padding: 1rem (16px)
- Corner Radius: 0.5rem (8px)
### Tables

- Header Background: Neutral 200 (`#F5F7FA`)
- Header Text: Neutral 700 (`#4A5568`), 0.75rem (12px), Medium (500), uppercase
- Row Borders: 1px solid Neutral 300 (`#E4E7EB`)
- Alternating Row Background: White (`#FFFFFF`), Neutral 200 (`#F5F7FA`)
- Cell Padding: 0.75rem 1rem (12px 16px)
- Hover State: Slightly darker than base color

## Responsive Design

### Breakpoints

- Small: 640px
- Medium: 768px
- Large: 1024px
- Extra Large: 1280px
### Grids

- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 12-column grid
### Spacing Adjustments

- Mobile padding: 1rem (16px)
- Tablet padding: 1.5rem (24px)
- Desktop padding: 1.5rem (24px)
## Version Control Components

- Version badge: Neutral 200 (`#F5F7FA`), Text: Neutral 800 (`#323F4B`), Border-radius: 9999px
- Version save button: Small secondary button with icon
- History view button: Small secondary button with icon
- Timestamp font: 0.75rem (12px), Neutral 500 (`#9AA5B1`)

This design brief captures the visual language established across the provided Credit Risk Workflow components, creating a cohesive system that balances the brand identities of both ICBC and Standard Bank while maintaining a clean, professional aesthetic appropriate for financial applications.