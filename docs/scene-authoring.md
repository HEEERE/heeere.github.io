# Scene authoring guide — 箱庭 HAKONIWA

Every scene on this site is a small, physical diorama standing on a shared museum
plinth. The aesthetic is **toon / NPR miniature model**: clean shapes, cel-shaded
light, warm practical lights against cool night, lots of small real-world props.
Scenes are built procedurally with React Three Fiber — no Blender, no GLB files.

Read `src/scenes/konbini/` before writing a new scene. `KonbiniScene.tsx`,
`Storefront.tsx` and `Interior.tsx` are the reference implementation.

## Where a scene lives

```
src/scenes/<id>/<Name>Scene.tsx     ← the scene component (edit only this)
src/data/scenes.ts                  ← metadata + camera view (maintainer edits)
src/ui/SceneView.tsx                ← registry (maintainer edits)
```

A scene file exports one component with **no props**, wrapped in `<group>`. The
shared plinth (`DioramaBase`) must be the first physical thing; the stage frames
the diorama automatically from the camera view declared in `src/data/scenes.ts`.

```tsx
import {DioramaBase} from '../../three/kit/DioramaBase';
import {Box, Panel, RBox} from '../../three/kit/primitives';
import {RoomLights, LampLight} from '../../three/kit/lighting';
import {getScene} from '../../data/scenes';

export const DeskScene = () => {
  const meta = getScene('desk');
  return (
    <group>
      <RoomLights shadowMapSize={2048} />
      <DioramaBase meta={meta} footprint={[3.6, 3.6]} subtitle="1:18 / WORKSPACE" />
      {/* … everything is positioned in world units, y=0 is the plinth top … */}
    </group>
  );
};
```

## Units and framing

- Interior scenes use a **3.6 × 3.6** footprint, exterior scenes **4.6 × 4.6**.
- `y = 0` is the top of the plinth. Interiors are open-front cutaways: floor at
  `y = 0.05–0.1`, back wall at `z ≈ -1.5 … -1.7`, side walls near `x = ±1.5`.
  The camera looks from roughly `+z` with a small `+x` offset, so leave the
  `+z` side open and put the richest detail on the back wall and floor.
- Floor/wall tops must stay below `y ≈ 1.8`; the frame fits the whole bounding
  box. Tall thin props (poles, wires) can be excluded from framing with
  `bounds={false}` on `Box`/`Panel`, or are excluded by default for `Cable`.
- Avoid empty floor: rugs, cables, books, bins, paper, chairs make a room read
  as "someone uses this space".
- No people, no floating abstract shapes, no glowing wireframe spheres. Every
  abstract concept must be carried by a **physical object**: a screen, a file
  drawer, a labelled light box, a printed chart, a rack unit, a paper tray.

## Camera / scene metadata

The view is declared in `src/data/scenes.ts` (azimuth/elevation in degrees,
target, padding). Do not edit `src/data/scenes.ts` while several scenes are being
built — report the required change instead. Design so the scene looks good from
the declared view: back wall visible, floor readable, major props not hidden.

## Kit API

Import from `src/three/kit/primitives`:

| Component | Props | Notes |
| --- | --- | --- |
| `Box` | `size: [w,h,d]`, `color`, `p`, `r`, `s`, `ink`, `inkWidth`, `shadow`, `bounds` | `ink` draws an inverted-hull outline |
| `RBox` | same + `radius`, `segments` | furniture, appliances |
| `Cyl` | `radius`, `height`, `radiusTop`, `segments` + common | pole, cup, can |
| `Sphere` / `Cone` / `Torus` | `radius`(`tube`,`height`) + common | |
| `Panel` | `size: [w,h]`, `texture`, `lit`, `opacity`, `additive`, `doubleSide`, `p`, `r` | a flat plane; `lit` = receives light, default = unlit printed/emissive |
| `Glow` | `color`, `size`, `opacity`, `p` | additive soft sprite (lamp bloom) |
| `LightCone` | `color`, `height`, `radiusTop`, `radiusBottom`, `opacity`, `p` | fake volumetric light |
| `ContactShadow` | `p`, `radius`, `opacity` | soft blob shadow under furniture |
| `Pipe` | `from`, `to`, `radius`, `color` | cylinder between two points |
| `Cable` | `points: Vec3[]`, `radius`, `color` | sagging catenary-ish tube |
| `Wheel` | `p`, `r`, `radius`, `tube`, `color`, `spokes` | bicycle / cart wheels |
| `Plant` / `GrassTuft` / `Crate` | see file | cheap set dressing |

`Panel` textures are `CanvasTexture`s (see below). Position props are
`[x, y, z]` tuples: `p`, `r` (euler), `s` (number or tuple).

Materials (`src/three/materials`): `toon(color, {emissive, emissiveIntensity,
transparent, opacity, map})` for matte cel-shaded surfaces, `flat(color, {map,
opacity, transparent, side, blending})` for unlit light boxes/screens, `glass()`,
`metal()`.

Lighting (`src/three/kit/lighting`): `<RoomLights />` for a warm interior,
`<NightExteriorLights />` for a cold street, `<LampLight position color
intensity distance />` for practical lamps. Keep intensities modest — the
renderer uses ACES tone mapping; strong point lights blow out quickly. Good
starting points: interior point lamps `intensity 0.8–1.6, distance 1.6–2.4`;
outdoor lamp `2.4–3.5`. Add emissive light strips/panels (`flat('#fff3d8')`) on
top of materials to suggest fixtures.

Atmosphere (`src/three/kit/rain`): `Rain`, `Ripples`, `GlassDrops`,
`SlidingDrops`, `Drips`, `Steam` — all are cheap and already quality-scaled.

Quality (`src/three/quality`): `useQuality()` returns `{tier, reducedMotion,
lowPower, particleScale, shadows, outlines, simplified, shadowMapSize}`. Use
`quality.particleScale` for particle counts and `quality.simplified` to skip
expensive extras on cards.

## Canvas textures — the detail engine

Never use `<Text>` for CJK. Draw signage, screens, posters, labels and printed
matter as canvas textures and paint them onto `Panel`s. Helpers:

```ts
import {canvasTexture, text, rr, grain, rng, softGlow, withAlpha,
  FONT_SANS, FONT_SERIF, FONT_MONO} from '../../three/canvas';

const screen = canvasTexture('desk/screen', 512, 320, (ctx, w, h) => {
  ctx.fillStyle = '#0e151b'; ctx.fillRect(0, 0, w, h);
  text(ctx, 'agent_loop.py', 24, 30, {size: 14, font: FONT_MONO, color: '#8fb8c8'});
  // … fake UI, lines of code, graphs, labels
});
// <Panel size={[0.7, 0.4]} texture={screen} />
```

Reusable textures already exist (import from `src/three/textures`): see the
`export` list in `textures/surfaces.ts`, `textures/objects.ts`,
`textures/screens.ts`, `textures/signage.ts`. Highlights: `codeScreenTexture()`,
`graphScreenTexture()`, `lifecycleScreenTexture()`, `dashboardScreenTexture()`,
`mapScreenTexture()`, `terminalScreenTexture()`, `agentScreenTexture()`,
`detectionScreenTexture()`, `ledStripTexture(seed, color)`,
`archiveDrawersTexture()`, `flowBoardTexture()`, `commandMapTexture()`,
`statusBoardTexture()`, `whiteboardSkinTexture()`, `toolWallTexture()`,
`drawerLabelSheetTexture()`, `serverRackTexture(seed)`, `binderSpinesTexture()`,
`hazardStripeTexture()`, `agentPodTexture(seed)`, `zoneSignTexture()`,
`warningBoardTexture()`, `labelTagTexture(text, color, sub)`,
`paperSheetTexture(title, lines)`, `stickyNotesTexture()`, `wallNotesTexture()`,
`calendarTexture()`, `photoTexture('night'|'campus'|'sea')`,
`bookCoverTexture(title, author, color)`, `keyboardTexture()`,
`deskMatTexture()`, `laptopLidTexture()`, `rugTexture()`, `fellTexture()`,
`pegboardTexture()`, `corkBoardTexture()`, `woodFloorTexture()`,
`tileFloorTexture(key, tint)`, `deskWoodTexture()`, `officeWallTexture(key,
base, accent)`, `posterTexture(key, title, subtitle, tint)`,
`lightPoolTexture(color, strength)`, `lightSpillTexture(color, strength)`,
`glassSheenTexture()`.

If you need a new texture, write it with `canvasTexture` **inside your scene
file** — do not edit shared texture files.

## Quality bar / checklist

- The room reads as a real, used space from the declared camera view.
- Warm practical light vs cool ambient; at least one glowing element (screen,
  lamp, LED, light box) that defines the scene's colour.
- 3–6 "story" details a visitor can discover: sticky notes, a mug, cables, a
  paper tray, a labelled drawer, a clock, a small plant, a chair pulled out.
- Light animation only: blinking LEDs, screen scanlines, a slowly turning fan,
  a rotating beacon, drifting steam. Never move furniture aggressively.
- Mesh budget: **≤ 260 meshes** for a card scene (aim ~150–220). Use
  `ink` only on large silhouettes. Do not use real-time point-light shadows.
- TypeScript strict (`noUnusedLocals`, `noUnusedParameters`): clean imports.
- Do **not** touch shared files (`three/**`, `data/**`, `styles/**`,
  `ui/**`, `app/**`, `package.json`) — only your own scene file.

## Verify

```sh
npx tsc --noEmit
node scripts/closeup.mjs "http://127.0.0.1:5173/#/scene/desk" ".exhibit__stage" desk-check
```

The dev server is already running on `http://127.0.0.1:5173/`. Inspect
`tmp/shots/desk-check.png` (and the full page if useful) and iterate until the
scene is convincing. Finish by reporting mesh count, camera concerns and any
shareable texture you added locally.
