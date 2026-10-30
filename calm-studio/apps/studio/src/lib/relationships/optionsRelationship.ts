// SPDX-FileCopyrightText: 2026 CalmStudio Contributors
// SPDX-License-Identifier: Apache-2.0

/**
 * Options-shaped relationship bodies (R97).
 *
 * A body matches CALM `options` when it is an array of decision objects and at
 * least one decision lists two node ids. The relationship-type key itself may
 * be `options` or a custom name. The key is never rewritten here.
 */

import type { CalmRelationshipVariant } from '@calmstudio/calm-core';

const CORE_DRAWN = new Set<string>(['connects', 'interacts', 'composed-of', 'deployed-in']);

export interface OptionsPair {
	source: string;
	target: string;
}

export function relationshipTypeRecord(value: unknown): Record<string, unknown> | null {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
	return value as Record<string, unknown>;
}

function decisionNodeIds(item: unknown): string[] {
	if (!item || typeof item !== 'object') return [];
	const nodes = (item as { nodes?: unknown }).nodes;
	if (!Array.isArray(nodes)) return [];
	return nodes.filter((id): id is string => typeof id === 'string' && id.length > 0);
}

/** True when `body` is an options decision array with at least one drawable pair. */
export function isOptionsShapedBody(body: unknown): boolean {
	if (!Array.isArray(body)) return false;
	return body.some((item) => decisionNodeIds(item).length >= 2);
}

/**
 * Edges for an options-shaped body. Each decision draws from its first node to
 * every later node. Ids absent from `present` are skipped when that set is given.
 */
export function optionsPairs(body: unknown, present?: ReadonlySet<string>): OptionsPair[] {
	if (!Array.isArray(body)) return [];
	const pairs: OptionsPair[] = [];
	for (const item of body) {
		const ids = decisionNodeIds(item).filter((id) => !present || present.has(id));
		if (ids.length < 2) continue;
		const [source, ...rest] = ids;
		if (!source) continue;
		for (const target of rest) {
			pairs.push({ source, target });
		}
	}
	return pairs;
}

/** The only key on `relationship-type`, or null when the object is empty or mixed. */
export function soleRelationshipKey(rt: Record<string, unknown>): string | null {
	const keys = Object.keys(rt);
	return keys.length === 1 ? (keys[0] ?? null) : null;
}

/**
 * Canvas edge component for this relationship-type.
 * Unknown non-options keys return null so they are not forced onto the options edge.
 */
export function canvasVariantForRelationshipType(rt: unknown): CalmRelationshipVariant | null {
	const record = relationshipTypeRecord(rt);
	if (!record) return null;
	if ('connects' in record) return 'connects';
	if ('composed-of' in record) return 'composed-of';
	if ('interacts' in record) return 'interacts';
	if ('deployed-in' in record) return 'deployed-in';
	const key = soleRelationshipKey(record);
	if (!key) return null;
	if (isOptionsShapedBody(record[key])) return 'options';
	return null;
}

/** Kept in the document when the canvas has no edge for it (R97). */
export function isUndrawableRelationship(
	relationshipType: unknown,
	presentNodeIds: ReadonlySet<string>,
): boolean {
	const record = relationshipTypeRecord(relationshipType);
	if (!record) return true;
	const key = soleRelationshipKey(record);
	if (!key) return true;
	if (CORE_DRAWN.has(key)) return false;
	if (isOptionsShapedBody(record[key])) {
		return optionsPairs(record[key], presentNodeIds).length === 0;
	}
	return true;
}
