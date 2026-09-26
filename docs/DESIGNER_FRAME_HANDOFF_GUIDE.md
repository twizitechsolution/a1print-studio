# A1Print Studio: Designer Frame Handoff & Alpha Layer Guide

This reference guide is for designers creating photo frame artwork in **Adobe Photoshop**, **Illustrator**, or **Canva** for the A1Print Studio platform.

---

## The Core Rule: Plain Photos & Transparent Cutouts

In A1Print Studio:
1. **Customer photos are ALWAYS plain rectangles at render time.**
2. **All visual shapes, soft feathered edges, inner shadows, and decorative overlaps are baked directly into your artwork PNG with real alpha transparency.**
3. The platform does not use artificial geometric clipping math (circle/star/polygon math). The artwork PNG is placed above the customer photo, letting the photo show through the transparent cutouts.

---

## 1. Export Format: PNG Only (Never JPG)

- **Always export as PNG-24 (with transparency checked)**.
- **Never export as JPG** for any layer that has a photo cutout, because JPG cannot carry an alpha transparency channel and will turn transparent holes into solid white or black boxes.

---

## 2. Real Alpha Transparency (Layer Masks)

- Photo holes must be **true transparent pixels** (`opacity: 0%` / checkerboard in Photoshop).
- In Photoshop:
  - Add a **Layer Mask** to your frame artwork.
  - Paint or make a selection of the cutout area (e.g. circle, oval, heart, or organic blob) and fill with black on the mask to reveal the transparent checkerboard.
  - Do **not** simply fill the photo area with solid white or cream. An opaque white area will block customer photos.

---

## 3. Soft Edges, Inner Shadows & Vignettes

- If you want a soft, feathered photo edge:
  - Apply a **Gaussian Blur (2px - 6px)** directly on the Layer Mask in Photoshop, or use a soft round brush on the mask edge.
- If you want an inner shadow on the photo cutout:
  - Add an **Inner Shadow** layer style to the frame overlay layer. The shadow will naturally cast downward onto the customer photo underneath.
- All softness and shadows are baked into the PNG pixels when exported.

---

## 4. Multi-Layer Stacking (Background vs. Foreground)

If a frame design needs a photo to appear **behind** some decorative elements (e.g. floral garland, golden border) and **in front of** a background (e.g. textured paper or wood grain):

1. **Split your artwork into 2 layers**:
   - **Layer 1 (Background)**: e.g. Paper texture, background patterns. Export as `background.png`.
   - **Layer 2 (Foreground / Overlay)**: e.g. Floral border with transparent cutout for the photo. Export as `foreground_overlay.png`.
2. **Matching Dimensions**:
   - Both PNGs **must be exported at the exact same canvas dimensions** (e.g., `2400 x 3000 px` at 300 DPI) so they align seamlessly when stacked.
3. **In A1Print Studio Admin**:
   - Set Layer 1 (Background) `Z-Index = 0`.
   - Place Customer Photo Slot at `Z-Index = 1` over the cutout area.
   - Set Layer 2 (Foreground Overlay) `Z-Index = 10`.
   - Place Text Zones (e.g., Baby Name, Birth Date) at `Z-Index = 20`.

---

## 5. Checklist Before Delivery

- [ ] Canvas dimensions match standard frame aspect ratio (e.g. 4:5 or 3:4).
- [ ] Photo apertures are 100% transparent (transparent checkerboard visible).
- [ ] Feathering / inner shadows applied directly to layer mask or layer style.
- [ ] Exported as 24-bit PNG with transparency enabled.
- [ ] For layered frames: all layer files exported at identical pixel width and height.
