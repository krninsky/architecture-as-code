// SPDX-FileCopyrightText: 2026 CalmStudio Contributors
//
// SPDX-License-Identifier: Apache-2.0

import { describe, test, expect } from 'vitest';
import { toCalmFileName, toSnakeCase } from '$lib/io/fileName';

describe('toSnakeCase', () => {
	test('spaces and punctuation collapse to single underscores', () => {
		expect(toSnakeCase('Meridian — Concept Architecture')).toBe('meridian_concept_architecture');
	});

	test('camelCase boundaries are split', () => {
		expect(toSnakeCase('MyDiagram')).toBe('my_diagram');
	});

	test('diacritics are stripped, apostrophes dropped without a stray underscore', () => {
		expect(toSnakeCase("Café déjà don't")).toBe('cafe_deja_dont');
	});

	test('leading/trailing/duplicate separators are trimmed', () => {
		expect(toSnakeCase('  --Hello__World--  ')).toBe('hello_world');
	});
});

describe('toCalmFileName', () => {
	test('shapes a human title into snake_case with the canonical suffix', () => {
		expect(toCalmFileName('Meridian — Concept Architecture')).toBe(
			'meridian_concept_architecture.calm.json',
		);
	});

	test('does not double the suffix when already present', () => {
		expect(toCalmFileName('meridian.calm.json')).toBe('meridian.calm.json');
		expect(toCalmFileName('My File.calm.json')).toBe('my_file.calm.json');
	});

	test('replaces a plain .json extension', () => {
		expect(toCalmFileName('report.json')).toBe('report.calm.json');
	});

	test('strips a lone .calm extension', () => {
		expect(toCalmFileName('payments.calm')).toBe('payments.calm.json');
	});

	test('strips directory segments (POSIX and Windows)', () => {
		expect(toCalmFileName('/home/me/My Diagram.calm.json')).toBe('my_diagram.calm.json');
		expect(toCalmFileName('C:\\docs\\Cool Arch.json')).toBe('cool_arch.calm.json');
	});

	test('falls back to architecture when nothing usable remains', () => {
		expect(toCalmFileName('')).toBe('architecture.calm.json');
		expect(toCalmFileName(null)).toBe('architecture.calm.json');
		expect(toCalmFileName('   ')).toBe('architecture.calm.json');
		expect(toCalmFileName('.calm.json')).toBe('architecture.calm.json');
	});

	test('is idempotent', () => {
		const once = toCalmFileName('Some Mixed Name');
		expect(toCalmFileName(once)).toBe(once);
	});
});
