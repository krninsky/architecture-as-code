// SPDX-FileCopyrightText: 2026 CalmStudio Contributors
//
// SPDX-License-Identifier: Apache-2.0

/**
 * c4State.svelte.ts — C4 navigation as a document trail.
 *
 * One architecture file = one diagram (the Context of its system). A node can
 * carry a `details.detailed-architecture` link to another document; drilling it
 * jumps to that document. The `trail` is the path of documents you've followed;
 * trail[0] is the root (the editable document, ref = null). There are no levels
 * to switch and no within-document drilling — depth is simply how many links
 * deep you are. A document's declared `metadata.c4-level` is an optional label.
 *
 * Module-level $state runes; no imports from .svelte files.
 */

import type { C4Level } from './c4Filter';

// ─── Types ───────────────────────────────────────────────────────────────────

/** One document in the navigation trail. ref = null is the editable root document. */
export type C4Frame = { ref: string | null; label: string; level: C4Level };

const LEVELS: C4Level[] = ['context', 'container', 'component'];
const levelForDepth = (depth: number): C4Level => LEVELS[Math.min(depth, LEVELS.length - 1)]!;

// ─── Module-level state ───────────────────────────────────────────────────────

/** Whether the read-only C4 document view is showing. */
let active = $state(false);

/**
 * Whether the top frame is loaded onto the *editable* canvas instead of the
 * read-only view. Distinct from `active`: both imply a non-empty trail (so the
 * breadcrumb shows), but `editing` means the document in view can be mutated and
 * the read-only-keyed UI (palette hidden, inspector read-only) is NOT in effect.
 */
let editing = $state(false);

/** The document trail. trail[0] is the editable root; each entry is one link deeper. */
let trail = $state<C4Frame[]>([]);

// ─── Getters ─────────────────────────────────────────────────────────────────

/** True when the read-only navigation view is showing (vs. editing a document). */
export function isC4Mode(): boolean {
	return active;
}

/** True when the document at the top of the trail is being edited on the canvas. */
export function isEditingC4Doc(): boolean {
	return editing;
}

/** True whenever a trail exists — read-only view OR editing a drilled document. */
export function inC4Navigation(): boolean {
	return active || editing;
}

/** The document trail (for the breadcrumb). */
export function getC4Trail(): C4Frame[] {
	return trail;
}

/** The current document's level (the top frame's), or null when there's no trail. */
export function getC4Level(): C4Level | null {
	return trail.length > 0 ? trail[trail.length - 1]!.level : null;
}

/** The top frame, or null. */
export function getCurrentFrame(): C4Frame | null {
	return trail.length > 0 ? trail[trail.length - 1]! : null;
}

/**
 * The ref of the document currently in view (the top frame). `null` means the
 * root document (the editable model itself).
 */
export function getActiveDocumentRef(): string | null {
	return trail.length > 0 ? trail[trail.length - 1]!.ref : null;
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Enter navigation at the root (the editable document). */
export function enterC4(rootLabel: string, rootLevel: C4Level = 'context'): void {
	active = true;
	editing = false;
	trail = [{ ref: null, label: rootLabel, level: rootLevel }];
}

/** Exit navigation, back to editing the root document. */
export function exitC4(): void {
	active = false;
	editing = false;
	trail = [];
}

/**
 * Switch the current top frame from the read-only view to the editable canvas,
 * keeping the trail intact so the breadcrumb still offers a way back up.
 */
export function editTopFrame(): void {
	active = false;
	editing = true;
}

/**
 * Return the current top frame to the read-only view without changing the trail
 * (used when drilling deeper out of a document that was being edited).
 */
export function resumeC4View(): void {
	active = true;
	editing = false;
}

/**
 * Drill into a node's linked document (details.detailed-architecture). Prefers
 * the document's declared level, else depth-derived. Returns the level, or
 * **null if it would form a cycle** (that document is already in the trail).
 */
export function drillIntoDocument(ref: string, label: string, level?: C4Level): C4Level | null {
	if (trail.some((f) => f.ref === ref)) return null; // cycle
	const lvl = level ?? levelForDepth(trail.length);
	trail = [...trail, { ref, label, level: lvl }];
	active = true; // a freshly-drilled document is shown read-only
	editing = false;
	return lvl;
}

/**
 * Navigate up to the frame at `index` (inclusive). Returns the new top frame, or
 * null. Valid range is [0, trail.length - 1]; a negative index is a no-op (use
 * exitC4 to leave), a too-large index clamps to the current top.
 */
export function navigateUpTo(index: number): C4Frame | null {
	if (index < 0) return null;
	const clamped = Math.min(index, trail.length - 1);
	trail = trail.slice(0, clamped + 1);
	active = true; // an ancestor we climb back to is shown read-only
	editing = false;
	return trail[trail.length - 1] ?? null;
}

// ─── Test utilities ───────────────────────────────────────────────────────────

/** Reset C4 state to initial values (use in tests' beforeEach). */
export function resetC4State(): void {
	active = false;
	editing = false;
	trail = [];
}
