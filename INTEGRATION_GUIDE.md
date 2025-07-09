# Integration Guide

## What is this?
This is a TypeScript library for gamepad navigation and UI control. It is intended to be used as a dependency in your own web projects. The repository also includes a Vite-powered example/demo project in the `examples/` folder for live testing and experimentation.

## How to Integrate

### 1. Build and Package the Library
In the root directory:
```sh
npm run build
npm pack
```
This will generate a file like `gamepad-controller-1.0.0.tgz`.

### 2. Install in Your Project
In your own project (or in the `examples/` Vite demo):
```sh
npm install /path/to/gamepad-controller-1.0.0.tgz
```

### 3. Import and Use
```ts
import { gamepadService, initDualContextGamepad } from 'gamepad-controller';
```

### 4. Try the Examples
- Go to the `examples/` folder.
- Install dependencies and the local package:
  ```sh
  npm install
  npm install ../gamepad-controller-1.0.0.tgz
  npm run dev
  ```
- Open your browser at `http://localhost:5173/pages/home-page/index.html` or any other example page.

## About the Examples
- All example pages and scripts are in `examples/pages/`.
- You can edit or add new examples to test your own use cases.

## Notes
- This is a library, not a standalone app.
- The Vite example project is for development and demonstration purposes.

## License
MIT 