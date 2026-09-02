// SPDX-FileCopyrightText: 2026 CalmStudio Contributors
//
// SPDX-License-Identifier: Apache-2.0

export interface CalmPatternCard {
	id: string;
	name: string;
	description: string;
	relativePath: string;
	pattern: object;
}

const patterns = new Map<string, CalmPatternCard>();

export function registerPattern(card: CalmPatternCard): void {
	patterns.set(card.id, card);
}

export function getPattern(id: string): CalmPatternCard | undefined {
	return patterns.get(id);
}

export function getAllPatterns(): CalmPatternCard[] {
	return Array.from(patterns.values());
}

export function clearPatternRegistry(): void {
	patterns.clear();
}

/**
 * JSON Schema CALM CLI pattern — not `_template` architecture JSON (R41).
 */
export function parseCalmPattern(value: unknown, relativePath: string): CalmPatternCard | null {
	if (!value || typeof value !== 'object') return null;
	const rec = value as Record<string, unknown>;
	if (rec['_template']) return null;
	const hasSchema = typeof rec['$schema'] === 'string' || typeof rec['$id'] === 'string';
	if (!hasSchema) return null;
	if (rec['type'] !== undefined && rec['type'] !== 'object') return null;
	const props = rec['properties'];
	if (!props || typeof props !== 'object') return null;
	const nodes = (props as Record<string, unknown>)['nodes'];
	if (!nodes || typeof nodes !== 'object') return null;
	const nodeSchema = nodes as Record<string, unknown>;
	if (!Array.isArray(nodeSchema['prefixItems']) && nodeSchema['const'] === undefined) {
		return null;
	}
	const title = typeof rec['title'] === 'string' && rec['title'].trim() ? rec['title'].trim() : relativePath;
	const description = typeof rec['description'] === 'string' ? rec['description'] : '';
	const id =
		typeof rec['$id'] === 'string' && rec['$id'].trim()
			? rec['$id'].trim()
			: `pattern:${relativePath}`;
	return {
		id,
		name: title,
		description,
		relativePath,
		pattern: rec,
	};
}
