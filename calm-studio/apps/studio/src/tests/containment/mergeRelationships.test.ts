// SPDX-FileCopyrightText: 2026 CalmStudio Contributors
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import type { CalmArchitecture } from '@calmstudio/calm-core';
import { mergeContainmentRelationships } from '$lib/stores/mergeContainmentRelationships';

function arch(relationships: CalmArchitecture['relationships']): CalmArchitecture {
	return {
		nodes: [
			{ 'unique-id': 'p', 'node-type': 'system', name: 'P', description: '' },
			{ 'unique-id': 'a', 'node-type': 'service', name: 'A', description: '' },
			{ 'unique-id': 'b', 'node-type': 'service', name: 'B', description: '' },
		],
		relationships,
	};
}

describe('mergeContainmentRelationships', () => {
	it('unions nodes[] and keeps the first unique-id', () => {
		const { architecture, changed } = mergeContainmentRelationships(
			arch([
				{
					'unique-id': 'first',
					'relationship-type': { 'composed-of': { container: 'p', nodes: ['a'] } },
					description: 'keep me',
				},
				{
					'unique-id': 'second',
					'relationship-type': { 'composed-of': { container: 'p', nodes: ['b'] } },
				},
			])
		);
		expect(changed).toBe(true);
		expect(architecture.relationships).toHaveLength(1);
		const rel = architecture.relationships[0]!;
		expect(rel['unique-id']).toBe('first');
		expect(rel.description).toBe('keep me');
		const rt = rel['relationship-type'];
		if (!('composed-of' in rt)) throw new Error('expected composed-of');
		expect(rt['composed-of'].nodes).toEqual(['a', 'b']);
	});

	it('does not mix composed-of and deployed-in', () => {
		const { architecture, changed } = mergeContainmentRelationships(
			arch([
				{
					'unique-id': 'c',
					'relationship-type': { 'composed-of': { container: 'p', nodes: ['a'] } },
				},
				{
					'unique-id': 'd',
					'relationship-type': { 'deployed-in': { container: 'p', nodes: ['b'] } },
				},
			])
		);
		expect(changed).toBe(false);
		expect(architecture.relationships).toHaveLength(2);
	});

	it('leaves already-merged relationships unchanged', () => {
		const input = arch([
			{
				'unique-id': 'one',
				'relationship-type': { 'composed-of': { container: 'p', nodes: ['a', 'b'] } },
			},
		]);
		const { changed, architecture } = mergeContainmentRelationships(input);
		expect(changed).toBe(false);
		expect(architecture.relationships).toHaveLength(1);
	});
});
