import React from 'react';
import SettingsClient from './SettingsClient';
import { fetchSystemSettings } from '@/src/actions/systemSettings';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const initialSettings = await fetchSystemSettings();

  return (
    <div className="p-8 max-w-[1000px] mx-auto space-y-8 animate-fade-in">
      <SettingsClient initialSettings={initialSettings} />
    </div>
  );
}
