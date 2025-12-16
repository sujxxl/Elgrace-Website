import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, Edit, Plus } from 'lucide-react';

// This dashboard strictly inherits existing theme: black/white base, neutral glass,
// existing buttons, spacing, borders, typography. Accent via outlines (#dfcda5) only.

type TabKey = 'dashboard' | 'profile' | 'castings' | 'settings';

export const ProfileDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const isModel = user?.role === 'model';
  const isClient = user?.role === 'client';

  if (!user) {
    return (
      <section className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 backdrop-blur-sm text-center">
          <h3 className="text-2xl font-['Syne'] font-bold mb-2">Login Required</h3>
          <p className="text-zinc-400">Please log in to access your profile dashboard.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-6">
      <div className="grid grid-cols-1 md:grid-cols-[260px,1fr] gap-6">
        {/* Sidebar */}
        <aside className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
          {/* User Info */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold">
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <div className="text-white font-semibold">{user.name}</div>
              <div className="text-xs uppercase tracking-widest text-zinc-500">
                {isModel ? 'MODEL' : 'CLIENT / BRAND'}
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="space-y-2">
            {(isModel) && (
              <>
                {renderSideLink('dashboard', 'Dashboard', activeTab, setActiveTab)}
                {renderSideLink('profile', 'Your Profile', activeTab, setActiveTab)}
                {renderSideLink('castings', 'Casting Applied', activeTab, setActiveTab)}
                {renderSideLink('settings', 'Settings', activeTab, setActiveTab)}
              </>
            )}
            {(isClient) && (
              <>
                {renderSideLink('dashboard', 'Dashboard', activeTab, setActiveTab)}
                {renderSideLink('profile', 'Brand Profile', activeTab, setActiveTab)}
                {renderSideLink('castings', 'Castings', activeTab, setActiveTab)}
                {renderSideLink('settings', 'Settings', activeTab, setActiveTab)}
              </>
            )}
          </nav>
        </aside>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'dashboard' && (isModel ? <ModelDashboard /> : <ClientDashboard />)}
          {activeTab === 'profile' && (isModel ? <ModelProfileView /> : <ClientBrandProfile />)}
          {activeTab === 'castings' && (isModel ? <ModelCastingsApplied /> : <ClientCastingsList />)}
          {activeTab === 'settings' && (<SettingsPanel />)}
        </div>
      </div>
    </section>
  );
};

function renderSideLink(key: TabKey, label: string, active: TabKey, setActive: (k: TabKey) => void) {
  const isActive = key === active;
  return (
    <button
      onClick={() => setActive(key)}
      className={`w-full text-left px-4 py-3 rounded-xl border transition-colors uppercase tracking-widest text-xs font-bold
        ${isActive ? 'bg-white/10 border-[#dfcda5] text-white' : 'bg-white/5 border-white/10 text-zinc-300 hover:border-[#dfcda5]'}
      `}
    >
      {label}
    </button>
  );
}

/* MODEL DASHBOARD */
const ModelDashboard: React.FC = () => {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
      <h3 className="text-2xl font-['Syne'] font-bold mb-4">Profile Overview</h3>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20" />
            <div>
              <div className="font-semibold">Your Name</div>
              <div className="text-xs text-zinc-500 uppercase tracking-widest">Category: Model</div>
              <div className="text-xs text-zinc-500">City • @instagram_handle</div>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10 text-zinc-300">
            Status: Profile Under Review
          </div>
          <div className="mt-4 flex gap-3">
            <a href="/profile/edit?section=personal-info" className="px-4 py-2 rounded-xl border-2 border-[#dfcda5] text-white">Edit Profile</a>
            <button className="px-4 py-2 rounded-xl border border-white/10 text-zinc-300 hover:border-[#dfcda5]">Contact Admin</button>
          </div>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
          <h4 className="text-sm uppercase tracking-widest text-zinc-500 mb-2">Complete Your Profile</h4>
          <ProfileStepper />
        </div>
      </div>
    </div>
  );
};

/* PROFILE STEPPER */
const ProfileStepper: React.FC = () => {
  const steps = [
    { key: 'personal', label: 'Personal Information' },
    { key: 'professional', label: 'Professional Information' },
    { key: 'measurements', label: 'Measurements' },
    { key: 'media', label: 'Photos / Media' },
  ];
  const completed = ['personal'];
  const current = 'professional';

  return (
    <div className="space-y-3">
      {steps.map((s, i) => {
        const isCompleted = completed.includes(s.key);
        const isCurrent = s.key === current;
        return (
          <div key={s.key} className={`flex items-center justify-between px-4 py-3 rounded-lg border text-sm
            ${isCurrent ? 'border-[#dfcda5] bg-white/10 text-white' : 'border-white/10 bg-white/5 text-zinc-300'}
          `}>
            <span>{s.label}</span>
            {isCompleted && <CheckCircle2 className="w-4 h-4 text-white/70" />}
          </div>
        );
      })}
      <div className="flex gap-3 pt-2">
        <button className="px-4 py-2 rounded-xl border-2 border-[#dfcda5] text-white">Continue</button>
        <button className="px-4 py-2 rounded-xl border border-white/10 text-zinc-300 hover:border-[#dfcda5]">Save Draft</button>
      </div>
    </div>
  );
};

/* MODEL PROFILE VIEW */
const ModelProfileView: React.FC = () => {
  return (
    <div className="space-y-6">
      {['Personal Information', 'Professional Information', 'Measurements'].map((section) => (
        <div key={section} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-['Syne'] font-bold">{section}</h4>
            <a href={`/profile/edit?section=${section === 'Personal Information' ? 'personal-info' : section === 'Professional Information' ? 'professional-info' : 'measurements'}`} className="px-3 py-2 rounded-xl border border-white/10 text-zinc-300 hover:border-[#dfcda5] flex items-center gap-2 text-xs uppercase tracking-widest">
              <Edit className="w-4 h-4" /> Edit
            </a>
          </div>
          <div className="text-zinc-300">Details displayed here in site’s card style.</div>
        </div>
      ))}
    </div>
  );
};

/* MODEL CASTINGS APPLIED */
const ModelCastingsApplied: React.FC = () => {
  const rows: Array<Record<string, string>> = [];
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
      <h4 className="text-lg font-['Syne'] font-bold mb-4">Castings Applied</h4>
      {rows.length === 0 ? (
        <div className="text-zinc-400">You haven't applied to any castings yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-zinc-500 text-xs uppercase tracking-widest">
                {['Casting Title','Status','Type','Budget','Location','Applied On','Shoot Date','Deadline'].map(h => (
                  <th key={h} className="py-2 pr-6">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              {/* Map rows here */}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/* CLIENT DASHBOARD */
const ClientDashboard: React.FC = () => {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
      <h3 className="text-2xl font-['Syne'] font-bold mb-4">Brand Overview</h3>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-white/10 border border-white/20" />
            <div>
              <div className="font-semibold">Brand Name</div>
              <div className="text-xs text-zinc-500">website.com • @brand_instagram</div>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button className="px-4 py-2 rounded-xl border-2 border-[#dfcda5] text-white">Edit Brand Profile</button>
            <button className="px-4 py-2 rounded-xl border-2 border-[#dfcda5] text-white flex items-center gap-2"><Plus className="w-4 h-4"/> Add New Casting</button>
          </div>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
          <h4 className="text-sm uppercase tracking-widest text-zinc-500 mb-2">Recent Castings</h4>
          <div className="text-zinc-300">Your casting cards will show here using existing layout.</div>
        </div>
      </div>
    </div>
  );
};

/* CLIENT BRAND PROFILE */
const ClientBrandProfile: React.FC = () => {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
      <h4 className="text-lg font-['Syne'] font-bold mb-4">Brand Profile</h4>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <label className="block text-xs uppercase tracking-widest text-zinc-500">Brand Image / Logo</label>
          <div className="h-32 bg-zinc-950 border border-zinc-800 rounded-xl" />
        </div>
        <div className="space-y-3">
          <label className="block text-xs uppercase tracking-widest text-zinc-500">Brand Name</label>
          <input className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white focus:outline-none focus:border-white/50" placeholder="Your Brand"/>
        </div>
        <div className="space-y-3">
          <label className="block text-xs uppercase tracking-widest text-zinc-500">Website URL</label>
          <input className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white focus:outline-none focus:border-white/50" placeholder="https://"/>
        </div>
        <div className="space-y-3">
          <label className="block text-xs uppercase tracking-widest text-zinc-500">Instagram Handle</label>
          <input className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white focus:outline-none focus:border-white/50" placeholder="@handle"/>
        </div>
      </div>
      <div className="pt-4">
        <button className="px-4 py-3 rounded-2xl bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-600 text-white font-bold uppercase tracking-widest border-2 border-[#dfcda5]">Save</button>
      </div>
    </div>
  );
};

/* CLIENT CASTINGS LIST */
const ClientCastingsList: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
        <h4 className="text-lg font-['Syne'] font-bold mb-4">Your Castings</h4>
        <div className="text-zinc-300">Client-side casting cards will use the existing Castings layout and statuses (Under Verification / ONLINE / CLOSED).</div>
      </div>
    </div>
  );
};

/* SETTINGS */
const SettingsPanel: React.FC = () => {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm space-y-6">
      <div>
        <h4 className="text-lg font-['Syne'] font-bold mb-2">Email Management</h4>
        <p className="text-zinc-400 text-sm mb-3">To update your registered email, please contact support.</p>
        <div className="flex items-center gap-3">
          <span className="text-white">user@example.com</span>
          <span className="text-xs uppercase tracking-widest text-emerald-400">Verified</span>
        </div>
      </div>
      <div className="pt-2 border-t border-zinc-800">
        <h4 className="text-lg font-['Syne'] font-bold mb-2">Change Password</h4>
        <div className="grid md:grid-cols-3 gap-3">
          <input type="password" placeholder="Current Password" className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white focus:outline-none focus:border-white/50" />
          <input type="password" placeholder="New Password" className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white focus:outline-none focus:border-white/50" />
          <input type="password" placeholder="Confirm New Password" className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white focus:outline-none focus:border-white/50" />
        </div>
        <div className="pt-4 flex items-center gap-4">
          <button className="px-4 py-3 rounded-2xl bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-600 text-white font-bold uppercase tracking-widest border-2 border-[#dfcda5]">Submit</button>
          <button className="text-zinc-400 text-sm hover:text-white">Forgot password?</button>
        </div>
      </div>
    </div>
  );
};
