// Edit this file to make the portfolio yours. Everything else reads from here.
export const CONFIG = {
  name: 'Atharv Kashiv',
  role: 'Game Developer',
  email: 'atharvakashiv505@gmail.com',
  // Used when /api/projects is unavailable (no VERCEL_TOKEN): repos whose homepage is a *.vercel.app site are shown.
  githubUser: '', // TODO: your GitHub username
  socials: [
    { label: 'GitHub', url: '', icon: 'gh' },      // TODO
    { label: 'LinkedIn', url: '', icon: 'in' },    // TODO
    { label: 'itch.io', url: '', icon: 'itch' },   // TODO
    { label: 'Resume', url: '', icon: 'cv' },      // TODO: link to a PDF
  ],
  // Character stats (0-100)
  stats: [
    { label: 'Gameplay Programming', value: 92 },
    { label: 'Game Design', value: 86 },
    { label: 'Level Design', value: 80 },
    { label: '3D / Tech Art', value: 72 },
    { label: 'Web & Tools', value: 88 },
  ],
  // Weapon wheel: your toolkit (8 fits the wheel best)
  arsenal: [
    { name: 'Unity', ammo: 95, info: 'Engine of choice for fast prototypes, mobile and indie builds.' },
    { name: 'Unreal', ammo: 80, info: 'Blueprints + C++ for high-fidelity 3D worlds.' },
    { name: 'C#', ammo: 92, info: 'Gameplay systems, AI, tooling and editor scripts.' },
    { name: 'C++', ammo: 75, info: 'Performance-critical code and engine-level work.' },
    { name: 'Blender', ammo: 70, info: 'Modelling, rigging and props for my own levels.' },
    { name: 'Godot', ammo: 68, info: 'Lightweight 2D/3D jams and experiments.' },
    { name: 'JavaScript', ammo: 88, info: 'Web games, three.js, and this very portfolio.' },
    { name: 'Git', ammo: 90, info: 'Version control, CI and shipping builds without fear.' },
  ],
  // Story mode: your journey, oldest first. TODO: replace with your real milestones.
  story: [
    { chapter: '01', title: 'The Spark', year: 'Origin', text: 'Played one game too many and decided to build my own instead.' },
    { chapter: '02', title: 'First Build', year: 'Level 1', text: 'Shipped my first playable prototype. It was ugly. It was mine.' },
    { chapter: '03', title: 'Game Jams', year: 'Level 2', text: '48 hours, no sleep, one theme. Learned scope the hard way.' },
    { chapter: '04', title: 'Open World', year: 'Now', text: 'Building bigger systems, polished feel, and games people replay.' },
  ],
  tips: [
    'TIP: Hover the weapon wheel to inspect each tool in the arsenal.',
    'TIP: Every mission card is a live project pulled straight from Vercel.',
    'TIP: Type "HIRE" anywhere on the page to activate a cheat.',
    'TIP: Click blips on the radar to fast-travel between sections.',
    'TIP: Turn on SFX in the top bar for the full experience.',
  ],
};
