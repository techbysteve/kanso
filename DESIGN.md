---
name: Dev-Pulse
colors:
  surface: '#101419'
  surface-dim: '#101419'
  surface-bright: '#36393f'
  surface-container-lowest: '#0a0e13'
  surface-container-low: '#181c21'
  surface-container: '#1c2025'
  surface-container-high: '#262a30'
  surface-container-highest: '#31353b'
  on-surface: '#e0e2ea'
  on-surface-variant: '#d6c0d5'
  inverse-surface: '#e0e2ea'
  inverse-on-surface: '#2d3136'
  outline: '#9f8a9f'
  outline-variant: '#524153'
  surface-tint: '#f4aeff'
  primary: '#f4aeff'
  on-primary: '#55006a'
  primary-container: '#dc50ff'
  on-primary-container: '#4b005d'
  inverse-primary: '#9f00c2'
  secondary: '#41f2b7'
  on-secondary: '#003827'
  secondary-container: '#00d59c'
  on-secondary-container: '#00563d'
  tertiary: '#ffb59c'
  on-tertiary: '#5c1900'
  tertiary-container: '#ff570b'
  on-tertiary-container: '#511500'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#fdd6ff'
  primary-fixed-dim: '#f4aeff'
  on-primary-fixed: '#340042'
  on-primary-fixed-variant: '#790095'
  secondary-fixed: '#51fec1'
  secondary-fixed-dim: '#21e0a7'
  on-secondary-fixed: '#002115'
  on-secondary-fixed-variant: '#00513a'
  tertiary-fixed: '#ffdbcf'
  tertiary-fixed-dim: '#ffb59c'
  on-tertiary-fixed: '#390c00'
  on-tertiary-fixed-variant: '#822700'
  background: '#101419'
  on-background: '#e0e2ea'
  surface-variant: '#31353b'
  muted-text: '#a8b3cf'
typography:
  headline-xl:
    fontFamily: Geist
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
  max-content-width: 1200px
  max-width: 1200px
---

## Brand & Style
The design system is engineered for the modern developer ecosystem: focused, high-performance, and information-dense. It adopts a **Modern Developer** aesthetic, characterized by a deep dark environment that reduces eye strain during long-form reading of technical content. 
The personality is technical yet vibrant, balancing a rigorous, structured layout with high-energy accent pops. The UI prioritizes content hierarchy and readability, utilizing a sophisticated interplay of tonal layering and crisp, high-contrast typography to evoke a sense of professional mastery and cutting-edge innovation.
## Colors
The palette is rooted in a deep, near-black neutral (`#0E1217`) to establish a true dark-mode foundation. The primary brand color is a high-octane purple/pink, used strategically for critical interactions and brand presence. 
Secondary and tertiary accents—a vibrant teal and a searing orange—provide functional color-coding and visual interest without cluttering the interface. Text scales from pure white for headings to a muted cool-gray (`#A8B3CF`) for secondary information, ensuring a clear visual weight across technical documentation and feed items.
## Typography
This design system utilizes **Geist** for its core typeface—a font designed specifically for developers and designers that offers exceptional clarity in both large headlines and dense technical body text. 
For meta-data, tags, and code-adjacent labels, **JetBrains Mono** is employed to reinforce the developer-centric aesthetic and provide a clear stylistic distinction between content and utility. Headlines use tight tracking and heavy weights to command attention, while body text maintains generous line heights to facilitate long-form reading on digital displays.
## Layout & Spacing
The layout follows a **Fluid Grid** model with a maximum content width to preserve readability on ultra-wide monitors. A precise 4px baseline grid ensures consistent vertical rhythm. 
- **Desktop:** 12-column grid with 24px gutters. Content is primarily organized in card-based modules that stack and reflow based on screen real estate.
- **Mobile:** Single column with 16px side margins. 
- **Containers:** Components utilize internal padding based on the base-4 scale, typically 16px or 20px, to maintain a spacious, breathable feel despite high information density.
## Elevation & Depth
Depth is created through **Tonal Layers** rather than heavy shadows. The background is the darkest surface (`#0E1217`), and interactive or floating containers use a lighter surface tier (`#1C2128`). 
Subtle, low-contrast outlines (`#2D333B`) are used to define card boundaries. When elevation is required for modals or popovers, a subtle "ambient glow" shadow is used, tinted with the primary purple or neutral black at very low opacity (10-15%) to maintain the clean, technical feel without introducing "muddy" traditional shadows.
## Shapes
The shape language is **Rounded (0.5rem)**. This provides a friendly, contemporary interface that contrasts effectively with the rigorous grid and technical typography, making the tool feel like a modern workspace rather than a legacy terminal.
- **Small Components:** Checkboxes and small tags use the base 8px (0.5rem) radius.
- **Cards & Inputs:** Use the `rounded-lg` (16px / 1rem) setting to create a distinct, friendly container identity.
- **Action Buttons:** Use a standard 16px radius to feel substantial and approachable, while maintaining enough structure to remain professional.
## Components
- **Buttons:** Primary buttons are high-contrast purple with white text. Secondary buttons use a ghost style with a subtle border. All buttons feature generous 16px corner radii and exhibit a slight scale-down animation on press.
- **Cards:** The hallmark of the layout. Cards feature a 1px border (`#2D333B`), a 1rem corner radius, and a slightly elevated background color. Hover states should subtly brighten the border or introduce a minimal primary-color accent on the left edge.
- **Inputs:** Dark-filled fields with `text-muted` placeholders and a 1rem corner radius. On focus, the border transitions to the primary color with a 2px outer glow.
- **Chips/Tags:** Monospaced (JetBrains Mono) text inside low-opacity versions of the accent colors (e.g., a 10% opacity teal background for a teal-text tag), utilizing a 0.5rem radius.
- **Code Blocks:** Deep black background with 1rem corner radius and syntax highlighting that mirrors the brand's accent palette (teal, orange, purple).