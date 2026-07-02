// SPDX-FileCopyrightText: 2026 CalmStudio Contributors
//
// SPDX-License-Identifier: Apache-2.0

/**
 * fileName.ts — canonical CALM artifact filenames.
 *
 * CalmStudio writes architectures as `<snake_case>.calm.json`. A document's
 * display name (from metadata, a demo title, or a previously-opened file) is
 * shaped into that form on save: directory stripped, any existing
 * `.calm.json` / `.json` / `.calm` extension removed so the suffix is never
 * doubled, the base converted to snake_case, then the canonical suffix added.
 */

/** Canonical extension for a CALM architecture file. */
export const CALM_FILE_EXT = '.calm.json';

/** Strip directory segments — handles both POSIX and Windows separators. */
function basename(name: string): string {
	return name.split(/[\\/]/).pop() ?? name;
}

/** Remove a trailing CALM/JSON extension so it isn't doubled on re-append. */
function stripCalmExt(name: string): string {
	const lower = name.toLowerCase();
	if (lower.endsWith('.calm.json')) return name.slice(0, -'.calm.json'.length);
	if (lower.endsWith('.json')) return name.slice(0, -'.json'.length);
	if (lower.endsWith('.calm')) return name.slice(0, -'.calm'.length);
	return name;
}

/**
 * Convert an arbitrary label to snake_case: split camelCase boundaries, drop
 * diacritics and apostrophes, collapse every other non-alphanumeric run into a
 * single underscore, then lowercase and trim leading/trailing underscores.
 */
export function toSnakeCase(input: string): string {
	return input
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '') // strip diacritics (é → e)
		.replace(/['’]/g, '') // don't → dont (no stray underscore)
		.replace(/([a-z0-9])([A-Z])/g, '$1_$2') // camelCase → camel_Case
		.replace(/[^a-zA-Z0-9]+/g, '_') // any other run → single _
		.replace(/_+/g, '_')
		.replace(/^_+|_+$/g, '')
		.toLowerCase();
}

/**
 * Canonical `<snake_case>.calm.json` filename for a document name. Falls back to
 * `architecture.calm.json` when the name has no usable characters. Idempotent —
 * `meridian.calm.json` → `meridian.calm.json`, never `meridian.calm.calm.json`.
 */
export function toCalmFileName(name: string | null | undefined): string {
	const base = toSnakeCase(stripCalmExt(basename(name ?? '')));
	return (base || 'architecture') + CALM_FILE_EXT;
}
