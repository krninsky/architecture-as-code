// SPDX-FileCopyrightText: 2026 CalmStudio Contributors
//
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ExplorerTreeEntry } from '$lib/explorer/types';
import { createDefaultProjectConfig } from '$lib/project/defaults';
import { clearPatternRegistry, getAllPatterns } from '$lib/templates/patternRegistry';
import { applyProjectPatterns } from '$lib/templates/projectPatterns';
import { applyProjectTemplates } from '$lib/templates/projectTemplates';
import { patternScanDirs } from '$lib/templates/projectJsonScan';
import { getAllTemplates, resetToBundledTemplates } from '$lib/templates/registry';

vi.mock('$lib/explorer/folderScan', () => ({
	scanDirectoryTree: vi.fn(),
}));

import { scanDirectoryTree } from '$lib/explorer/folderScan';

const tradesPattern = {
	$schema: 'https://calm.finos.org/release/1.0/meta/calm.json',
	$id: 'https://calm.finos.org/calm/namespaces/qcon/patterns/trades-api-and-mcp/versions/1.0.0',
	title: 'Trades API and MCP Pattern',
	description: 'MCP-based architecture',
	type: 'object',
	properties: {
		nodes: {
			type: 'array',
			prefixItems: [{ properties: { 'unique-id': { const: 'mcp-client' } } }],
		},
	},
};

const projectTemplate = {
	nodes: [{ 'unique-id': 'n1', 'node-type': 'service', name: 'S', description: '' }],
	relationships: [],
	_template: {
		id: 'proj-sample',
		name: 'Project sample',
		description: '',
		category: 'team',
		tags: [],
		version: '1.0.0',
		author: 'test',
	},
};

function jsonEntry(relativePath: string, value: unknown): ExplorerTreeEntry {
	const name = relativePath.split('/').pop() ?? relativePath;
	return {
		kind: 'file',
		name,
		relativePath,
		handle: {
			kind: 'file',
			getFile: async () =>
				({
					text: async () => JSON.stringify(value),
				}) as File,
		} as FileSystemFileHandle,
		isCalm: false,
		nodesLoaded: false,
	};
}

describe('patternScanDirs', () => {
	it('scans templates.dir when patterns.dir is unset', () => {
		expect(patternScanDirs('templates', undefined)).toEqual([
			{ dir: 'templates', warnUnknown: false },
		]);
	});

	it('scans both folders when they differ', () => {
		expect(patternScanDirs('templates', 'patterns')).toEqual([
			{ dir: 'patterns', warnUnknown: true },
			{ dir: 'templates', warnUnknown: false },
		]);
	});

	it('scans a mixed folder once without unknown-file warnings', () => {
		expect(patternScanDirs('templates', 'templates')).toEqual([
			{ dir: 'templates', warnUnknown: false },
		]);
	});
});

describe('applyProjectTemplates / applyProjectPatterns mixed folder', () => {
	beforeEach(() => {
		resetToBundledTemplates();
		clearPatternRegistry();
		vi.mocked(scanDirectoryTree).mockReset();
	});

	it('loads CLI patterns from templates.dir and does not warn they are not templates', async () => {
		vi.mocked(scanDirectoryTree).mockResolvedValue([
			jsonEntry('templates/proj-sample.json', projectTemplate),
			jsonEntry('templates/trades-api-and-mcp.pattern.json', tradesPattern),
		]);

		const cfg = {
			...createDefaultProjectConfig('model'),
			templates: { dir: 'templates' },
		};
		const root = {} as FileSystemDirectoryHandle;

		const templates = await applyProjectTemplates(root, cfg);
		const patterns = await applyProjectPatterns(root, cfg);

		expect(templates.warnings).toEqual([]);
		expect(patterns.warnings).toEqual([]);
		expect(getAllTemplates().some((t) => t._template.id === 'proj-sample')).toBe(true);
		expect(getAllPatterns()).toHaveLength(1);
		expect(getAllPatterns()[0]?.name).toBe('Trades API and MCP Pattern');
	});

	it('does not treat architecture templates as missing patterns.dir failures', async () => {
		vi.mocked(scanDirectoryTree).mockResolvedValue([
			jsonEntry('templates/proj-sample.json', projectTemplate),
		]);

		const cfg = {
			...createDefaultProjectConfig('model'),
			templates: { dir: 'templates' },
		};
		const root = {} as FileSystemDirectoryHandle;
		const patterns = await applyProjectPatterns(root, cfg);
		expect(patterns.loaded).toBe(0);
		expect(patterns.warnings).toEqual([]);
	});
});
