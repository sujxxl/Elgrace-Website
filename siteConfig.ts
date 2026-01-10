export type ViewKey = 'home' | 'services' | 'talents' | 'gallery' | 'castings' | 'auth' | 'profile';

export type ViewTabConfig = Record<ViewKey, 0 | 1>;

// Route-level visibility config. Includes all routes declared in App.tsx,
// including nested and dynamic routes.
export type RouteKey =
  | 'home'
  | 'services'
  | 'services_elgrace_talents'
  | 'services_eventicon'
  | 'talents'
  | 'talents_onboarding'
  | 'talent_profile'
  | 'gallery'
  | 'castings'
  | 'casting_detail'
  | 'auth'
  | 'reset_password'
  | 'profile'
  | 'profile_edit'
  | 'admin'
  | 'brand_profile'
  | 'test_session';

export type RouteConfig = Record<RouteKey, 0 | 1>;

// Global website configuration: set tabs to 1 (on) or 0 (off)
export const siteConfig: { tabs: ViewTabConfig; routes: RouteConfig } = {
  tabs: {
    home: 1,
    services: 1,
    talents: 0,
    gallery: 0,
    castings: 0,
    auth: 1,
    profile: 1,
  },
  routes: {
    home: 1,
    services: 1,
    services_elgrace_talents: 1,
    services_eventicon: 1,

    // Public listing and public profile are off by default (match tabs)
    talents: 0,
    talent_profile: 1,

    // Authenticated onboarding is still allowed by default
    talents_onboarding: 1,

    gallery: 0,

    castings: 0,
    casting_detail: 0,

    auth: 1,
    reset_password: 1,

    profile: 1,
    profile_edit: 1,
    admin: 1,
    brand_profile: 1,

    // Internal/dev utility route
    test_session: 0,
  },
};
