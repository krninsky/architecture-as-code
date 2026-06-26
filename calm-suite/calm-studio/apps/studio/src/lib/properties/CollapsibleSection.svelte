<!-- SPDX-FileCopyrightText: 2026 CalmStudio Contributors -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

<!--
  CollapsibleSection.svelte — the shared foldable inspector-section chrome: a
  chevron toggle, an uppercase label, an optional count badge, and a body that
  renders only while expanded. Property-panel sections (Requirements, Guidance,
  Custom decorators, Define System Contents, …) wrap their body content in this
  so the toggle markup and styling live in exactly one place.

  `expanded` is $bindable so a consumer that wants a non-default initial state
  (e.g. open when a value is already present) can `bind:expanded`. Pass an
  `indicator` snippet for a non-numeric header marker (e.g. a "linked" dot) in
  place of the count badge.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		label,
		count = 0,
		expanded = $bindable(false),
		indicator,
		children,
	}: {
		label: string;
		count?: number;
		expanded?: boolean;
		indicator?: Snippet;
		children?: Snippet;
	} = $props();
</script>

<div class="section">
	<button type="button" class="section-toggle" onclick={() => (expanded = !expanded)} aria-expanded={expanded}>
		<span class="chevron" class:open={expanded}>
			<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
				<path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
			</svg>
		</span>
		<span class="section-label">{label}</span>
		{#if count > 0}<span class="badge">{count}</span>{/if}
		{@render indicator?.()}
	</button>

	{#if expanded}
		{@render children?.()}
	{/if}
</div>

<style>
	.section {
		border-top: 1px solid var(--color-border, #e2e8f0);
	}

	:global(.dark) .section {
		border-color: #1e293b;
	}

	.section-toggle {
		display: flex;
		align-items: center;
		gap: 6px;
		width: 100%;
		padding: 10px 12px 8px;
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;
	}

	.section-toggle:hover {
		background: var(--color-surface-secondary, #f8fafc);
	}

	:global(.dark) .section-toggle:hover {
		background: #0f172a;
	}

	.chevron {
		display: flex;
		align-items: center;
		color: var(--color-text-tertiary, #94a3b8);
		transition: transform 0.15s;
	}

	.chevron.open {
		transform: rotate(90deg);
	}

	.section-label {
		font-size: 11px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-text-secondary, #64748b);
		flex: 1;
	}

	:global(.dark) .section-label {
		color: #94a3b8;
	}

	.badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 18px;
		height: 18px;
		padding: 0 5px;
		border-radius: 9px;
		font-size: 10px;
		font-weight: 600;
		background: var(--color-surface-secondary, #f1f5f9);
		color: var(--color-text-secondary, #64748b);
	}

	:global(.dark) .badge {
		background: #1e293b;
		color: #94a3b8;
	}
</style>
