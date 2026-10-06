# AMG ONE GLB Asset Inspection Report

**Overview**
- Total triangles: 387,826
- Total vertices: 421,471
- Number of meshes: 152
- Number of materials: 32 (PBR structure with BaseColor, MetallicRoughness, etc.)
- Textures: 25 textures embedded (JPEG/PNG), highest is ~375KB compressed (likely 1k or 2k).
- Physical materials: Has transparent glass materials (`amgprojone_clearglass2`, `amgprojone_clearglass`, `amgprojone_glass_005`), though they use BLEND mode instead of proper physical transmission (KHR_materials_transmission is missing). Might need material tuning.

**Hierarchy & Object Availability**
- **Wheels**: Yes, separated into `amgprojone_rim`, `amgprojone_rim_001`, `amgprojone_rim_002`, `amgprojone_rim_003`.
- **Tyres**: Yes, separated into `amgprojone_tire`, `amgprojone_tire_001`, `amgprojone_tire_002`, `amgprojone_tire_003`.
- **Brake discs**: NOT found as separate meshes.
- **Calipers**: NOT found as separate meshes.
- **Suspension components**: NOT found as separate meshes.
- **Engine/Powertrain**: A single merged mesh group `amgprojone_body_009_engine2_3_0` within the main body group. Not independently rigged for deep access.
- **Cockpit/Interior**: Yes, embedded within doors and body but materials are separate (`amgprojone_interior_9`, `amgprojone_interior_alcantara`).
- **Dashboard/Instrument cluster**: No separate HUD/Cluster mesh found (combined in the main interior).
- **Headlights**: Separate meshes exist (`amgprojone_headlightframe_R`, `amgprojone_headlightframe_L`, `amgprojone_headlight`).
- **Body Panels**: Separate panels include `amgprojone_door_L`, `amgprojone_door_R`, `amgprojone_bumper_F`, `amgprojone_bumper_R`, `amgprojone_tailgate`, `amgprojone_spoiler`.
- **Doors/Pivots**: Doors exist as root objects and likely have usable pivots.
- **Transparency/Glass**: Yes, multiple glass materials (`amgprojone_clearglass2`, `amgprojone_windshield`). Requires alpha mode handling or double-sided adjustments for cinematic presentation.

**Missing Supported Anchors**
The model does not contain distinct nodes for: brake discs, calipers, suspension struts/springs, dedicated deep powertrain components. We will omit these anchors or link them to a fallback empty group rather than inventing them, per instructions.

**License / Attribution**
Creative Commons Attribution required for Sketchfab assets.
