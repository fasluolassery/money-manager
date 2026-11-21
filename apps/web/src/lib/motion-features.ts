// Separate module so Vite code-splits the motion feature bundle away from the
// initial chunk. Import this file only via dynamic import (UI.md 6.1).
export { domAnimation as features } from "motion/react";
