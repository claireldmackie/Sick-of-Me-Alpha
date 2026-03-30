const GAME = Object.freeze({
    WIDTH: 1920,
    HEIGHT: 1080,
    HERO_SPEED: 480,
    EDGE_THRESHOLD: 20,
    FAR_EDGE: 1900,
    CENTER_X: 960,
    HERO_ENTER_RIGHT_X: 1850,
    SCALE_SNAP_THRESHOLD: 0.01,
});

const AUDIO = Object.freeze({
    DEFAULT_VOLUME: 0.5,
    VOLUME_MAX: 3.0,
    FADE_STEPS: 60,
    FADE_IN_MS: 10000,
    FADE_OUT_MS: 2000,
    RESUME_MS: 3000,
    SWITCH_FADE_MS: 3000,
    START_MUSIC_MS: 3000,
});

const SCENES = Object.freeze({
    STORE_INDICES: Object.freeze([12, 13, 14, 15]),
    BRIDGE_START: 3,
    SAVE_SLOT_COUNT: 3,
    SAVE_KEY_PREFIX: 'sickofme_save_',
});

const RENDER = Object.freeze({
    HOVER_PAD: 8,
    HOVER_RADIUS: 12,
    HOVER_BLUR: 20,
    GLOW_BLUR: 24,
    GLOW_ALPHA: 0.65,
    GLOW_COLOR: 'rgba(255, 250, 220, 1)',
    DEFAULT_ARROW_SIZE: 30,
    DEFAULT_FADE_MS: 1000,
    OVERLAY_FADE_MS: 800,
    PAN_DOWN_MS: 6000,
});
