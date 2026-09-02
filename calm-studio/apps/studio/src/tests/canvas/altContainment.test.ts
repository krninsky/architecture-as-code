// SPDX-FileCopyrightText: 2026 CalmStudio Contributors
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it, beforeEach } from 'vitest';
import type { Node, Edge } from '@xyflow/svelte';
import {
	ensureContainmentEdge,
	extractChildFromParent,
	setContainmentMembers,
} from '$lib/canvas/containment';
import {
	clearLastUsedContainment,
	containmentVariantsOnParent,
	getLastUsedContainment,
	setLastUsedContainment,
} from '$lib/canvas/containmentLastUsed';

const nodes: Node[] = [
	{ id: 'p', type: 'container', position: { x: 0, y: 0 }, data: { label: 'P' } },
	{ id: 'a', position: { x: 10, y: 10 }, parentId: 'p', data: { label: 'A' } },
	{ id: 'b', position: { x: 20, y: 20 }, data: { label: 'B' } },
];

describe('ensureContainmentEdge calmRelId', () => {
	it('reuses calmRelId from an existing same-variant sibling', () => {
		let edges: Edge[] = ensureContainmentEdge('p', 'a', []);
		const relId = (edges[0]!.data as { calmRelId: string }).calmRelId;
		edges = ensureContainmentEdge('p', 'b', edges);
		expect(edges).toHaveLength(2);
		expect((edges[1]!.data as { calmRelId: string }).calmRelId).toBe(relId);
	});
});

describe('extractChildFromParent', () => {
	it('removes containment edges and parentId', () => {
		const edges: Edge[] = [
			{
				id: 'e1',
				source: 'p',
				target: 'a',
				type: 'composed-of',
				data: { calmRelId: 'r1', calmVariant: 'composed-of' },
			},
		];
		const out = extractChildFromParent('p', 'a', nodes, edges);
		expect(out.edges).toHaveLength(0);
		expect(out.nodes.find((n) => n.id === 'a')?.parentId).toBeUndefined();
	});
});

describe('setContainmentMembers', () => {
	it('deletes the relationship when the last member is removed', () => {
		const edges: Edge[] = [
			{
				id: 'e1',
				source: 'p',
				target: 'a',
				type: 'composed-of',
				data: { calmRelId: 'r1', calmVariant: 'composed-of' },
			},
		];
		const out = setContainmentMembers('p', 'r1', 'composed-of', [], nodes, edges);
		expect(out.edges).toHaveLength(0);
		expect(out.nodes.find((n) => n.id === 'a')?.parentId).toBeUndefined();
	});
});

describe('last-used containment', () => {
	beforeEach(() => clearLastUsedContainment());

	it('is session memory only', () => {
		expect(getLastUsedContainment('p')).toBeUndefined();
		setLastUsedContainment('p', 'deployed-in');
		expect(getLastUsedContainment('p')).toBe('deployed-in');
	});

	it('lists variants present on a parent', () => {
		const edges: Edge[] = [
			{ id: '1', source: 'p', target: 'a', type: 'composed-of' },
			{ id: '2', source: 'p', target: 'b', type: 'deployed-in' },
		];
		expect(containmentVariantsOnParent('p', edges).sort()).toEqual(['composed-of', 'deployed-in']);
	});
});
