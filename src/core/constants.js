// Shared constants — change here, applies everywhere

/** Viewport width breakpoint (px) below which mobile layout is used */
export const MOBILE_BREAKPOINT = 768;

/** Default camera Z position on desktop */
export const DESKTOP_CAMERA_Z = 14;

/** Default camera Z position on mobile */
export const MOBILE_CAMERA_Z = 24;

/** Idle rotation speed for main 3D objects (radians/frame) */
export const DEFAULT_ROTATE_SPEED = 0.005;

/** How much cursor delta maps to hover rotation */
export const HOVER_SPEED = 0.0015;

/** Per-frame damping factor for hover momentum decay */
export const HOVER_DAMPING = 0.96;

/** Minimum velocity before hover momentum is considered zero */
export const HOVER_VELOCITY_THRESHOLD = 0.0001;
