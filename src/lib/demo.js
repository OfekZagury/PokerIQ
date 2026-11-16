// Demo mode: a backend-free build for the public live demo.
// Build with VITE_DEMO_MODE=true to keep progress in the browser (localStorage)
// and unlock all lessons for visitors.
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";
