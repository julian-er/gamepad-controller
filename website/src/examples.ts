import vanillaGuide from '../../docs/USAGE_VANILLA.md?raw';
import reactGuide from '../../docs/USAGE_REACT.md?raw';
import angularGuide from '../../docs/USAGE_ANGULAR.md?raw';

function setupCode(guide: string): string {
    const code = /```(?:js|ts|tsx)\r?\n([\s\S]*?)```/.exec(guide)?.[1];
    if (!code) throw new Error('Framework guide is missing its setup example');
    return code.trimEnd();
}

export type Framework = 'vanilla' | 'react' | 'angular';
export type Example = { code: string; filename: string; note?: string };
export type Examples = Partial<Record<Framework, Example>>;
export const frameworks: { id: Framework; label: string }[] = [
    { id: 'vanilla', label: 'Vanilla TS' },
    { id: 'react', label: 'React' },
    { id: 'angular', label: 'Angular' },
];

export const vanillaExamples: Examples = {
    vanilla: {
        filename: 'catalog.ts',
        note: 'Also valid JavaScript: save as catalog.js. Use an ES-module bundler and call mountCatalog after rendering the container. Call the returned cleanup when removing the view.',
        code: setupCode(vanillaGuide),
    },
};

export const reactExamples: Examples = {
    react: {
        filename: 'Catalog.tsx',
        code: setupCode(reactGuide),
    },
};

export const angularExamples: Examples = {
    angular: {
        filename: 'catalog.component.ts',
        note: 'This is an application-owned component. No Angular wrapper or directive is exported by gamepad-controller. Mount one catalog instance at a time with this unique container ID.',
        code: setupCode(angularGuide),
    },
};

export const integrationExamples: Examples = {
    vanilla: {
        filename: 'catalog.ts',
        note: 'Also valid JavaScript: save as catalog.js. Use an ES-module bundler and call mountCatalog after rendering the container. Call the returned cleanup when removing the view.',
        code: setupCode(vanillaGuide),
    },
    react: {
        filename: 'Catalog.tsx',
        code: setupCode(reactGuide),
    },
    angular: {
        filename: 'catalog.component.ts',
        note: 'This is an application-owned component. No Angular wrapper or directive is exported by gamepad-controller. Mount one catalog instance at a time with this unique container ID.',
        code: setupCode(angularGuide),
    },
};

// The package has a single framework-neutral API. Keep fragments identical
// where the operation is identical, and explain the owning lifecycle explicitly.
export function sharedExamples(code: string): Examples {
    const imports = code.match(/^import[\s\S]*?;\s*$/gm) ?? [];
    const fragment = imports.reduce((text, statement) => text.replace(statement, ''), code).trim();
    if (/^(?:const|let) service\s*=\s*new GamepadService\(/m.test(fragment) && !/service\.destroy\(/.test(fragment)) {
        const header = [
            ...(imports.some((s) => /\bGamepadService\b/.test(s))
                ? []
                : ["import { GamepadService } from 'gamepad-controller';"]),
            ...imports,
        ].join('\n');
        const setup = fragment;
        const initialized = /service\.init\(/.test(setup) ? setup : setup + '\nservice.init();';
        const containerId = /containerSelector:\s*['"]#([\w-]+)['"]/.exec(initialized)?.[1] ?? 'catalog';
        const indent = (text: string, spaces: number) =>
            text
                .split('\n')
                .map((line) => ' '.repeat(spaces) + line)
                .join('\n');
        return {
            vanilla: {
                filename: 'navigation.ts',
                note: `Render #${containerId} with focusable controls first. Replace feature-specific selectors with your own rendered elements. Call the returned cleanup when removing this view.`,
                code:
                    header +
                    '\n\nexport function mountNavigation() {\n' +
                    indent(initialized, 2) +
                    '\n  return () => service.destroy();\n}',
            },
            react: {
                filename: 'Navigation.tsx',
                note: 'Use a unique container per mounted instance. Replace feature-specific selectors with your rendered elements. Recreate the effect when its owned container changes.',
                code:
                    "import { useEffect } from 'react';\n" +
                    header +
                    '\n\nexport function Navigation() {\n  useEffect(() => {\n' +
                    indent(initialized, 4) +
                    '\n    return () => service.destroy();\n  }, []);\n  return <main id="' +
                    containerId +
                    '"><button>Play</button><button>Library</button></main>;\n}',
            },
            angular: {
                filename: 'navigation.component.ts',
                note: 'Application-owned component. Replace feature-specific selectors with your rendered elements; run operations triggered by later UI changes after Angular renders those changes.',
                code:
                    "import { AfterViewInit, Component, OnDestroy } from '@angular/core';\n" +
                    header +
                    "\n\n@Component({\n  selector: 'app-navigation', standalone: true,\n  template: '<main id=\"" +
                    containerId +
                    '"><button>Play</button><button>Library</button></main>\',\n})\nexport class NavigationComponent implements AfterViewInit, OnDestroy {\n  private dispose?: () => void;\n  ngAfterViewInit(): void {\n' +
                    indent(initialized, 4) +
                    '\n    this.dispose = () => service.destroy();\n  }\n  ngOnDestroy(): void { this.dispose?.(); }\n}',
            },
        };
    }
    return {
        vanilla: {
            code,
            filename: 'navigation.ts',
            note: 'Shared API fragment; keep the execution order shown. Use with your owned service after rendering the DOM; destroy it when the view is removed. Imports belong at module scope.',
        },
        react: {
            code,
            filename: 'navigation.tsx',
            note: 'Shared API fragment; keep the execution order shown. Put imports at module scope and service setup/subscriptions in useEffect; return cleanup that calls service.destroy(). Run DOM updates after React commits them.',
        },
        angular: {
            code,
            filename: 'navigation.component.ts',
            note: 'Shared API fragment; keep the execution order shown. Put imports at module scope and service setup/subscriptions in ngAfterViewInit. Here service refers to your component-owned GamepadService; destroy it in ngOnDestroy.',
        },
    };
}
