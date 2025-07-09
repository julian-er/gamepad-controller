# Gamepad Controller

Gamepad Controller is a TypeScript library for advanced gamepad navigation and UI control in web applications. It supports dual context navigation, custom mapping, and is compatible with Xbox, PlayStation, Nintendo, and generic controllers.

## Features
- Dual context navigation (menu/content)
- Customizable navigation modes
- TypeScript support and type declarations
- Works with Xbox, PlayStation, Nintendo, and generic gamepads
- Modern, modular codebase

## Usage
Install via npm (after packaging, see below):
```sh
npm install ./gamepad-controller-1.0.0.tgz
# or from npm if published
# npm install gamepad-controller
```

Import in your project:
```ts
import { gamepadService, initDualContextGamepad } from 'gamepad-controller';
```

## Example Project (Vite)
This repository includes a Vite-based example/demo project in the `examples/` folder. You can:

1. Build the library in the root folder:
   ```sh
   npm run build
   ```
2. Pack the library as a tarball:
   ```sh
   npm pack
   ```
   This creates `gamepad-controller-1.0.0.tgz`.
3. Go to the examples folder and install dependencies:
   ```sh
   cd examples
   npm install
   npm install ../gamepad-controller-1.0.0.tgz
   ```
4. Start the Vite dev server:
   ```sh
   npm run dev
   ```
5. Open your browser at `http://localhost:5173/pages/home-page/index.html` or any other example page.

## Packaging for Use in Other Projects
To use this library in any project without publishing to npm:
1. Run `npm run build` in the root folder.
2. Run `npm pack` to generate the `.tgz` package file.
3. In your target project, run:
   ```sh
   npm install /path/to/gamepad-controller-1.0.0.tgz
   ```
4. Import and use as shown above.

## Development
- Source code is in `src/`
- TypeScript types are generated in `dist/types/`
- Example/demo code is in `examples/pages/`

## License
MIT