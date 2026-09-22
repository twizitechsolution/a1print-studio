# A1Print Canva Automatic Field Sync Guide

This guide explains how to design templates in Canva and have customer-editable photo slots and text zones automatically extracted into A1Print Studio using the **Inside Canva App** and **Canva Design Editing API**.

---

## 1. Setup in Canva Developer Portal (One-Time Setup)

1. Open the [Canva Developer Portal](https://www.canva.com/developers).
2. Click into the existing app **Aoneprint** (App ID: `AAHOGLV2Pd4`).
3. Under **Build**, select **Inside Canva** and click **"Go to setup"**.
4. Set the **Entry point URL** to:
   ```text
   https://a1print-studio.vercel.app/canva-app
   ```
5. Ensure scopes include:
   - `design:content:read`
   - `design:content:write`
   - `design:meta:read`
6. Save the settings. The app can remain in **Draft/Development status** — it is immediately available for internal team use under the **Apps** panel in your Canva editor!

---

## 2. Design Conventions in Canva

Canva design elements don't have custom metadata tags, so the A1Print Field Sync app detects fields using these standard conventions:

### A. Customer-Fillable Text Fields
- Any text element whose content is enclosed in double curly braces `{{...}}` will become an editable customer text zone.
- **Examples**:
  - `{{BABY_NAME}}`
  - `{{BIRTH_DATE}}`
  - `{{WEIGHT}}`
  - `{{MESSAGE}}`
  - `{{COUPLE_NAMES}}`
- **Rules**:
  - Keep token names unique within a design (e.g. don't use `{{NAME}}` twice; use `{{BRIDE_NAME}}` and `{{GROOM_NAME}}`).
  - Text without `{{...}}` (e.g. headers, decorative quotes, labels) remains permanent background artwork.
  - Font size, text color, and alignment are preserved.

### B. Customer-Uploadable Photo Slots
- Draw a plain rectangle where each photo should go.
- Set its **Fill Color** to pure magenta:
  - Hex: **`#ff00ff`** (or RGB: `255, 0, 255`)
- Size, position, and rotate the rectangle exactly where you want the customer's photo to appear.
- **Rules**:
  - The color must be exact `#ff00ff`.
  - In A1Print Studio, these become `photo-1`, `photo-2`, etc.
  - If you need custom cutout shapes (e.g. circle, oval, heart), you can switch the shape with one click in the A1Print Visual Template Editor afterward; the coordinates and size will be pre-aligned.

---

## 3. How to Sync from Inside Canva

1. While editing your template in Canva, open the left sidebar **Apps** panel.
2. Select your private app: **A1Print Field Sync**.
3. The panel will scan the current page and display:
   - All detected photo slots (`#ff00ff` rectangles).
   - All detected text zones (`{{TOKEN}}`).
4. Click **"Sync to A1Print"**:
   - The app will automatically set marker transparency to `1` (temporarily hiding them).
   - A clean, marker-free high-resolution artwork image is exported directly to Cloudinary.
   - The field coordinates are calculated and saved to the template in A1Print Studio.
   - The markers on your Canva canvas are automatically restored back to normal visibility.
5. Return to A1Print Studio — the template is now fully configured with clean artwork and interactive slots!
