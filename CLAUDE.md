# Grand Motor

A scroll-driven cinematic 3D web experience exploring the Mercedes-AMG ONE, built with Astro, React, React Three Fiber (R3F), and GSAP.

## Tech Stack
- **Framework:** Astro 7.3 (Static Site Generation / Framework)
- **UI & 3D Shell:** React 19, Tailwind CSS v4
- **3D Rendering:** Three.js, React Three Fiber (R3F), React Three Drei, Postprocessing
- **Animation & Timeline:** Custom scroll-based timeline system parsing chapter definitions, using Lenis for smooth scroll and GSAP for easing.
- **Debugging & Tuning:** Tweakpane for live adjusting chapters, lighting, and cameras.
- **Deployment:** Cloudflare Pages (via Wrangler).

## Project Architecture
- `src/pages/index.astro`: Entry point loading the main `ExperienceRoot` React component.
- `src/components/ExperienceRoot.tsx`: Wraps the 3D Canvas, UI HUD, and Lenis scroll provider.
- `src/components/3d/`:
  - `HeroVehicle.tsx`: The rigged AMG ONE vehicle. Maps nodes from the `.glb` to our animatable rig anchors.
  - `Environment.tsx`: Advanced lighting rig (key, fill, ambient, spotlights) and moody studio environment.
  - `CameraManager.tsx`: Smoothly interpolates the camera position and look-at target based on the current chapter timeline.
  - `Director.tsx`: Hub that orchestrates timeline frames to the 3D scene (binds scroll progress to channels).
- `src/experience/`: The core logic for the cinematic presentation.
  - `core/timeline.ts`: Compiles chapter definitions into a normalized curve.
  - `chapters/`: Sequenced chapters (`00-open`, `01-arrival`, ... `08-ignition`). Each chapter has a `ChapterId`, a specific number of scroll `beats`, camera keyframes, and channel tracks (e.g. `rig.pz`, `light.ambient`).

## Setup & Commands
- **Install dependencies:** `npm install`
- **Development Server:** `npm run dev`
- **Typing + Check:** `npm run check`
- **Production Build:** `npm run build`
- **Preview Build:** `npm run preview`
- **Deploy to Cloudflare:** `npm run deploy`

## Current Progress & Asset Details
- **Asset Integration:** The AMG ONE `.glb` file has been added and inspected. (See `Asset-Inspection.md` for full breakdown).
- **Physical limitations:** The model includes detailed wheels, tires, body panels, and glass. It *lacks* independent deep internal components as separate meshes (brake discs/calipers, independent suspension, deep engine block). These anchors have been omitted or fallback groups have been used for the respective chapters (engine, brakes, suspension).
- **Rigging:** The vehicle rig has been hooked up in `HeroVehicle.tsx`.
- **Environment:** Transitioned from a placeholder light setup to a sophisticated, cinematic lighting framework with tunable Tweakpane controls.
- **HUD:** Integrated an overlay HUD to convey the chapter progress and technical readouts.

## Code Style & Conventions
- Use functional React components with hooks.
- Prefix 3D/GLTF component refs with `ref` internally, keeping the external prop interfaces clean.
- Strict Type checking via TypeScript is enforced (types defined in `src/experience/core/types.ts`). Use explicit `type` or `interface` for props.
- Separate purely presentational layout logic (Tailwind) from complex state logic.
- Avoid introducing generic physics unless specifically tied to the timeline (GSAP driven). 

## AI Generation Attribution
All git commits made by Claude should end with `Co-Authored-By: Claude Code <noreply@anthropic.com>`. Pull Requests generated should end with `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.