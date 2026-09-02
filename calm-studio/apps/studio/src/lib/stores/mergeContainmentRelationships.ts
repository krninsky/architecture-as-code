// SPDX-FileCopyrightText: 2026 CalmStudio Contributors
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Merge 1:1 composed-of / deployed-in relationships that share a container
 * into the canonical CALM shape: at most one of each variant per container.
 */

import type { CalmArchitecture, CalmRelationship } from '@calmstudio/calm-core';

export type ContainmentVariant = 'composed-of' | 'deployed-in';

function containmentPayload(
	rel: CalmRelationship
): { variant: ContainmentVariant; container: string; nodes: string[] } | null {
	const rt = rel['relationship-type'];
	if ('composed-of' in rt) {
		return {
			variant: 'composed-of',
			container: rt['composed-of'].container,
			nodes: [...rt['composed-of'].nodes],
		};
	}
	if ('deployed-in' in rt) {
		return {
			variant: 'deployed-in',
			container: rt['deployed-in'].container,
			nodes: [...rt['deployed-in'].nodes],
		};
	}
	return null;
}

function unionNodes(first: string[], extra: string[]): string[] {
	const seen = new Set(first);
	const out = [...first];
	for (const id of extra) {
		if (seen.has(id)) continue;
		seen.add(id);
		out.push(id);
	}
	return out;
}

/**
 * Keep the first relationship `unique-id` (document order) per (container, variant).
 * Union `nodes[]`. Description / metadata / controls stay on the first relationship.
 */
export function mergeContainmentRelationships(arch: CalmArchitecture): {
	architecture: CalmArchitecture;
	changed: boolean;
} {
	const relationships = arch.relationships ?? [];
	const kept: CalmRelationship[] = [];
	const indexByKey = new Map<string, number>();
	let changed = false;

	for (const rel of relationships) {
		const payload = containmentPayload(rel);
		if (!payload) {
			kept.push(rel);
			continue;
		}
		const key = `${payload.variant}::${payload.container}`;
		const existingIdx = indexByKey.get(key);
		if (existingIdx === undefined) {
			indexByKey.set(key, kept.length);
			kept.push({
				...rel,
				'relationship-type':
					payload.variant === 'composed-of'
						? { 'composed-of': { container: payload.container, nodes: payload.nodes } }
						: { 'deployed-in': { container: payload.container, nodes: payload.nodes } },
			});
			continue;
		}
		changed = true;
		const first = kept[existingIdx]!;
		const firstPayload = containmentPayload(first)!;
		const nodes = unionNodes(firstPayload.nodes, payload.nodes);
		kept[existingIdx] = {
			...first,
			'relationship-type':
				payload.variant === 'composed-of'
					? { 'composed-of': { container: payload.container, nodes } }
					: { 'deployed-in': { container: payload.container, nodes } },
		};
	}

	if (!changed) {
		return { architecture: arch, changed: false };
	}
	return {
		architecture: { ...arch, relationships: kept },
		changed: true,
	};
}
