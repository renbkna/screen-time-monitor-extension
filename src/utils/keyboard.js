/**
 * Keyboard shortcuts and accessibility utilities
 */

// Shortcut mappings
const SHORTCUTS = {
  'alt+f': 'toggleFocus',
  'alt+s': 'showStats',
  'alt+l': 'showLimits',
  'alt+q': 'quickFocus',
  'esc': 'closePopup'
};

// Register keyboard shortcuts
export function registerShortcuts(handlers) {
  document.addEventListener('keydown', (e) => {
    // Get key combination
    const key = e.key.toLowerCase();
    const combo = [];
    if (e.altKey) combo.push('alt');
    if (e.ctrlKey) combo.push('ctrl');
    if (e.shiftKey) combo.push('shift');
    combo.push(key);
    
    const shortcut = combo.join('+');
    const action = SHORTCUTS[shortcut];

    if (action && handlers[action]) {
      e.preventDefault();
      handlers[action]();
    }
  });
}

// Add ARIA attributes and keyboard navigation
export function makeAccessible(element, options = {}) {
  const {
    role,
    label,
    description,
    controls,
    expanded,
    selected,
    tabIndex = 0
  } = options;

  if (role) element.setAttribute('role', role);
  if (label) element.setAttribute('aria-label', label);
  if (description) element.setAttribute('aria-description', description);
  if (controls) element.setAttribute('aria-controls', controls);
  if (expanded !== undefined) element.setAttribute('aria-expanded', expanded);
  if (selected !== undefined) element.setAttribute('aria-selected', selected);
  if (tabIndex !== undefined) element.setAttribute('tabindex', tabIndex);

  // Add keyboard interaction for clickable elements
  if (role === 'button' || role === 'tab' || role === 'menuitem') {
    element.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        element.click();
      }
    });
  }
}

// Make focusable elements keyboard navigable
export function setupKeyboardNavigation(container, selector) {
  const elements = container.querySelectorAll(selector);
  
  elements.forEach((element, index) => {
    element.addEventListener('keydown', (e) => {
      let nextElement;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          nextElement = elements[index + 1] || elements[0];
          break;

        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          nextElement = elements[index - 1] || elements[elements.length - 1];
          break;

        case 'Home':
          e.preventDefault();
          nextElement = elements[0];
          break;

        case 'End':
          e.preventDefault();
          nextElement = elements[elements.length - 1];
          break;
      }

      if (nextElement) {
        nextElement.focus();
      }
    });
  });
}
