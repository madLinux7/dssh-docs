// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightThemeTerminal from 'starlight-theme-terminal'

// https://astro.build/config
export default defineConfig({
	site: 'https://dssh.grolmes.com',
	integrations: [
		starlight({
			plugins: [starlightThemeTerminal()],
			title: 'dssh',
			customCss: ['./src/styles/custom.css'],
			head: [
				{
					tag: 'script',
					content: `
						try {
							var key = 'starlight-synced-tabs__installers';
							if (!localStorage.getItem(key)) {
								var p = (navigator.userAgentData && navigator.userAgentData.platform
									|| navigator.platform || navigator.userAgent).toLowerCase();
								var label = null;
								if (p.indexOf('win') !== -1) label = 'winget';
								else if (p.indexOf('mac') !== -1 || p.indexOf('iphone') !== -1
									|| p.indexOf('ipad') !== -1 || p.indexOf('darwin') !== -1) label = 'Homebrew';
								else if (p.indexOf('linux') !== -1 || p.indexOf('x11') !== -1
									|| p.indexOf('bsd') !== -1) label = 'AUR';
								if (label) localStorage.setItem(key, label);
							}
						} catch (e) {}
					`,
				},
			],
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/madLinux7/dssh' }],
			sidebar: [
				{ label: 'Get started', slug: 'getting-started' },
				{
					label: 'Guides',
					items: [
						{ label: 'Security model', slug: 'guides/security' },
						{ label: 'Migration', slug: 'guides/migration' },
						{ label: 'Troubleshooting', slug: 'guides/troubleshooting' },
						{ label: 'FAQ', slug: 'guides/faq' },
					],
				},
				{
					label: 'Reference',
					items: [
						{ label: 'Commands', slug: 'reference/commands' },
						{ label: 'TUI keybindings', slug: 'reference/tui-keys' },
						{ label: 'Configuration', slug: 'reference/config' },
						{ label: 'Limitations', slug: 'reference/limitations' },
					],
				},
				{ label: 'Contributing', slug: 'contributing' },
			],
		}),
	],
});
