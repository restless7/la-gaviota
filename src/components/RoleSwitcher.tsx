'use client';

import React from 'react';

// In production, the RoleSwitcher is no longer needed.
// Role is now derived from Clerk authentication (publicMetadata.tier).
// This component is kept as a no-op for backward compatibility.
export function RoleSwitcher() {
  // Only show in development
  if (process.env.NODE_ENV !== 'development') return null;

  return null;
}
