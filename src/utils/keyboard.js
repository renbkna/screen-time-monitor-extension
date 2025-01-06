export function makeAccessible(element, role) {
  if (!element) return;
  if (role) element.setAttribute('role', role);
  element.setAttribute('tabindex', '0');
  
  // Add keyboard event listeners
  element.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      element.click();
    }
  });
}

export function setupKeyboardNavigation(container) {
  if (!container) return;
  
  const focusableElements = container.querySelectorAll('[tabindex="0"]');
  if (focusableElements.length === 0) return;
  
  let currentFocusIndex = 0;
  
  container.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        // Move backwards
        currentFocusIndex--;
        if (currentFocusIndex < 0) {
          currentFocusIndex = focusableElements.length - 1;
        }
      } else {
        // Move forwards
        currentFocusIndex++;
        if (currentFocusIndex >= focusableElements.length) {
          currentFocusIndex = 0;
        }
      }
      focusableElements[currentFocusIndex].focus();
    }
  });
}