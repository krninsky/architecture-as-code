// SPDX-FileCopyrightText: 2026 CalmStudio Contributors
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import type { Node, Edge } from '@xyflow/svelte';
import { calmToFlow, flowToCalm } from '$lib/stores/projection';
import type { CalmArchitecture } from '@calmstudio/calm-core';

const multi: CalmArchitecture = {
	nodes: [
		{ 'unique-id': 'p', 'node-type': 'system', name: 'P', description: '' },
		{ 'unique-id': 'a', 'node-type': 'service', name: 'A', description: '' },
		{ 'unique-id': 'b', 'node-type': 'service', name: 'B', description: '' },
	],
	relationships: [
		{
			'unique-id': 'rel-c',
			'relationship-type': { 'composed-of': { container: 'p', nodes: ['a', 'b'] } },
		},
	],
};

describe('flowToCalm nodes[]', () => {
	it('round-trips a multi-child composed-of as one relationship', () => {
		const { nodes, edges } = calmToFlow(multi);
		expect(edges).toHaveLength(2);
		expect(edges.every((e) => e.data?.calmRelId === 'rel-c')).toBe(true);
		const out = flowToCalm(nodes, edges);
		expect(out.relationships).toHaveLength(1);
		const rt = out.relationships[0]!['relationship-type'];
		if (!('composed-of' in rt)) throw new Error('expected composed-of');
		expect(out.relationships[0]!['unique-id']).toBe('rel-c');
		expect(rt['composed-of'].nodes.sort()).toEqual(['a', 'b']);
	});

	it('merges two 1:1 canvas edges of the same variant', () => {
		const nodes: Node[] = [
			{ id: 'p', position: { x: 0, y: 0 }, data: { calmId: 'p', calmType: 'system', label: 'P' } },
			{ id: 'a', position: { x: 0, y: 0 }, data: { calmId: 'a', calmType: 'service', label: 'A' } },
			{ id: 'b', position: { x: 0, y: 0 }, data: { calmId: 'b', calmType: 'service', label: 'B' } },
		];
		const edges: Edge[] = [
			{
				id: 'e1',
				source: 'p',
				target: 'a',
				type: 'composed-of',
				data: { calmVariant: 'composed-of', calmRelId: 'keep' },
			},
			{
				id: 'e2',
				source: 'p',
				target: 'b',
				type: 'composed-of',
				data: { calmVariant: 'composed-of', calmRelId: 'keep' },
			},
		];
		const out = flowToCalm(nodes, edges);
		expect(out.relationships).toHaveLength(1);
		const rt = out.relationships[0]!['relationship-type'];
		if (!('composed-of' in rt)) throw new Error('expected composed-of');
		expect(out.relationships[0]!['unique-id']).toBe('keep');
		expect(rt['composed-of'].nodes).toEqual(['a', 'b']);
	});
});
