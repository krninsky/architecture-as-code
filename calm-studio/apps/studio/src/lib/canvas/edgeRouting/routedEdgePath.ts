// SPDX-FileCopyrightText: 2026 CalmStudio Contributors
//
// SPDX-License-Identifier: Apache-2.0

/**
 * routedEdgePath.ts — shared obstacle-aware edge path helper (R23).
 */

import type { Node, Position } from '@xyflow/svelte';
import {
	collectNodeObstacles,
	relationshipObstacleExclusions,
	routeEdgeOrthogonal,
	type HandlePosition,
} from './obstacleRouter';
import { orthogonalPathToBezier } from './bezierPath';
import type { EdgeRouting } from '$lib/relationships/relationshipAppearance';

export const CANVAS_NODES_CONTEXT = 'calm-canvas-nodes';

export type CanvasNodesGetter = () => Node[];

function toHandlePosition(pos: Position | string | undefined): HandlePosition {
	if (pos === 'top' || pos === 'bottom' || pos === 'left' || pos === 'right') return pos;
	return 'right';
}

/**
 * Compute an obstacle-aware orthogonal path for an edge.
 * Returns [path, labelX, labelY] matching getSmoothStepPath shape.
 */
export function getRoutedEdgePath(
	nodes: Node[],
	args: {
		sourceX: number;
		sourceY: number;
		targetX: number;
		targetY: number;
		sourcePosition?: Position | string;
		targetPosition?: Position | string;
		sourceId?: string;
		targetId?: string;
		routing?: EdgeRouting;
	}
): [string, number, number] {
	const routing = args.routing ?? 'bezier';
	if (routing === 'straight') {
		return [
			`M ${args.sourceX},${args.sourceY} L ${args.targetX},${args.targetY}`,
			(args.sourceX + args.targetX) / 2,
			(args.sourceY + args.targetY) / 2,
		];
	}
	const exclude = relationshipObstacleExclusions(nodes, args.sourceId, args.targetId);
	const obstacles = collectNodeObstacles(nodes, exclude, 0);
	const result = routeEdgeOrthogonal({
		source: {
			x: args.sourceX,
			y: args.sourceY,
			position: toHandlePosition(args.sourcePosition),
		},
		target: {
			x: args.targetX,
			y: args.targetY,
			position: toHandlePosition(args.targetPosition),
		},
		obstacles,
		padding: 8,
	});
	const path = routing === 'smoothstep' ? result.path : orthogonalPathToBezier(result.path);
	return [path, result.labelX, result.labelY];
}
