import React from 'react'

import fallbackBackgroundImage from '../assets/abstract-blue-pink.jpg'

/**
 * Defines the shape of each route's configuration.
 */
export interface RouteConfig {
  path: string
  label: string
  backgroundImageOrLayout: string | React.FC<{ children: React.ReactNode }>
  // The component is defined as a function returning a promise (for lazy loading)
  component: () => Promise<{ default: React.FC }>
  // Optional: if true, this route won't show in the navigation bar
  hideFromNav?: boolean
}

type Routes = Record<string, RouteConfig>

/**
 * Central configuration for all routes.
 */
export const routes: Routes = {
  home: {
    path: '/',
    label: 'Home',
    backgroundImageOrLayout: `url(${fallbackBackgroundImage})`,
    component: () => import('../pages/Home'),
  },
  mux: {
    path: '/mux',
    label: 'Mux',
    backgroundImageOrLayout: `url(${fallbackBackgroundImage})`,
    component: () => import('../pages/Mux'),
  },
  callback: {
    path: '/callback',
    label: 'Spotify Callback',
    backgroundImageOrLayout: `url(${fallbackBackgroundImage})`,
    component: () => import('../pages/SpotifyCallback'),
    hideFromNav: true,
  },
}
