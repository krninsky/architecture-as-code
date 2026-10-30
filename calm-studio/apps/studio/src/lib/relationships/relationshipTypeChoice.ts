// SPDX-FileCopyrightText: 2026 CalmStudio Contributors
// SPDX-License-Identifier: Apache-2.0

/**
 * Relationship-type combobox (R97): core CALM variants plus enabled pack types.
 */

import type { CalmRelationshipVariant } from '@calmstudio/calm-core';
import { getAllPacks, type RelationshipTypeEntry } from '@calmstudio/extensions';
import { buildRelationshipTypeForVariant } from '$lib/metadata/relationshipVariantSync';
import { APPEARANCE_KEYS, mergeMissingMetadata } from './relationshipAppearance';
import { relationshipTypeRecord, soleRelationshipKey } from './optionsRelationship';

const CORE: { value: CalmRelationshipVariant; label: string }[] = [
	{ value: 'connects', label: 'connects' },
	{ value: 'interacts', label: 'interacts' },
	{ value: 'deployed-in', label: 'deployed-in' },
	{ value: 'composed-of', label: 'composed-of' },
	{ value: 'options', label: 'options' },
];

const CORE_KEYS = new Set<string>(CORE.map((item) => item.value));

export interface RelationshipTypeChoice {
	value: string;
	label: string;
}

export function findRelationshipTypeEntry(typeId: string): RelationshipTypeEntry | undefined {
	for (const pack of getAllPacks()) {
		const found = pack.relationships?.find((rel) => rel.typeId === typeId);
		if (found) return found;
	}
	return undefined;
}

export function relationshipTypeChoices(currentKey: string | undefined): RelationshipTypeChoice[] {
	const options: RelationshipTypeChoice[] = CORE.map((item) => ({ ...item }));
	const seen = new Set(options.map((item) => item.value));
	for (const pack of getAllPacks()) {
		for (const rel of pack.relationships ?? []) {
			if (seen.has(rel.typeId)) continue;
			seen.add(rel.typeId);
			options.push({ value: rel.typeId, label: rel.label });
		}
	}
	if (currentKey && !seen.has(currentKey)) {
		options.push({ value: currentKey, label: currentKey });
	}
	return options;
}

export function appearanceDefaultsForType(typeId: string): Record<string, unknown> | undefined {
	return findRelationshipTypeEntry(typeId)?.defaults?.metadata;
}

function hasAppearanceDefault(metadata: Record<string, unknown> | undefined): boolean {
	if (!metadata) return false;
	return APPEARANCE_KEYS.some((key) => metadata[key] !== undefined);
}

function metadataRecord(value: unknown): Record<string, unknown> | undefined {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
	return value as Record<string, unknown>;
}

/** Pack type id for a short relationship name such as `impacts-new`. */
function defaultsForRelationshipName(name: string): Record<string, unknown> | undefined {
	const direct = appearanceDefaultsForType(name);
	if (hasAppearanceDefault(direct)) return direct;
	for (const pack of getAllPacks()) {
		const typeId = name.startsWith(`${pack.id}:`) ? name : `${pack.id}:${name}`;
		const defaults = appearanceDefaultsForType(typeId);
		if (hasAppearanceDefault(defaults)) return defaults;
	}
	return undefined;
}

/**
 * Appearance defaults for a drawn relationship.
 * The CALM key (`connects`) often has none. DIFA stores the real type in
 * `metadata.<pack>.relationship`, and a delta on an ordinary relationship in `metadata.wp.impact`.
 */
export function appearanceDefaultsForEdge(
	typeKey: string | undefined,
	metadata: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
	if (typeKey) {
		const fromKey = appearanceDefaultsForType(typeKey);
		if (hasAppearanceDefault(fromKey)) return fromKey;
	}
	if (metadata) {
		for (const pack of getAllPacks()) {
			const name = metadataRecord(metadata[pack.id])?.relationship;
			if (typeof name !== 'string' || name.length === 0) continue;
			const typeId = name.includes(':') ? name : `${pack.id}:${name}`;
			const defaults = defaultsForRelationshipName(typeId);
			if (defaults) return defaults;
		}
		const impact = metadataRecord(metadata.wp)?.impact;
		if (typeof impact === 'string' && impact.length > 0) {
			const defaults = defaultsForRelationshipName(impact);
			if (defaults) return defaults;
		}
	}
	return typeKey ? appearanceDefaultsForType(typeKey) : undefined;
}

export interface ChosenRelationshipType {
	relationshipType: Record<string, unknown>;
	canvasVariant: CalmRelationshipVariant;
	/** Set when the stored key is not the canvas variant (custom options body). */
	preserveType: boolean;
}

/** Build the `relationship-type` object for a combobox value. */
export function relationshipTypeForChoice(
	typeId: string,
	source: string,
	target: string,
): ChosenRelationshipType {
	if (CORE_KEYS.has(typeId)) {
		const variant = typeId as CalmRelationshipVariant;
		return {
			relationshipType: buildRelationshipTypeForVariant(variant, source, target) as unknown as Record<
				string,
				unknown
			>,
			canvasVariant: variant,
			preserveType: false,
		};
	}
	const variant = findRelationshipTypeEntry(typeId)?.calmCoreVariant ?? 'options';
	if (variant === 'options') {
		return {
			relationshipType: {
				[typeId]: [{ description: '', nodes: [source, target], relationships: [] }],
			},
			canvasVariant: 'options',
			preserveType: true,
		};
	}
	return {
		relationshipType: buildRelationshipTypeForVariant(variant, source, target) as unknown as Record<
			string,
			unknown
		>,
		canvasVariant: variant,
		preserveType: false,
	};
}

function archimateRecord(metadata: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
	const arch = metadata?.archimate;
	if (!arch || typeof arch !== 'object' || Array.isArray(arch)) return undefined;
	return arch as Record<string, unknown>;
}

/**
 * Metadata written with a relationship-type choice so the selected type survives in JSON.
 * ArchiMate types keep the CALM core body and store the name under `metadata.archimate.relationship`.
 * A core choice clears that name so the JSON key matches the combobox.
 */
export function metadataForRelationshipChoice(
	metadata: Record<string, unknown> | undefined,
	typeId: string,
	canvasVariant: string,
): Record<string, unknown> | undefined {
	const base = metadata ? { ...metadata } : {};
	const arch = archimateRecord(base);

	if (typeId.startsWith('archimate:')) {
		const name = typeId.slice('archimate:'.length);
		base.archimate = {
			...(arch ?? {}),
			relationship: name,
			'calm-core-variant': canvasVariant,
		};
		return base;
	}

	if (CORE_KEYS.has(typeId) && arch && typeof arch.relationship === 'string') {
		const next = { ...arch };
		delete next.relationship;
		next['calm-core-variant'] = canvasVariant;
		base.archimate = next;
		return base;
	}

	return undefined;
}

/** Combobox value: ArchiMate metadata name when set, otherwise the relationship-type key. */
export function storedRelationshipTypeKey(
	relationshipType: unknown,
	metadata: Record<string, unknown> | undefined,
): string | null {
	const name = archimateRecord(metadata)?.relationship;
	if (typeof name === 'string' && name.length > 0) {
		return name.startsWith('archimate:') ? name : `archimate:${name}`;
	}
	const raw = relationshipTypeRecord(relationshipType);
	return raw ? soleRelationshipKey(raw) : null;
}

const VISUAL_KEYS = new Set<string>(APPEARANCE_KEYS);

/**
 * Copy non-visual type defaults onto a new relationship.
 * Line style, routing, colors, and description display stay on the extension
 * and are applied only while that extension is loaded.
 */
export function metadataWithTypeDefaults(
	metadata: Record<string, unknown> | undefined,
	typeId: string,
): Record<string, unknown> | undefined {
	const defaults = appearanceDefaultsForType(typeId);
	if (!defaults) return metadata;
	const persistable: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(defaults)) {
		if (VISUAL_KEYS.has(key)) continue;
		persistable[key] = value;
	}
	return mergeMissingMetadata(metadata, persistable);
}
