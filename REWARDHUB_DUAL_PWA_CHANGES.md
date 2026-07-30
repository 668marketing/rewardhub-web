# RewardHub Dual PWA — Phase 1

## Member PWA
- URL area: `/member/*`
- App name: `RewardHub`
- Manifest: `/member/manifest.webmanifest`
- Start URL: `/member/login`
- White-background RewardHub icon set

## Business PWA
- URL area: `/merchant/*`
- App name: `RewardHub Business`
- Manifest: `/merchant/manifest.webmanifest`
- Start URL: `/merchant/login`
- Black-background RewardHub icon set

## Public website
- The root layout no longer advertises the general public manifest.
- Member and business routes advertise their own manifests.

## Service worker
- Cache version updated to `rewardhub-v13`.
- Member and business login pages added to static offline cache.
- Nested PWA manifests are always requested network-first with `no-store`.

## Important
- Existing Member Portal and Merchant Portal page colours and UI were not changed.
- This phase only separates PWA identity, app name, icons, start URL and metadata.
- Passkey / Face ID / fingerprint and persistent login are not included in Phase 1.
