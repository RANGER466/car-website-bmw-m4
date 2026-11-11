/**
 * NOCTIS — config.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for every tunable value: frame counts, section
 * heights, chapter ranges, HUD limits, callout positions, lineup content,
 * and animation timing. Edit here — never in main.js or styles.css.
 */

const CONFIG = {

  // ─── FRAME SEQUENCES ──────────────────────────────────────────────────────
  hero: {
    frameCount:   598,          // clip1(200) + clip2(199, skip 1 dup) + clip3(199, skip 1 dup)
    path:         'assets/frames/hero/frame_{n}.webp',
    pathMobile:   'assets/frames/hero-mobile/frame_{n}.webp',
    frameDigits:  4,            // zero-padded: frame_0001.webp
  },

  dismantle: {
    frameCount:   199,          // flow clip frames
    path:         'assets/frames/dismantle/frame_{n}.webp',
    pathMobile:   'assets/frames/dismantle-mobile/frame_{n}.webp',
    frameDigits:  4,
  },

  // ─── SECTION HEIGHTS (vh) ─────────────────────────────────────────────────
  heroHeight:      600,   // scroll distance for hero section in vh
  dismantleHeight: 350,   // scroll distance for dismantle section in vh

  // ─── HERO TEXT CHAPTERS ───────────────────────────────────────────────────
  // in / out: scroll progress fractions (0 = top of wrapper, 1 = bottom)
  heroChapters: [
    { id: 'ch1', in: 0.00, out: 0.14 },   // "NOCTIS / The city is asleep."
    { id: 'ch2', in: 0.22, out: 0.42 },   // "It doesn't need the city's light."
    { id: 'ch3', in: 0.50, out: 0.70 },   // "It brings its own."
    { id: 'ch4', in: 0.80, out: 1.00 },   // GT-E specs
  ],

  // ─── HUD COUNTERS ─────────────────────────────────────────────────────────
  hud: {
    maxSpeed:    118,    // KM/H reached at progress 1.0
    maxDistance: 4.2,    // KM reached at progress 1.0
  },

  // ─── DISMANTLE CALLOUTS ───────────────────────────────────────────────────
  // showAfterProgress: callout appears after this fraction of dismantle scroll
  // x, y: percentage position within the stage div (left / top)
  dismantleCallouts: [
    {
      id:                'body',
      showAfterProgress: 0.70,
      x:                 28,
      y:                 30,
      label:             'BODY',
      text:              'Carbon composite monocoque',
    },
    {
      id:                'battery',
      showAfterProgress: 0.72,
      x:                 50,
      y:                 72,
      label:             'BATTERY',
      text:              '110 kWh structural pack',
    },
    {
      id:                'drive',
      showAfterProgress: 0.74,
      x:                 72,
      y:                 58,
      label:             'DRIVE',
      text:              'Dual axial-flux motors, 680 kW',
    },
    {
      id:                'light',
      showAfterProgress: 0.76,
      x:                 20,
      y:                 55,
      label:             'LIGHT',
      text:              'Single-line LED signature',
    },
  ],

  // ─── LINEUP CARS ──────────────────────────────────────────────────────────
  lineup: [
    {
      id:      'gt-e',
      number:  '01',
      name:    'GT-E',
      tagline: 'The grand tourer.',
      range:   '640 km',
      accel:   '3.1 s',
      power:   '680 kW',
      img:     'assets/cars/gt-e.webp',
      alt:     'NOCTIS GT-E — matte graphite grand tourer coupe, side profile',
      swatches: ['#2A2B2E', '#EDEAE4', '#1A1E25', '#3D1A1A'],
    },
    {
      id:      's',
      number:  '02',
      name:    'S',
      tagline: 'Four doors, no compromise.',
      range:   '600 km',
      accel:   '3.6 s',
      power:   '520 kW',
      img:     'assets/cars/s.webp',
      alt:     'NOCTIS S — satin bone white four-door sport sedan, side profile',
      swatches: ['#EDEAE4', '#8A8F98', '#121418', '#2A2B2E'],
    },
    {
      id:      'x',
      number:  '03',
      name:    'X',
      tagline: 'Higher, never heavier.',
      range:   '560 km',
      accel:   '4.2 s',
      power:   '480 kW',
      img:     'assets/cars/x.webp',
      alt:     'NOCTIS X — midnight blue SUV with coupe roofline, side profile',
      swatches: ['#1A2035', '#8A8F98', '#121418', '#2A2B2E'],
    },
    {
      id:      'r',
      number:  '04',
      name:    'R',
      tagline: 'Built for the track.',
      range:   '420 km',
      accel:   '2.4 s',
      power:   '900 kW',
      img:     'assets/cars/r.webp',
      alt:     'NOCTIS R — satin black two-seat track coupe with fixed rear wing, side profile',
      swatches: ['#121418', '#E1251B', '#2A2B2E', '#8A8F98'],
    },
    {
      id:      'one',
      number:  '05',
      name:    'ONE',
      tagline: 'The future, early.',
      range:   'Concept',
      accel:   '—',
      power:   '—',
      img:     'assets/cars/one.webp',
      alt:     'NOCTIS ONE — liquid silver concept hypercar, extremely low and long, side profile',
      swatches: ['#C0C8D0', '#8A8F98', '#EDEAE4', '#121418'],
    },
  ],

  // ─── ANIMATION ────────────────────────────────────────────────────────────
  frameLerp:            0.15,   // current += (target − current) × frameLerp each rAF
  lineupHoverDebounce:  80,     // ms before hover registers on a lineup slide
  lineupTransitionMs:   700,    // ms for accordion flex transition

  // ─── FILM GRAIN ───────────────────────────────────────────────────────────
  grain: {
    tileSize:  256,
    fps:       8,       // noise tile shifts per second
    opacity:   0.035,   // 3.5% (set on #grain-canvas in CSS)
  },

  // ─── CUSTOM CURSOR ────────────────────────────────────────────────────────
  cursor: {
    lerpSpeed: 0.18,
    barWidth:  44,
    barHeight: 2,
  },

  // ─── PRELOADER ────────────────────────────────────────────────────────────
  preloaderInitialFrames: 40,   // load this many hero frames before revealing page

  // ─── STATIC FRAMES FOR prefers-reduced-motion ─────────────────────────────
  reducedMotion: {
    heroFrames:    [0, 150, 298, 597],   // 0-based frame indices shown for 0%/35%/65%/100%
    dismantleFirst: 0,                   // 0-based
    dismantleLast:  198,                 // 0-based  (= frameCount - 1)
  },

};

window.NOCTIS_CONFIG = CONFIG;
