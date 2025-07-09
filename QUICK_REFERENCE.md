# Gamepad Navigation - Quick Reference

## 🚀 5-Minute Integration

### Step 1: Add Files
```
your-project/
├── gamepadService.js
├── gamepadServiceModel.js
├── gamepadUtils.js
└── controllerMappings.js
```

### Step 2: Initialize (Choose One)

```javascript
// Option 1: Zero config (recommended)
import { initGamepadForPage } from './dist/gamepadService.js';
initGamepadForPage();

// Option 2: Custom config
import { initGamepadNavigation } from './gamepadService.js';
const gamepad = initGamepadNavigation({
    useDataAttributes: true,
    autoAddStyles: false
});
```

### Step 3: Style (Optional)
```css
/* Add to your CSS */
[data-gamepad-focused="true"] {
    outline: 2px solid #007bff;
}
```

**Done!** 🎮 Your app now has gamepad navigation.

## 🔧 Framework Integration

### React
```jsx
import { useEffect } from 'react';

function App() {
    useEffect(() => {
        import('./dist/gamepadService.js').then(({ initGamepadForPage }) => {
            initGamepadForPage();
        });
    }, []);
    
    return <div>Your app</div>;
}
```

### Angular
```typescript
// app.component.ts
async ngOnInit() {
    const { initGamepadForPage } = await import('./dist/gamepadService.js');
    initGamepadForPage();
}
```

### Vue.js
```vue
<script setup>
import { onMounted } from 'vue';

onMounted(async () => {
    const { initGamepadForPage } = await import('./dist/gamepadService.js');
    initGamepadForPage();
});
</script>
```

## 🎨 Styling Options

### Option 1: No Styles (Default)
```javascript
initGamepadForPage(); // Navigation works, no visual changes
```

### Option 2: Data Attributes
```javascript
initGamepadForPage({ useDataAttributes: true });
```
```css
[data-gamepad-focused="true"] { /* Your styles */ }
```

### Option 3: CSS Classes
```javascript
initGamepadForPage({ 
    useDataAttributes: false,
    focusedClass: 'my-focus'
});
```
```css
.my-focus { /* Your styles */ }
```

### Option 4: Built-in Styles
```javascript
initGamepadForPage({ autoAddStyles: true });
```

## 🎮 Controls

| Button | Action |
|--------|--------|
| D-pad/Stick | Navigate |
| A/Cross | Select |
| B/Circle | Back |
| R1/L1 | Page nav |

## 🔧 Common Patterns

### SPA Route Changes
```javascript
// React Router
useEffect(() => {
    import('./dist/gamepadService.js').then(({ gamepadUtils }) => {
        gamepadUtils.refresh();
    });
}, [location]);
```

### Dynamic Content
```javascript
// After content changes
import { gamepadUtils } from './dist/gamepadService.js';
gamepadUtils.refresh();
```

### Event Handlers
```javascript
const gamepad = initGamepadNavigation();

gamepad.onFocus = (element, index) => {
    console.log('Focused:', element);
};

gamepad.onSelect = (element, index) => {
    element.click(); // Trigger existing handlers
};
```

## 🔍 Debugging

### Console Logs
- Controller connection messages
- Navigation events
- Element detection

### Debug Tools
```javascript
import { gamepadUtils } from './dist/gamepadService.js';

// Print CSS examples
gamepadUtils.printCSSExamples();

// Get current state
const info = gamepadUtils.getNavigationInfo();
```

### Test Page
Visit `debug-test.html` for comprehensive testing.

## 📱 Server Setup

**Required**: Local server (not `file://`)

```bash
# VS Code: Install Live Server extension
# Then: Right-click → "Open with Live Server"

# Or command line:
npx http-server
python3 -m http.server
php -S localhost:8000
```

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| Module errors | Use local server |
| Controller not detected | Press any button |
| Navigation not working | Check if elements are focusable |
| Style conflicts | Use `useDataAttributes: true` |

## 📚 Full Documentation

- **README.md** - Complete overview
- **USAGE_GUIDE.md** - Detailed usage guide
- **INTEGRATION_GUIDE.md** - Framework integration
- **Examples/** - Working examples

## 🎯 Next Steps

1. **Test**: Connect controller and test navigation
2. **Style**: Add your custom focus styles
3. **Integrate**: Add to your framework/app
4. **Customize**: Configure options as needed
5. **Deploy**: Works in production as-is

---

**Questions?** Check the debug console or visit the example files! 🎮✨ 