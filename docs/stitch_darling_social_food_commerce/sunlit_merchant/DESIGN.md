# Design System Strategy: The Kinetic Hearth

## 1. Overview & Creative North Star
This design system is built to bridge the gap between the grit of street food vending and the high-end polish of modern social commerce. Our Creative North Star is **"The Kinetic Hearth."** 

We embrace a layout that feels fluid (kinetic) and welcoming (the hearth). We achieve this through **Balanced Asymmetry**: allowing images to interact with container bounds, using clear typography scales for a modern presence, and replacing industrial dividers with tonal shifts. This system provides a structured yet approachable experience for the UMKM community.

---

## 2. Colors: Tonal Vibrancy
The palette uses Material Design 3 (M3) logic but applies it with a clean, professional lens. We avoid the "default" look by prioritizing tonal depth over flat fills.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section content. Visual boundaries must be achieved through:
- **Background Color Shifts:** Placing a `surface-container-lowest` card on a `surface-container-low` background.
- **Balanced Whitespace:** Using the standard spacing scale to create clear mental groupings.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. We use a "Nested Depth" approach:
1.  **Base Layer:** `surface` (#fff5ed) – The canvas.
2.  **Sectional Layer:** `surface-container-low` (#ffeedf) – To group large content areas.
3.  **Actionable Layer:** `surface-container-lowest` (#ffffff) – For cards and interactive elements to "pop" forward naturally.

### The "Glass & Gradient" Rule
To add soul to the UI:
- **Glassmorphism:** Use semi-transparent `surface` colors with a 20px backdrop-blur for floating headers or bottom navigation bars.
- **Signature Textures:** Use subtle linear gradients for primary CTAs, transitioning from `primary` (#FF8C00) to a slightly lighter variant. This avoids the "flat" look of basic Material apps.

---

## 3. Typography: Editorial Authority
We use a dual-font system to balance character with utility.

- **Display & Headlines (Plus Jakarta Sans):** These are our "Voice." They should be used with tight letter-spacing (-1%) and clear scales to create a professional, modern presence.
- **Body & Labels (Be Vietnam Pro):** Our "Utility." This geometric sans-serif provides maximum readability for menus, prices, and descriptions.

**Hierarchy Note:** Maintain clear contrast. A `display-sm` headline should be paired with a `body-md` description to create a dynamic, modern rhythm.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are replaced by **Tonal Layering**. We communicate "upward" movement through color luminosity rather than artificial light sources.

- **The Layering Principle:** To lift an element, move it one step "up" the container scale. A card sitting on `surface_container` should be `surface_container_low` or `lowest`.
- **Ambient Shadows:** If a floating action button (FAB) or high-priority modal requires a shadow, use an **Ambient Tint**. The shadow must be 8% opacity of the `on_surface` color, with a soft blur radius.
- **The "Ghost Border":** For essential accessibility (like input fields), use a "Ghost Border" of `outline_variant` at 15% opacity.
- **Backdrop Blur:** Floating elements (Bottom Nav, Tooltips) should utilize a 70% opacity `surface` fill with a `blur(12px)` to maintain the "Glass" aesthetic.

---

## 5. Components

### Buttons
- **Primary:** Use the signature gradient. Roundedness: `moderate` (Level 2). Padding: 12px vertical, 24px horizontal.
- **Secondary:** `secondary_container` (#90EE90) background. No border.
- **Tertiary:** Transparent background, `primary` text, with a slight `surface_variant` hover state.

### Cards & Lists
- **The Radius Rule:** Use `medium` (Level 2) roundedness for standard vendor cards to maintain a clean, modern look.
- **No Dividers:** Lists are separated by consistent vertical whitespace according to the standard spacing scale. 
- **Content Stacking:** Use `surface_container_highest` for small badges or "chips" inside a card to create a tertiary layer of depth.

### Input Fields
- **Style:** Moderately rounded corners using `surface_container_low` as the fill. 
- **Active State:** Shift background to `surface_container_lowest` and add a 1px "Ghost Border" of `primary`.

### Navigation (Bottom Bar)
- **Visuals:** Use the Glassmorphism rule. A semi-transparent `surface` background with a backdrop blur. 
- **Active Indicator:** A `primary_container` indicator behind the icon, using the moderate radius scale.

### Social Context Components
- **"Street Story" Bubbles:** Circular avatars with a `primary` ring (2px) to denote active stories or food updates.
- **Mobility Map Pins:** Custom `secondary` markers with a soft `surface_dim` outer glow to indicate vendor locations.

---

## 6. Do’s and Don’ts

### Do:
- **Do** use overlapping elements (e.g., a food image partially floating outside its card container) to create "Kinetic" energy.
- **Do** use accessible color pairings for text on top of high-vibrancy backgrounds.
- **Do** embrace "Clean Space"—ensure margins are consistent and elements have room to breathe.

### Don’t:
- **Don't** use pure black (#000000) for text. Always use `on_surface` to keep the warmth of the palette.
- **Don't** use sharp 0px corners or maximum pill-shaped corners. This system relies on moderate (Level 2) roundedness.
- **Don't** use dividers or horizontal rules. If you need a line, use a background color change or whitespace instead.