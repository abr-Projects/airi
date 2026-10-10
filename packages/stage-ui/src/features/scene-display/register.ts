import { createStoreSceneDisplayTarget } from './dom-target'
import { useSceneDisplayStore } from './store'

/**
 * Registers the in-app display target for the current renderer.
 *
 * Use when:
 * - An app shell mounts `SceneDisplayOverlay` and can check leadership
 *
 * Expects:
 * - A leader check from the caller. Only the leader registers a target, because
 *   the model tool runs where the LLM request runs
 *
 * Returns:
 * - Nothing. Call `useSceneDisplayStore().setTarget()` without an argument to
 *   detach the target again
 */
export function registerSceneDisplayTarget() {
  useSceneDisplayStore().setTarget(createStoreSceneDisplayTarget())
}
