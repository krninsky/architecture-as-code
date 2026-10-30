// SPDX-FileCopyrightText: 2026 CalmStudio Contributors
// SPDX-License-Identifier: Apache-2.0

import { appearanceDefaultsForEdge } from '$lib/relationships/relationshipTypeChoice';
import {
	dasharrayFor,
	resolveAppearance,
	type RelationshipAppearance,
} from '$lib/relationships/relationshipAppearance';

export function appearanceForEdgeData(data: Record<string, unknown> | undefined): RelationshipAppearance {
	const metadata = data?.metadata;
	const typeKey = typeof data?.relationshipTypeKey === 'string' ? data.relationshipTypeKey : undefined;
	const meta = metadata && typeof metadata === 'object' ? (metadata as Record<string, unknown>) : undefined;
	return resolveAppearance(meta, appearanceDefaultsForEdge(typeKey, meta));
}

export function paintStyle(
	appearance: RelationshipAppearance,
	baseStyle: string | undefined,
	validationStyle: string | undefined,
): string | undefined {
	const parts: string[] = [];
	if (appearance.lineColor) parts.push(`stroke: ${appearance.lineColor}`);
	const dash = dasharrayFor(appearance.lineStyle);
	if (dash) parts.push(`stroke-dasharray: ${dash}`);
	if (baseStyle) parts.push(baseStyle);
	if (validationStyle) parts.push(validationStyle);
	return parts.length > 0 ? parts.join('; ') : undefined;
}

export function markerId(kind: string, edgeId: string): string {
	return `calm-marker-${kind}-${edgeId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
}
