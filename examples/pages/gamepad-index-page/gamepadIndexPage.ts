import { initDualContextGamepad, gamepadUtils } from "gamepad-controller";

// Global gamepad service instance
let gamepad: any = null;
let useGamepadIndexEnabled = true;

document.addEventListener("DOMContentLoaded", () => {
  initializeGamepad();
  gamepadUtils.addStyles();
  setupEventListeners();

  console.log("🎯 Gamepad-Index Boolean Demo initialized");
  console.log("💡 Use your gamepad to test selective element focusing!");
});

function initializeGamepad() {
  // Destroy existing instance if any
  if (gamepad) {
    gamepad.destroy();
  }

  // Create new gamepad service with dual context and gamepad-index boolean filtering
  gamepad = initDualContextGamepad({
    // Dual context configuration
    enableDualContext: true,
    menuContextSelector: '.controls',        // R1/L1 navigation
    contentContextSelector: '.container',    // Stick navigation (whole page)
    
    // Navigation settings
    navigationMode: "spatial",
    focusedClass: "gamepad-focused",
    selectedClass: "gamepad-selected",
    statusElementId: "gamepad-status",
    useDataAttributes: false,
    useGamepadIndex: useGamepadIndexEnabled,
    wrapNavigation: true,
    autoDetectElements: true,
    enableNavigation: true,
    enableBackButton: true,
    enableShoulderNavigation: true,
  });

  updateToggleButton();
}

function setupEventListeners() {
  // Handle form submission
  const form = document.querySelector(".form-demo") as HTMLFormElement;
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      showMessage("Form submitted successfully!");
    });
  }

  // Add keyboard support for better testing
  document.addEventListener("keydown", (e) => {
    if (
      e.target instanceof HTMLElement &&
      (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
    ) {
      return; // Don't interfere with form input
    }

    if (e.key === "Enter" || e.key === " ") {
      const focused = document.querySelector(".gamepad-focused");
      if (focused instanceof HTMLElement) {
        e.preventDefault();
        focused.click();
      }
    }
  });
}

// Control functions
function toggleGamepadIndex() {
  useGamepadIndexEnabled = !useGamepadIndexEnabled;
  console.log(
    `🔄 Gamepad-Index ${useGamepadIndexEnabled ? "ENABLED" : "DISABLED"}`
  );

  // Reinitialize gamepad with new setting
  initializeGamepad();

  updateToggleButton();

  // Show visual feedback
  const message = useGamepadIndexEnabled
    ? '🎯 Gamepad-Index ENABLED - Only elements with gamepad-index="true" are focusable!'
    : "❌ Gamepad-Index DISABLED - All normally focusable elements are included!";

  showTemporaryMessage(message);
}

function refreshNavigation() {
  if (gamepad) {
    gamepad.refresh();
    console.log("🔄 Navigation refreshed");
    showTemporaryMessage("🔄 Navigation refreshed!");
  }
}

function showNavigationOrder() {
  if (!gamepad) {
    showMessage("Gamepad service not initialized");
    return;
  }

  const elements = gamepad.getElements();
  let orderInfo = `📋 Navigation Elements (${
    useGamepadIndexEnabled
      ? "Boolean Filter ENABLED"
      : "Boolean Filter DISABLED"
  }):\n\n`;

  elements.forEach((element: Element, index: number) => {
    const hasGamepadIndex = element.hasAttribute("gamepad-index");
    const gamepadIndexValue = element.getAttribute("gamepad-index");
    const tagName = element.tagName.toLowerCase();
    const text =
      element.textContent?.slice(0, 40) +
      (element.textContent && element.textContent.length > 40 ? "..." : "");

    const filterInfo = useGamepadIndexEnabled
      ? ` (${
          hasGamepadIndex
            ? `gamepad-index="${gamepadIndexValue}"`
            : "no gamepad-index"
        })`
      : "";

    orderInfo += `${index + 1}. ${tagName}${filterInfo}\n   "${text}"\n\n`;
  });

  if (useGamepadIndexEnabled) {
    orderInfo += `\n💡 When gamepad-index is enabled, only elements with gamepad-index="true" are included.`;
  } else {
    orderInfo += `\n💡 When gamepad-index is disabled, all normally focusable elements are included.`;
  }

  alert(orderInfo);
  console.log(orderInfo);
}

function updateToggleButton() {
  const toggleBtn = document.getElementById("toggle-btn");
  if (toggleBtn) {
    const status = useGamepadIndexEnabled ? "ON" : "OFF";
    const emoji = useGamepadIndexEnabled ? "🎯" : "❌";
    toggleBtn.textContent = `${emoji} Toggle Gamepad-Index (Currently: ${status})`;
    toggleBtn.style.backgroundColor = useGamepadIndexEnabled
      ? "#27ae60"
      : "#e74c3c";
    toggleBtn.style.color = "white";
    toggleBtn.style.borderColor = useGamepadIndexEnabled
      ? "#27ae60"
      : "#e74c3c";
  }
}

function showTemporaryMessage(message: string) {
  const messageDiv = document.createElement("div");
  messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #333;
        color: white;
        padding: 1rem 2rem;
        border-radius: 8px;
        font-weight: bold;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease;
    `;
  messageDiv.textContent = message;

  document.body.appendChild(messageDiv);

  setTimeout(() => {
    messageDiv.style.animation = "slideOut 0.3s ease";
    setTimeout(() => {
      document.body.removeChild(messageDiv);
    }, 300);
  }, 3000);
}

// Make functions available globally
(window as any).toggleGamepadIndex = toggleGamepadIndex;
(window as any).refreshNavigation = refreshNavigation;
(window as any).showNavigationOrder = showNavigationOrder;

// Enhanced showMessage function
function showMessage(message: string) {
  const enhancedMessages: Record<string, string> = {
    "Focusable Button 1":
      '✅ Focusable Button 1 selected! (has gamepad-index="true")',
    "Focusable Button 2":
      '✅ Focusable Button 2 selected! (has gamepad-index="true")',
    "Focusable Button 3":
      '✅ Focusable Button 3 selected! (has gamepad-index="true")',
    "Not Focusable Button 1":
      "❌ Not Focusable Button 1 (no gamepad-index attribute)",
    "Not Focusable Button 2":
      "❌ Not Focusable Button 2 (no gamepad-index attribute)",
    "Focusable Card 1":
      '✅ Focusable Card 1 selected! (has gamepad-index="true")',
    "Focusable Card 2":
      '✅ Focusable Card 2 selected! (has gamepad-index="true")',
    "Not Focusable Card 1":
      "❌ Not Focusable Card 1 (no gamepad-index attribute)",
    "Not Focusable Card 2":
      "❌ Not Focusable Card 2 (no gamepad-index attribute)",
    "Form submitted successfully!": "✅ Form submission completed!",
  };

  const displayMessage =
    enhancedMessages[message] || `You selected: ${message}`;
  alert(displayMessage);
  console.log(`💬 ${displayMessage}`);
}

(window as any).showMessage = showMessage;
