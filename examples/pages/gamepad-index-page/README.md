# 🎯 Gamepad-Index Demo Page

This example page demonstrates the `gamepad-index` attribute functionality for custom navigation order control.

## 🌟 Features Demonstrated

### 1. **Basic Navigation Order**
- Buttons with custom `gamepad-index` values
- Shows how elements are navigated in numerical order
- Elements without index appear after indexed ones

### 2. **Form Navigation**
- Strategic form field ordering for better UX
- Demonstrates logical flow: Name → Email → Phone → Company → Comments → Actions

### 3. **Mixed Content Navigation**
- Cards and buttons with strategic navigation order
- Shows how to prioritize important content

### 4. **Negative Indices (High Priority)**
- Using negative values for highest priority elements
- Emergency/Critical actions get immediate focus

### 5. **Interactive Controls**
- Toggle gamepad-index on/off to see the difference
- Refresh navigation functionality
- Show navigation order inspector

## 🎮 How to Test

1. **Connect a gamepad** (Xbox, PlayStation, or Nintendo controller)
2. **Navigate through elements** using D-pad or analog stick
3. **Toggle gamepad-index** using the control button to see the difference
4. **Check console** for detailed navigation info
5. **Use "Show Navigation Order"** to see the current order

## 💡 Key Concepts

- **Indexed Elements**: Navigate first, in numerical order
- **Unindexed Elements**: Follow after indexed elements in DOM order
- **Negative Indices**: Highest priority (perfect for emergency actions)
- **Invalid Indices**: Treated as unindexed elements

## 🔧 Usage in Your Project

```html
<!-- Enable gamepad-index in service options -->
<script>
const gamepad = initGamepadForPage({
    useGamepadIndex: true
});
</script>

<!-- HTML with custom navigation order -->
<button gamepad-index="1">First</button>
<button gamepad-index="3">Third</button>
<button gamepad-index="2">Second</button>
<button>Fourth (no index)</button>
```

## 🚀 Navigation Flow Examples

### Form Example Flow:
1. First Name (index=1)
2. Last Name (index=2)
3. Email (index=3)
4. Phone (index=4)
5. Company (index=5)
6. Comments (index=6)
7. Cancel (index=7)
8. Submit (index=8)

### Priority Example Flow:
1. Critical (index=-2)
2. Emergency (index=-1)
3. Zero (index=0)
4. Normal (index=1)
5. No Index (unindexed)

This logical ordering ensures users navigate through forms and interfaces in the most intuitive way possible! 