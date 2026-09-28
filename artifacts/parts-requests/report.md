# Parts Requests verification

Implemented a fully client-side board with all four stages, all 39 records, searchable cards, accessible stage selectors, a right-side Vaul drawer, and a react-hook-form/Zod request dialog. No DnD package exists, so stage moves use explicit native selects; no dependency, backend, migration, routing, navigation, or shared CSS rule changes were made by this worker. Existing mock fields remain intact; photo and category were added to every record.

## Validation

- `pnpm check`: PASS.
- `pnpm build`: PASS (existing large-bundle advisory and Node deprecation warning only).
- Live Playwright Chromium at desktop 1440 × 1000 and mobile 390 × 844, using a test-only interception of /api/auth/me to provide a Planner identity.
- Initial board: 39 cards, counts Requested 12 / Quoted 8 / QA/QC 5 / Fulfilled 14.
- Moving PR-001 to Quoted updated counts to 11 / 9 / 5 / 14.
- Opening a request displayed its full record and all six QA/QC checks.
- Submitting an empty form displayed four required-field validation errors; completing it added a visible PR-040 card (40 total). Quantity uses integer, positive, maximum-9999 validation.
- Refresh reset the board to 39 original mock requests, as disclosed in the UI and success toast.
- All 39 card images loaded with positive naturalWidth; no browser JavaScript or console errors in final verification.
- Actual fast desktop/mobile screenshots inspected and nonblank; no entrance animation added to the board. Drawer screenshots taken once the standard Vaul transition settled. Mobile document had no horizontal overflow.

## Evidence

[Desktop fast capture](desktop-fast.png), [mobile fast capture](mobile-fast.png), [desktop drawer](detail.png), [mobile drawer](mobile-detail.png), [photograph contact sheet](photo-contact-sheet.png).

## Image provenance

The mock contains **38 distinct names**, rather than the 37 stated in the task. All 38 have a separate generated representative photograph; repeated rows share the matching image. Assets are in `client/public/assets/parts/`, matching the existing `/assets/` public-image convention, encoded as 1000-pixel JPEGs (approximately 4.5 MB total).

Generated with the built-in image_gen tool, one call per part. These are photorealistic AI-generated illustrations, not photographs of Wingbox's inventory or evidence of an exact P/N, condition, or certification; the page and drawer explicitly disclose illustrative photography. Source PNGs remain in the tool's generated-images directory, while all project assets are installed in the repository.

Prompt template:

> Use case: product-mockup. One photorealistic studio catalog photograph of a detached commercial aviation {partName}, representative aircraft component, realistic physical materials and connectors, centered fully visible on neutral light gray workbench, soft daylight, three quarter view, no text logos people. Landscape.

The engine prompt requested a complete detached LEAP-1A26 turbofan engine on a neutral light gray hangar floor, three-quarter view, soft daylight, realistic metallic details, centered and fully visible, no text, logos, or people.

### Asset mapping

- LEAP-1A26 Engine: `client/public/assets/parts/leap-1a26-engine.jpg`
- Brake Assembly: `client/public/assets/parts/brake-assembly.jpg`
- Avionics Unit: `client/public/assets/parts/avionics-unit.jpg`
- Fuel Pump: `client/public/assets/parts/fuel-pump.jpg`
- Hydraulic Pump: `client/public/assets/parts/hydraulic-pump.jpg`
- Landing Gear Sensor: `client/public/assets/parts/landing-gear-sensor.jpg`
- Cabin Air Valve: `client/public/assets/parts/cabin-air-valve.jpg`
- Engine Igniter: `client/public/assets/parts/engine-igniter.jpg`
- APU Fuel Filter: `client/public/assets/parts/apu-fuel-filter.jpg`
- Wing Nav Light: `client/public/assets/parts/wing-nav-light.jpg`
- Tire Assembly: `client/public/assets/parts/tire-assembly.jpg`
- Smoke Detector: `client/public/assets/parts/smoke-detector.jpg`
- APU Generator: `client/public/assets/parts/apu-generator.jpg`
- Landing Gear Actuator: `client/public/assets/parts/landing-gear-actuator.jpg`
- Fuel Nozzle: `client/public/assets/parts/fuel-nozzle.jpg`
- Oxygen Generator: `client/public/assets/parts/oxygen-generator.jpg`
- Cabin Display: `client/public/assets/parts/cabin-display.jpg`
- Pitot Tube: `client/public/assets/parts/pitot-tube.jpg`
- Weather Radar Unit: `client/public/assets/parts/weather-radar-unit.jpg`
- Cargo Door Actuator: `client/public/assets/parts/cargo-door-actuator.jpg`
- HPC Fan Blade: `client/public/assets/parts/hpc-fan-blade.jpg`
- Valve Assembly: `client/public/assets/parts/valve-assembly.jpg`
- Brake Disc: `client/public/assets/parts/brake-disc.jpg`
- Actuator: `client/public/assets/parts/actuator.jpg`
- Oil Filter: `client/public/assets/parts/oil-filter.jpg`
- Wheel Assembly: `client/public/assets/parts/wheel-assembly.jpg`
- Avionics Module: `client/public/assets/parts/avionics-module.jpg`
- APU Starter: `client/public/assets/parts/apu-starter.jpg`
- Sensor: `client/public/assets/parts/sensor.jpg`
- Cabin Light Fixture: `client/public/assets/parts/cabin-light-fixture.jpg`
- Hydraulic Reservoir: `client/public/assets/parts/hydraulic-reservoir.jpg`
- Nose Landing Gear Light: `client/public/assets/parts/nose-landing-gear-light.jpg`
- Engine Fire Detector: `client/public/assets/parts/engine-fire-detector.jpg`
- Cockpit Window Seal: `client/public/assets/parts/cockpit-window-seal.jpg`
- Battery Pack: `client/public/assets/parts/battery-pack.jpg`
- Anti-Ice Valve: `client/public/assets/parts/anti-ice-valve.jpg`
- Emergency Slide Cartridge: `client/public/assets/parts/emergency-slide-cartridge.jpg`
- Cargo Smoke Sensor: `client/public/assets/parts/cargo-smoke-sensor.jpg`

## Remaining scope

No remaining task work. All request creation and stage moves are intentionally session-only; mock documents expose metadata and explicitly do not offer fake downloads. Stage moves do not invent quotes, approval evidence, or QA/QC completions.

