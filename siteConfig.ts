export type ViewKey = 'home' | 'services' | 'talents' | 'gallery' | 'castings' | 'auth' | 'profile';

export type ViewTabConfig = Record<ViewKey, 0 | 1>;

// Global website configuration: set tabs to 1 (on) or 0 (off)
export const siteConfig: { tabs: ViewTabConfig } = {
  tabs: {
    home: 1,
    services: 1,
    talents: 1,
    gallery: 0,
    castings: 0,
    auth: 1,
    profile: 1,
  },
};
