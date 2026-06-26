// SPDX-FileCopyrightText: 2026 CalmStudio Contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import CollapsibleSection from '$lib/properties/CollapsibleSection.svelte';

// Snippets can't be written inline in a .ts test, so build them programmatically.
// Each renders a single uniquely-queryable root element.
const bodySnippet = createRawSnippet(() => ({
	render: () => `<div data-testid="body">BODY</div>`,
}));
const indicatorSnippet = createRawSnippet(() => ({
	render: () => `<span data-testid="indicator">linked</span>`,
}));

const toggle = (c: HTMLElement) => c.querySelector('.section-toggle') as HTMLButtonElement;

describe('CollapsibleSection', () => {
	it('renders the label', () => {
		const { getByText } = render(CollapsibleSection, { props: { label: 'Requirements' } });
		expect(getByText('Requirements')).toBeTruthy();
	});

	it('starts collapsed: body hidden, aria-expanded=false', () => {
		const { container, queryByTestId } = render(CollapsibleSection, {
			props: { label: 'Custom', children: bodySnippet },
		});
		expect(queryByTestId('body')).toBeNull();
		expect(toggle(container).getAttribute('aria-expanded')).toBe('false');
	});

	it('toggles open and closed on click', async () => {
		const { container, queryByTestId } = render(CollapsibleSection, {
			props: { label: 'Custom', children: bodySnippet },
		});
		const btn = toggle(container);

		await fireEvent.click(btn);
		expect(queryByTestId('body')).not.toBeNull();
		expect(btn.getAttribute('aria-expanded')).toBe('true');

		await fireEvent.click(btn);
		expect(queryByTestId('body')).toBeNull();
		expect(btn.getAttribute('aria-expanded')).toBe('false');
	});

	it('honours a controlled expanded=true (the already-linked auto-open path)', () => {
		const { container, queryByTestId } = render(CollapsibleSection, {
			props: { label: 'Define System Contents', expanded: true, children: bodySnippet },
		});
		expect(queryByTestId('body')).not.toBeNull();
		expect(toggle(container).getAttribute('aria-expanded')).toBe('true');
	});

	it('shows the count badge only when count > 0', () => {
		const none = render(CollapsibleSection, { props: { label: 'Guidance', count: 0 } });
		expect(none.container.querySelector('.badge')).toBeNull();

		const some = render(CollapsibleSection, { props: { label: 'Guidance', count: 3 } });
		expect(some.container.querySelector('.badge')?.textContent).toBe('3');
	});

	it('renders the indicator snippet in the header', () => {
		const { getByTestId } = render(CollapsibleSection, {
			props: { label: 'Define System Contents', indicator: indicatorSnippet },
		});
		expect(getByTestId('indicator')).toBeTruthy();
	});
});
