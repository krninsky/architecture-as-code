<!-- SPDX-FileCopyrightText: 2026 CalmStudio Contributors -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

<script lang="ts">
	import { EdgeLabel } from '@xyflow/svelte';

	let {
		edgeId,
		kind,
		lineColor,
		description = '',
		descriptionDisplay = 'tooltip',
		textColor,
		labelX,
		labelY,
		hovered = false,
	}: {
		edgeId: string;
		kind: 'filled' | 'open' | 'diamond-filled' | 'diamond-open';
		lineColor?: string;
		description?: string;
		descriptionDisplay?: 'tooltip' | 'label';
		textColor?: string;
		labelX: number;
		labelY: number;
		hovered?: boolean;
	} = $props();

	const markerDomId = $derived(`calm-marker-${kind}-${edgeId.replace(/[^a-zA-Z0-9_-]/g, '_')}`);
	const showLabel = $derived(descriptionDisplay === 'label' && description.length > 0);
	const showTooltip = $derived(descriptionDisplay === 'tooltip' && hovered && description.length > 0);
</script>

{#if lineColor}
	<defs>
		<marker
			id={markerDomId}
			markerWidth={kind.startsWith('diamond') ? 12 : 10}
			markerHeight={kind.startsWith('diamond') ? 8 : 7}
			refX={kind.startsWith('diamond') ? 11 : 9}
			refY={kind.startsWith('diamond') ? 4 : 3.5}
			orient="auto-start-reverse"
		>
			{#if kind === 'filled'}
				<polygon points="0 0, 10 3.5, 0 7" fill={lineColor} />
			{:else if kind === 'open'}
				<polyline points="0 0, 9 3.5, 0 7" fill="none" stroke={lineColor} stroke-width="1.5" />
			{:else if kind === 'diamond-filled'}
				<polygon points="0 4, 5.5 0, 11 4, 5.5 8" fill={lineColor} />
			{:else}
				<polygon points="0 4, 5.5 0, 11 4, 5.5 8" fill="none" stroke={lineColor} stroke-width="1.5" />
			{/if}
		</marker>
	</defs>
{/if}

<g role="presentation">
	{#if showLabel || showTooltip}
		<EdgeLabel x={labelX} y={showTooltip ? labelY - 16 : labelY} class="nodrag nopan">
			<span class="desc" style:color={textColor}>{description}</span>
		</EdgeLabel>
	{/if}
</g>

<style>
	.desc {
		display: inline-block;
		padding: 1px 5px;
		border-radius: 3px;
		background: var(--bg-widget, #fff);
		border: 1px solid var(--border, #ccc);
		font-size: 9px;
		pointer-events: none;
	}
</style>
