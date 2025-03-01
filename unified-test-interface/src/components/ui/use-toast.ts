// Simplified toast implementation
export const toast = ({
  title = '',
  description = '',
  variant = 'default',
  duration = 3000,
}) => {
  // Create toast element
  const toastEl = document.createElement('div');
  toastEl.className = `fixed top-4 right-4 z-50 rounded-md p-4 shadow-md transition-all duration-300 ease-in-out transform translate-x-0 max-w-sm
    ${variant === 'destructive' ? 'bg-destructive text-destructive-foreground' : 'bg-background text-foreground'}`;
  
  // Create title
  if (title) {
    const titleEl = document.createElement('h5');
    titleEl.className = 'font-medium text-sm';
    titleEl.textContent = title;
    toastEl.appendChild(titleEl);
  }
  
  // Create description
  if (description) {
    const descEl = document.createElement('div');
    descEl.className = 'text-xs mt-1';
    descEl.textContent = description;
    toastEl.appendChild(descEl);
  }
  
  // Add to document
  document.body.appendChild(toastEl);
  
  // Animate in
  setTimeout(() => {
    toastEl.style.opacity = '1';
  }, 10);
  
  // Remove after duration
  setTimeout(() => {
    toastEl.style.opacity = '0';
    setTimeout(() => {
      toastEl.remove();
    }, 300);
  }, duration);
}; 