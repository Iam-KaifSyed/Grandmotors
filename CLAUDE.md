# Grand Motor

A luxury automotive service platform combining a cinematic 3D Mercedes-AMG ONE web experience with a full-stack booking system, customer tracking portal, and comprehensive Admin & CMS panel. Built with Astro, React, React Three Fiber (R3F), Tailwind CSS v4, and Cloudflare D1 / KV.

## Tech Stack
- **Framework:** Astro 7.3 (Hybrid/SSR & Static Site Generation)
- **UI & 3D Shell:** React 19, Tailwind CSS v4, Framer Motion, Lucide React
- **3D Rendering:** Three.js, React Three Fiber (R3F), React Three Drei, Postprocessing
- **Animation & Scrolling:** Custom scroll-based timeline system, Lenis for smooth scrolling, GSAP for easing
- **Database & Backend:** Cloudflare D1 (SQLite), Cloudflare KV (Session & Auth), Cloudflare Workers API
- **Testing & Tooling:** Vitest (226+ unit & integration tests), Astro Check, TypeScript, Tweakpane
- **Deployment:** Cloudflare Pages & Workers (via Wrangler)

## Project Architecture

### 1. Public Pages (`src/pages/`)
- `index.astro`: Redesigned homepage featuring the 3D cinematic AMG ONE experience, service highlights, doorstep service showcase, customer reviews, and quick CTAs.
- `book-service.astro`: Multi-step booking flow with car brand/model lookup, fuel type, transmission, service package, doorstep/bay toggle, and lead tracking.
- `track-booking.astro`: Instant booking tracker by Booking ID (`GM-YYYYMMDD-XXXX`) featuring glassmorphism modal, status timeline, and WhatsApp direct link.
- `my-bookings.astro`: Customer portal to look up all active and past bookings using a phone number.
- `services.astro`, `about.astro`, `contact.astro`: Informational showcase, workshop facility details, Google Map embed, and contact details.
- `404.astro`, `500.astro`: Custom branded error pages with quick navigation back to safety.

### 2. Admin & CMS (`src/pages/admin/` & `src/components/admin/`)
- `admin/index.astro` / `AdminDashboard.tsx`: Comprehensive booking operations dashboard.
  - **Desktop View:** Expanded full-width table with dedicated column sizing, status controls, lead source attribution tags, repeat customer warning badges, and detail drawer.
  - **Mobile View:** Dedicated `<article>` card layout with visible borders, rounded corners, prominent Booking ID, organized sections, and equal-width action buttons in a dedicated footer.
  - **Booking Lifecycle:** Active vs. Archived bookings tabs with soft archive, restore, and permanent deletion capabilities.
  - **Customer Matching:** Detects repeat customers via phone/email and cross-links previous bookings.
- `admin/services.astro` / `ServiceManager.tsx`: CMS for managing service packages, pricing, icons, categories, and active states.
- `admin/booking-form.astro` / `BookingFormEditor.tsx`: CMS customizer for configuring available booking form fields, requirements, and options.
- `admin/media.astro` / `MediaLibrary.tsx`: Media asset management with upload, usage tracking across pages, and safe unlinking protection.
- `admin/login.astro`: Secure admin authentication flow using Cloudflare KV sessions.

### 3. API Routes (`src/pages/api/`)
- `/api/bookings/`: Public booking creation and retrieval by ID / phone number.
- `/api/admin/bookings/`: Admin booking management, status updates, notes, archive, restore, and delete.
- `/api/admin/cms/`: CMS endpoints for services, categories, booking form configuration, and media assets.
- `/api/admin/login.ts` & `logout.ts`: Session creation, cookie validation, and invalidation.

### 4. 3D Experience Architecture (`src/components/3d/` & `src/experience/`)
- `HeroVehicle.tsx`: Rigged Mercedes-AMG ONE (`transparency_mercedes_amg_one.glb`) supporting body transparency, wheels, tires, panels, and glass.
- `Environment.tsx`: Procedural ground plane simulating a charcoal sealed workshop with faint service-bay lines, contact shadows, anisotropic roughness, and dynamic lighting rig (key, fill, ambient, spotlights).
- `CameraManager.tsx`: Smooth camera interpolation based on scroll timeline keyframes.
- `Director.tsx`: Hub binding scroll progress to animation tracks.
- `CinematicProgressBar.tsx`: Interactive HUD scrubber allowing users to scrub across the entire 3D timeline.
- `experience/chapters/`: Sequenced chapters (`00-open` through `08-ignition`) defining camera positions, scroll beats, and lighting/rig channels.

### 5. Shared Libraries & State (`src/lib/`)
- `bookingStore.ts`: Booking storage engine with local fallback and Cloudflare D1 integration.
- `serviceStore.ts`: Service catalog and category persistence.
- `mediaStore.ts`: Media library asset indexing and usage tracker.
- `bookingFormConfigStore.ts`: Form schema and field configuration store.
- `customerMatching.ts`: Algorithmic repeat customer detection and clustering.
- `leadSource.ts`: Dual-method lead tracking (captures URL parameters + stored attribution cookies/storage for full attribution fidelity).
- `theme.ts`: Dual-theme ("Day & Night" / Light & Dark) controller managing CSS variables (`--gm-*`).
- `sqliteD1.ts` & `localDb.ts`: D1 database abstraction and local development mock.
- `serverAuth.ts` & `adminAuth.ts`: Token verification, session cookies, and route protection.

## Setup & Commands
- **Install dependencies:** `npm install`
- **Development Server:** `npm run dev`
- **Typing + Lint Check:** `npm run check` (Runs `astro check`)
- **Unit & Integration Tests:** `npm test` (Runs `vitest run`)
- **Production Build:** `npm run build`
- **Preview Build:** `npm run preview`
- **Deploy to Cloudflare:** `npm run deploy` (Runs `npm run build && wrangler deploy` — *do not run unless explicitly requested*)

## Completed Work & Key Features Till Now

1. **Cinematic 3D Hero Experience**
   - Reversed ignition scroll sequence (starts dark in "IGNITION" state, expands to illuminate garage).
   - Procedural reflective bay flooring and dynamic light orchestration.
   - Interactive draggable timeline scrubber HUD.
   - Smooth desktop scrolling with Lenis + GSAP.

2. **Full-Stack Booking Engine**
   - Multi-step customer booking form with comprehensive Indian and global car brands & models dataset.
   - Fuel type selection (Petrol, Diesel, Hybrid, Electric, CNG) and transmission (Manual, Automatic).
   - Workshop Bay vs. Doorstep Service selection with city filtering.
   - Automatic unique Booking ID generation (`GM-YYYYMMDD-XXXX`).
   - One-click copy, WhatsApp redirection, and live status tracking modal.
   - Customer "My Bookings" lookup by phone number.

3. **Dual-Method Lead Attribution**
   - Captures UTM parameters (`utm_source`, `utm_medium`, `utm_campaign`), referrers, and landing pages.
   - Preserves lead source across navigation and stores attribution on submission.
   - Visual color-coded lead badges displayed on both desktop and mobile admin views.

4. **Robust Admin Dashboard & Operations**
   - **Expanded Desktop Table:** Full-width responsive table with custom column widths, text truncation, and quick actions.
   - **Optimized Mobile View:** Individual isolated `<article>` cards with visible borders, rounded corners, prominent Booking ID, organized sections, and equal-width tap targets (`min-h-[38px]`) in a dedicated footer.
   - **Lifecycle Management:** Full archive, restore, and permanent delete workflow with confirmation modals.
   - **Repeat Customer Identification:** Warning banner identifying repeat customers with clickable links to cross-reference previous bookings.
   - **Filters & Search:** Real-time search across IDs, names, phones, vehicle details, with status and lead-source filtering.

5. **Integrated CMS**
   - **Service Manager:** Add, edit, delete, and reorder service offerings and categories.
   - **Booking Form Customizer:** Dynamically toggle required fields and form parameters.
   - **Media Library:** Asset management with usage detection to prevent accidental deletion of images used across pages.

6. **Theme Engine & Design System**
   - "Day & Night" mode system using semantic CSS custom properties (`--gm-*`).
   - Tubelight desktop navbar with mobile-responsive menu.
   - Custom 404 & 500 error pages.
   - SEO optimization with OpenGraph metadata and structured content.

## Code Style & Conventions
- Use functional React components with hooks.
- Use Astro client directives appropriately (`client:load`, `client:visible`, `client:only="react"`).
- Prefix 3D/GLTF component refs with `ref` internally, keeping external prop interfaces clean.
- Strict TypeScript: Ensure explicit types/interfaces and 0 diagnostics in `npm run check`.
- Theme Consistency: Always use semantic CSS variables (`var(--gm-bg-card)`, `var(--gm-border-subtle)`, `var(--gm-text-primary)`, `var(--gm-accent-primary)`) rather than hardcoded colors so day/night mode renders cleanly.
- Mobile Responsiveness: Ensure all card views and containers maintain 0px horizontal scroll on 320px, 375px, and 430px viewports.
- Maintain test coverage: Run `npm test` before completing significant features or refactors.
- Never deploy (`npm run deploy` / `wrangler deploy`) unless explicitly instructed by the user.

## AI Generation Attribution
All git commits made by Claude should end with `Co-Authored-By: Claude Code <noreply@anthropic.com>`. Pull Requests generated should end with `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.