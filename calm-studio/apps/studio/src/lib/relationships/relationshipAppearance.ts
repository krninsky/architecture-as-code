// SPDX-FileCopyrightText: 2026 CalmStudio Contributors
// SPDX-License-Identifier: Apache-2.0

/**
 * Effective relationship appearance (R96).
 * Relationship metadata wins, then the type default, then solid / bezier / tooltip.
 */

export type LineStyle = 'solid' | 'dashed' | 'dotted';
export type EdgeRouting = 'bezier' | 'smoothstep' | 'straight';
export type DescriptionDisplay = 'tooltip' | 'label';

export interface RelationshipAppearance {
	lineStyle: LineStyle;
	routing: EdgeRouting;
	lineColor?: string;
	textColor?: string;
	descriptionDisplay: DescriptionDisplay;
}

const LINE_STYLES = new Set<LineStyle>(['solid', 'dashed', 'dotted']);
const ROUTINGS = new Set<EdgeRouting>(['bezier', 'smoothstep', 'straight']);
const DISPLAYS = new Set<DescriptionDisplay>(['tooltip', 'label']);
const HEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;

export const APPEARANCE_KEYS = [
	'line-style',
	'routing',
	'line-color',
	'text-color',
	'description-display',
] as const;

export function dasharrayFor(lineStyle: LineStyle): string | undefined {
	if (lineStyle === 'dashed') return '8 4';
	if (lineStyle === 'dotted') return '2 4';
	return undefined;
}

function pickEnum<T extends string>(value: unknown, allowed: Set<T>): T | undefined {
	return typeof value === 'string' && allowed.has(value as T) ? (value as T) : undefined;
}

function pickColor(value: unknown): string | undefined {
	return typeof value === 'string' && HEX.test(value) ? value : undefined;
}

/** Resolve one relationship's paint from its metadata and the type default. */
export function resolveAppearance(
	metadata: Record<string, unknown> | undefined,
	typeDefaults: Record<string, unknown> | undefined,
): RelationshipAppearance {
	const lineStyle =
		pickEnum(metadata?.['line-style'], LINE_STYLES) ??
		pickEnum(typeDefaults?.['line-style'], LINE_STYLES) ??
		'solid';
	const routing =
		pickEnum(metadata?.routing, ROUTINGS) ??
		pickEnum(typeDefaults?.routing, ROUTINGS) ??
		'bezier';
	const descriptionDisplay =
		pickEnum(metadata?.['description-display'], DISPLAYS) ??
		pickEnum(typeDefaults?.['description-display'], DISPLAYS) ??
		'tooltip';
	const lineColor = pickColor(metadata?.['line-color']) ?? pickColor(typeDefaults?.['line-color']);
	const textColor = pickColor(metadata?.['text-color']) ?? pickColor(typeDefaults?.['text-color']);
	return {
		lineStyle,
		routing,
		descriptionDisplay,
		...(lineColor ? { lineColor } : {}),
		...(textColor ? { textColor } : {}),
	};
}

/** Copy type defaults onto metadata only for keys the relationship does not already have. */
export function mergeMissingMetadata(
	metadata: Record<string, unknown> | undefined,
	defaults: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
	if (!defaults) return metadata;
	const next: Record<string, unknown> = { ...(metadata ?? {}) };
	for (const [key, value] of Object.entries(defaults)) {
		if (next[key] === undefined) next[key] = value;
	}
	return Object.keys(next).length > 0 ? next : undefined;
}
