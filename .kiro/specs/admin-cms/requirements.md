# Requirements Document

## Introduction

This feature extends the existing Grand Motors Admin Panel into a lightweight, purpose-built website Content Management System (CMS). The goal is to let the workshop owner — a non-technical operator — manage the website's images, services, and booking-form content without editing source code or redeploying.

This is **not** a generic page builder and **must not** redesign the website or alter the 3D cinematic hero and its camera choreography. The feature works strictly within the current architecture: Astro 7 + React 19 + TypeScript on the Cloudflare adapter (hybrid SSR via per-route `prerender = false`), a D1 database bound as `DB`, the auto-provisioned `SESSION` KV namespace with Astro Sessions, and the existing session-based admin authentication (login/logout, middleware gating `/admin/*` and `/api/admin/*`, and server-side auth helpers in `src/lib/serverAuth.ts`). No remote Cloudflare account, deployment, or remote resource provisioning is involved. All development and testing run locally via Wrangler/Miniflare.

Today, the eight service categories are hardcoded in `src/components/site/servicesData.ts` and consumed by the public Services page, the Book Service form, the Footer, and the admin dashboard. Images live in `public/images/`. Booking functionality (create/list/detail/status) and 67 passing tests already exist and must be preserved. This CMS introduces authoritative content storage in D1 (and R2 for production image binaries, with a local-dev storage strategy), seeds the existing content without loss, and makes the public site read from that authoritative source while keeping the current design and layout intact.

The primary admin persona throughout this document is the **Owner** — a non-technical workshop owner who is already an authenticated admin of the existing panel.

## Glossary

- **Admin / Owner**: An authenticated administrator (the non-technical workshop owner) whose session is validated by the existing admin authentication helpers. The primary persona for all CMS management capabilities.
- **CMS**: The content-management capability set added to the existing Admin Panel for managing media, services, and booking-form content.
- **Media Asset**: A single uploaded image managed by the Media Library, consisting of a stored binary and its metadata record (filename, dimensions, file size, MIME type, storage key, and usage references).
- **Media Library**: The authenticated admin area for uploading, previewing, replacing, deleting, searching, and assigning Media Assets.
- **Usage Location**: A predefined, named slot on the public website to which a Media Asset can be assigned (for example: homepage hero/sections, service page hero, footer/CTA image, an individual service image, about page, contact page, or another designated content image). Usage Locations are a fixed, system-defined set, not freely created by the Owner.
- **Media Reference**: A stored association in D1 linking a Media Asset to a Usage Location, used to determine whether an asset is in use.
- **In-Use Asset**: A Media Asset that has one or more active Media References to Usage Locations.
- **Service Config**: The authoritative service catalogue stored in D1 (categories and services, including id, title/name, description/summary, item list, image assignment, display order, public-visibility flag, booking-selectability flag, and active/deactivated state). Replaces the hardcoded `servicesData.ts` list as the single source of truth.
- **Service Category**: A top-level grouping within the Service Config (for example "Brakes" or "Engine & Diagnostics"), containing one or more services and carrying its own display order and visibility.
- **Booking Form Config**: The authoritative configuration in D1 that controls the public Book Service form's heading, supporting text, field labels, helper text, optional-field visibility, additional custom questions, confirmation-page messaging, available appointment slots, and booking-window settings.
- **Essential Field**: A booking-form field required for a valid booking and protected from removal or being made optional: customer name, phone number, vehicle information, requested date, and requested time.
- **Storage Driver**: An abstraction that stores and retrieves Media Asset binaries, with at least two implementations: an R2-backed driver for production and a local-development driver that works without a Cloudflare account.
- **Object Key**: A unique identifier used by the Storage Driver to address a stored binary, generated to avoid collisions between assets.
- **Migration**: A versioned, ordered SQL change script applied to the D1 schema, created before any schema change and stored so the schema can be reproduced and extended without data loss.
- **Audit Metadata**: Recorded information about content mutations capturing who changed what and when, where practical, to support traceability.
- **3D Cinematic Hero**: The existing bundled 3D hero scene and camera choreography. Its assets are hardcoded/bundled and are explicitly out of scope for dynamic management.
- **Public Site**: The customer-facing website pages (homepage, services, about, contact, booking) that render content for visitors.
- **Safe Fallback**: A predefined default rendering (such as a placeholder image or last-known-good content) used when a referenced Media Asset or content item is missing or deleted.

---

## Requirements

### Media Library

#### Requirement 1: Upload Media Assets

**User Story:** As the Owner, I want to upload image files into a media library, so that I can add and update website imagery without editing source code.

#### Acceptance Criteria

1. WHEN an authenticated Admin submits an image upload, THE CMS SHALL validate, before storing anything, that the file's MIME type is one of image/jpeg, image/png, or image/webp, that the file extension matches the MIME type, that the file size is within the configured minimum and maximum bounds, and that the bytes decode as a valid image of that type.
2. IF an upload fails any of the MIME-type, extension, size, or content checks, THEN THE CMS SHALL reject the upload and return an error that identifies which of the four checks failed.
3. WHEN an upload passes validation, THE CMS SHALL store the binary via the active Storage Driver under a newly generated unique Object Key and SHALL store the Media Asset metadata in D1.
4. THE CMS SHALL store Media Asset binaries only via the Storage Driver and SHALL NOT store any image binary in D1.
5. IF an upload request is submitted without a valid authenticated Admin session, THEN THE CMS SHALL reject the upload and SHALL NOT store any binary or metadata.
6. WHEN a Media Asset is stored, THE CMS SHALL record its original filename, pixel width and height, byte size, MIME type, and Object Key in the Media Asset metadata.
7. IF storing the binary or the metadata fails after the other has been written, THEN THE CMS SHALL remove the already-written part so that no orphaned binary without metadata, and no metadata without a binary, remains.

#### Requirement 2: Preview and Browse Media Assets

**User Story:** As the Owner, I want to see and search my uploaded images with their details, so that I can find and reuse the right asset.

#### Acceptance Criteria

1. WHEN an authenticated Admin opens the Media Library, THE CMS SHALL display each Media Asset with a preview, its filename, pixel dimensions, byte size, and every Usage Location to which it is currently assigned.
2. WHEN an authenticated Admin enters a search or filter term, THE CMS SHALL return the Media Assets whose filename or assigned Usage Location name contains the term using case-insensitive substring matching.
3. WHEN a search or filter term matches no Media Assets, THE CMS SHALL return an empty result set and SHALL indicate that no assets matched.
4. WHERE a Media Asset is an In-Use Asset, THE CMS SHALL display every Usage Location to which the asset is assigned.
5. IF a Media Library view is requested without a valid authenticated Admin session, THEN THE CMS SHALL deny the request.

#### Requirement 3: Replace Media Assets

**User Story:** As the Owner, I want to replace an existing image, so that every place it appears updates at once while the design stays the same.

#### Acceptance Criteria

1. WHEN an authenticated Admin replaces a Media Asset with a new image, THE CMS SHALL validate the new image using the same checks defined for upload in Requirement 1.
2. WHEN a replacement passes validation, THE CMS SHALL store the new binary under a newly generated unique Object Key and SHALL update the Media Asset so that all of its existing Usage Locations reference the new image together, with no Usage Location left referencing the old image.
3. WHEN a Media Asset is replaced, THE CMS SHALL retain the previous binary and its metadata sufficient to restore the previous image.
4. IF a replacement fails during validation or storage, THEN THE CMS SHALL leave the existing Media Asset and all of its Usage Location references unchanged.
5. IF a replacement request is submitted without a valid authenticated Admin session, THEN THE CMS SHALL reject the replacement.

#### Requirement 4: Delete Media Assets Safely

**User Story:** As the Owner, I want deletion of images to be guarded, so that I do not accidentally break a page that still uses an image.

#### Acceptance Criteria

1. WHEN an authenticated Admin requests deletion of a Media Asset, THE CMS SHALL require an explicit confirmation that names the specific Media Asset before performing the deletion.
2. IF the targeted Media Asset is an In-Use Asset, THEN THE CMS SHALL block the deletion and SHALL return the Usage Locations that still reference the asset, until every referencing Usage Location is reassigned or replaced.
3. WHEN deletion is confirmed for a Media Asset that is not an In-Use Asset, THE CMS SHALL remove the stored binary via the Storage Driver and the Media Asset metadata from D1 together, such that either both are removed or neither is.
4. IF a deletion fails partway, THEN THE CMS SHALL leave the Media Asset binary and metadata intact.
5. IF a deletion request is submitted without a valid authenticated Admin session, THEN THE CMS SHALL reject the deletion.

#### Requirement 5: Assign Media Assets to Usage Locations

**User Story:** As the Owner, I want to assign images to specific places on the website, so that the right picture appears in the right spot.

#### Acceptance Criteria

1. THE CMS SHALL expose a fixed, system-defined set of Usage Locations covering the homepage hero and sections, the service page hero, the footer/CTA image, individual service images, the about page, the contact page, and other designated content images, and SHALL NOT allow Usage Locations to be created at runtime.
2. WHEN an authenticated Admin assigns a Media Asset to a Usage Location, THE CMS SHALL store exactly one active Media Reference linking that asset to that Usage Location in D1.
3. WHEN an authenticated Admin assigns a Media Asset to a Usage Location that already has an assignment, THE CMS SHALL replace the previous Media Reference so that the Usage Location references exactly one Media Asset.
4. IF an assignment targets a location that is not in the fixed Usage Location set, THEN THE CMS SHALL reject the assignment.
5. THE CMS SHALL exclude the 3D Cinematic Hero's bundled assets from the set of assignable Usage Locations.
6. WHEN the CMS is first initialised, THE CMS SHALL create Media References such that each Usage Location continues to render the same image it currently shows on the Public Site.

### Service Manager

#### Requirement 6: Seed Existing Services Without Loss

**User Story:** As the Owner, I want my existing eight services to be available in the new manager automatically, so that nothing disappears when the CMS is turned on.

#### Acceptance Criteria

1. WHEN the Service Config is first initialised and contains zero service records, THE CMS SHALL migrate exactly the eight existing hardcoded services (engine-diagnostics, brakes, tyres-alignment, ac-electrical, suspension-steering, general-service, body-paint, detailing-interior) from the hardcoded source into D1 as the authoritative Service Config.
2. WHEN seeding completes, THE CMS SHALL preserve, for each of the eight services, the identical id, title, summary/description text, item list contents and item ordering, image assignment, and ascending display-order position matching the hardcoded source order.
3. IF one or more of the eight service ids already exists in the Service Config at initialisation, THEN THE CMS SHALL skip seeding for every already-present id and SHALL NOT create a duplicate record or overwrite any field of an existing record.
4. THE CMS SHALL complete seeding such that the Service Config contains exactly eight active services with no service marked deactivated, hidden from the public catalogue, or excluded from booking-form selectability as a result of seeding.
5. IF seeding fails before all eight services are persisted, THEN THE CMS SHALL leave the Service Config in its pre-seed state with no partial records persisted and SHALL return an error indicating that seeding did not complete.

#### Requirement 7: Manage Services and Categories

**User Story:** As the Owner, I want to create, edit, and deactivate services and categories, so that the catalogue reflects what the workshop actually offers.

#### Acceptance Criteria

1. WHEN an authenticated Admin creates a service or Service Category with a non-empty name, THE CMS SHALL store the new record in the Service Config in D1 and SHALL assign it a display-order position after all existing records in its grouping.
2. WHEN an authenticated Admin edits a service's name, description, or item list, THE CMS SHALL persist the changes to the Service Config and SHALL retain the record's existing id, display-order position, visibility flag, and selectability flag unchanged.
3. WHEN an authenticated Admin deactivates a service or Service Category, THE CMS SHALL mark the record as deactivated and SHALL retain the record and all of its stored fields in D1 without deletion.
4. WHEN an authenticated Admin assigns or replaces a service's image by selecting an existing Media Asset, THE CMS SHALL update the Service Config so the service references the selected Media Asset.
5. IF an authenticated Admin submits a service or Service Category create or edit with an empty or whitespace-only name, THEN THE CMS SHALL reject the mutation, SHALL NOT persist any change, and SHALL return an error identifying the invalid name field.
6. IF a Service Manager mutation is requested without a valid authenticated Admin session, THEN THE CMS SHALL reject the mutation and SHALL NOT persist any change to the Service Config.

#### Requirement 8: Order and Visibility of Services

**User Story:** As the Owner, I want to control the order and visibility of services, so that the catalogue and booking form show the right options in the right sequence.

#### Acceptance Criteria

1. WHEN an authenticated Admin reorders Service Categories or services, THE CMS SHALL persist a contiguous display-order sequence in the Service Config such that each reordered record receives a unique ascending position reflecting the submitted order.
2. WHEN an authenticated Admin toggles a service's public-catalogue visibility, THE CMS SHALL persist the updated visibility flag to the Service Config.
3. WHEN an authenticated Admin toggles a service's booking-form selectability, THE CMS SHALL persist the updated selectability flag to the Service Config.
4. WHERE a service's public-catalogue visibility flag is disabled, THE CMS SHALL exclude that service from the Public Site services catalogue.
5. WHERE a service's booking-form selectability flag is disabled, THE CMS SHALL exclude that service from the selectable options in the Book Service form.
6. WHERE a service is marked deactivated, THE CMS SHALL exclude that service from both the Public Site services catalogue and the Book Service form selectable options regardless of its visibility and selectability flags.

#### Requirement 9: Single Authoritative Service Source

**User Story:** As the Owner, I want the website and the booking form to always agree about which services exist, so that customers never see mismatched options.

#### Acceptance Criteria

1. THE CMS SHALL use the D1 Service Config as the single authoritative source for all service and Service Category data.
2. WHEN the Public Site services catalogue renders, THE Public Site SHALL read service data exclusively from the D1 Service Config.
3. WHEN the Book Service form renders its service options, THE Public Site SHALL read service options exclusively from the D1 Service Config.
4. THE CMS SHALL NOT read from, or render from, any hardcoded service list other than the D1 Service Config for the Public Site services catalogue or the Book Service form options.
5. WHEN the Public Site services catalogue and the Book Service form render for the same request state, THE Public Site SHALL present a service in a surface only when that service's corresponding visibility or selectability flag is enabled in the D1 Service Config.

### Booking Form Customizer

#### Requirement 10: Customize Booking Form Content

**User Story:** As the Owner, I want to edit the booking form's wording and optional fields, so that the form matches how the workshop talks to customers.

#### Acceptance Criteria

1. WHEN an authenticated Admin edits the booking form heading or supporting text, THE CMS SHALL persist the changes to the Booking Form Config.
2. WHEN an authenticated Admin edits a field label or helper text, THE CMS SHALL persist the changes to the Booking Form Config.
3. WHEN an authenticated Admin toggles the visibility of an optional field, THE CMS SHALL persist the updated optional-field visibility in the Booking Form Config.
4. WHEN an authenticated Admin adds an additional custom question, THE CMS SHALL store the custom question in the Booking Form Config.
5. WHEN an authenticated Admin edits the confirmation-page messaging, THE CMS SHALL persist the updated messaging in the Booking Form Config.
6. IF a Booking Form Config mutation is requested without a valid authenticated Admin session, THEN THE CMS SHALL reject the mutation.

#### Requirement 11: Manage Appointment Availability

**User Story:** As the Owner, I want to set which appointment slots and booking windows are offered, so that customers only request times the workshop can serve.

#### Acceptance Criteria

1. WHEN an authenticated Admin edits the available appointment slots, THE CMS SHALL persist the updated slots in the Booking Form Config.
2. WHEN an authenticated Admin edits the booking-window settings, THE CMS SHALL persist the updated booking-window settings in the Booking Form Config.
3. WHEN the Book Service form renders available times, THE Public Site SHALL offer only the appointment slots permitted by the active Booking Form Config.
4. THE CMS SHALL NOT provide payment processing within the booking flow.
5. THE CMS SHALL NOT automatically confirm an appointment as a result of a booking submission.

#### Requirement 12: Protect Essential Fields and Backend Validation

**User Story:** As the Owner, I want the critical fields and security checks to be protected, so that customization cannot break bookings or security.

#### Acceptance Criteria

1. IF an Admin attempts to remove an Essential Field or make an Essential Field optional, THEN THE CMS SHALL reject the change and retain the field as required.
2. WHEN the booking submission endpoint validates input, THE Booking API SHALL apply field validation driven by the active Booking Form Config.
3. THE Booking API SHALL enforce security validation and required backend fields independently of the Booking Form Config, such that no Booking Form Config value can disable security validation or bypass a required backend field.
4. WHEN a booking is submitted, THE Booking API SHALL validate every Essential Field server-side regardless of the Booking Form Config.

### Public Content & Image Rendering

#### Requirement 13: Render Saved Content and Media on the Public Site

**User Story:** As a website visitor, I want to see the owner's latest content and images, so that the site reflects current services and visuals.

#### Acceptance Criteria

1. WHEN the Public Site renders a Usage Location, THE Public Site SHALL display the Media Asset currently referenced by that Usage Location in D1.
2. WHEN the Public Site renders services, THE Public Site SHALL reflect the current service descriptions, images, and display order from the Service Config.
3. WHEN the Public Site renders the Book Service form, THE Public Site SHALL reflect the active Booking Form Config settings.
4. THE Public Site SHALL preserve the existing design and layout of all current public pages while rendering CMS-managed content.

#### Requirement 14: Safe Fallbacks and No Exposed Admin Functions

**User Story:** As a website visitor, I want pages to stay intact even if an image is missing, so that the site never looks broken or exposes admin tools.

#### Acceptance Criteria

1. IF a Usage Location references a Media Asset that is missing or deleted, THEN THE Public Site SHALL render a Safe Fallback in place of the missing asset.
2. IF a CMS-managed content item cannot be loaded, THEN THE Public Site SHALL render a Safe Fallback and SHALL keep the surrounding page functional.
3. THE Public Site SHALL NOT expose any admin-only CMS functionality to unauthenticated visitors.

#### Requirement 15: Preserve the 3D Cinematic Hero

**User Story:** As the Owner, I want the cinematic 3D hero to remain exactly as built, so that the signature experience and animations are never broken by content changes.

#### Acceptance Criteria

1. THE CMS SHALL NOT modify the 3D Cinematic Hero scene, its bundled assets, or its camera choreography.
2. THE CMS SHALL NOT auto-manage bundled or hardcoded 3D Cinematic Hero scene assets.
3. BEFORE enabling dynamic management of any hero-adjacent asset, THE CMS SHALL first establish which assets are safe to manage dynamically and SHALL manage only those assets.

### Storage Architecture

#### Requirement 16: Data and Binary Storage Separation

**User Story:** As the Owner, I want content stored reliably within the existing infrastructure, so that the CMS works without any paid external service.

#### Acceptance Criteria

1. THE CMS SHALL store Service Config, Booking Form Config, Media Asset metadata, and Media References in D1.
2. THE CMS SHALL store uploaded production image binaries in R2 via the Storage Driver.
3. THE CMS SHALL NOT depend on any external paid CMS service.
4. THE CMS SHALL operate within the existing Worker and D1 setup bound as `DB`.

#### Requirement 17: Local Development Storage Strategy

**User Story:** As a developer, I want to test the CMS locally, so that I can work without a Cloudflare account or any deployment.

#### Acceptance Criteria

1. WHERE no Cloudflare account or R2 binding is available, THE Storage Driver SHALL use a local-development implementation to store and retrieve image binaries.
2. THE CMS SHALL function in local development via Wrangler/Miniflare without a remote Cloudflare account.
3. WHEN the active Storage Driver changes between local development and production, THE CMS SHALL retrieve each Media Asset binary using the Object Key stored in its metadata.

### Security & Reliability

#### Requirement 18: Authenticated, Validated Mutations

**User Story:** As the Owner, I want every change to be authenticated and validated, so that only I can change content and bad input cannot cause harm.

#### Acceptance Criteria

1. WHEN any CMS mutation endpoint receives a request, THE CMS SHALL authenticate the request server-side using the existing admin authentication helpers before performing the mutation.
2. IF a CMS mutation request lacks a valid authenticated Admin session, THEN THE CMS SHALL reject the request and SHALL NOT perform the mutation.
3. WHEN a CMS mutation includes user-provided input, THE CMS SHALL validate and sanitize the input before persisting it.
4. WHEN an image upload or replacement is processed, THE CMS SHALL validate the image MIME type, file extension, and file size before storing the binary.

#### Requirement 19: Safe Persistence and Preserved Booking Security

**User Story:** As the Owner, I want the CMS to use safe database practices and keep existing booking security, so that current functionality remains secure.

#### Acceptance Criteria

1. WHEN the CMS executes any SQL against D1, THE CMS SHALL use parameterized SQL statements.
2. THE CMS SHALL preserve the existing booking API security behaviour, including public PII-stripped reads and admin-gated writes.
3. THE CMS SHALL NOT weaken the existing middleware gating of `/admin/*` and `/api/admin/*`.

#### Requirement 20: Audit Metadata and Recoverability

**User Story:** As the Owner, I want a record of changes and the ability to recover, so that I can trace and undo mistakes where reasonable.

#### Acceptance Criteria

1. WHEN a CMS mutation modifies Service Config, Booking Form Config, or a Media Reference, THE CMS SHALL record Audit Metadata capturing the acting Admin, the change, and the time where practical.
2. WHEN a Media Asset is replaced or a CMS-managed content item is updated, THE CMS SHALL retain recovery information sufficient to restore the previous state where reasonable.

### Project Guardrails (Non-Functional Constraints)

#### Requirement 21: No Deployment or Remote Provisioning

**User Story:** As the Owner, I want all work done safely within local tooling, so that no remote resources or costs are incurred.

#### Acceptance Criteria

1. THE CMS implementation SHALL NOT perform any deployment to a remote environment.
2. THE CMS implementation SHALL NOT provision any remote Cloudflare resource.
3. THE CMS SHALL rely only on the existing bindings (`DB`, the auto-provisioned `SESSION` KV, and a locally testable Storage Driver) during development.

#### Requirement 22: Preserve Existing Site and Booking Functionality

**User Story:** As the Owner, I want the current website and bookings to keep working, so that adding the CMS introduces no regressions.

#### Acceptance Criteria

1. THE CMS SHALL preserve all current public pages and their existing behaviour.
2. THE CMS SHALL preserve the existing booking creation, listing, detail, and status-management functionality.
3. THE CMS SHALL NOT alter the 3D Cinematic Hero or break existing animations.

#### Requirement 23: Schema Inspection and Migrations

**User Story:** As a developer, I want schema changes to be deliberate and reproducible, so that the database evolves without data loss.

#### Acceptance Criteria

1. BEFORE applying any D1 schema change, THE CMS implementation SHALL inspect the current schema.
2. WHEN a D1 schema change is required, THE CMS implementation SHALL create an ordered Migration script rather than editing data destructively.
3. THE CMS implementation SHALL preserve the existing `bookings` table and its data when applying Migrations.

#### Requirement 24: Verification After Each Stage

**User Story:** As a developer, I want the project checked after each meaningful change, so that regressions are caught early.

#### Acceptance Criteria

1. AFTER each meaningful implementation stage, THE CMS implementation SHALL run the project type check, build, and test suite.
2. IF the type check, build, or test suite fails after a stage, THEN THE CMS implementation SHALL resolve the failure before proceeding to the next stage.
3. THE CMS implementation SHALL keep the existing 67 tests passing and SHALL add tests for new CMS behaviour.
