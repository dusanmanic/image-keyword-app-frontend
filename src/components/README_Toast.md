# Toast Component Usage Guide

## Overview
The Toast component is a reusable notification system that can be used throughout the application to display success, error, warning, and info messages.

## Files
- `Toast.jsx` - The main Toast component
- `useToast.js` - Custom hook for managing toast state and actions

## Basic Usage

### 1. Import the components
```jsx
import ToastComponent from "../components/Toast";
import { useToast } from "../hooks/useToast";
```

### 2. Use the hook in your component
```jsx
function MyComponent() {
  const { toasts, success, error, warning, info, removeToast } = useToast();
  
  // Your component logic here
  
  return (
    <div>
      {/* Your component content */}
      <ToastComponent toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
```

## Available Methods

### Hook Methods
- `success(message, options)` - Show success toast (green)
- `error(message, options)` - Show error toast (red)
- `warning(message, options)` - Show warning toast (orange)
- `info(message, options)` - Show info toast (blue)
- `addToast(message, options)` - Add custom toast
- `removeToast(id)` - Remove specific toast
- `clearAllToasts()` - Remove all toasts

### Options
```jsx
{
  type: 'success' | 'error' | 'warning' | 'info', // Default: 'success'
  icon: '✅', // Custom icon (optional)
  duration: 3000, // Auto-remove after milliseconds (0 = no auto-remove)
  closable: true // Show close button (default: true)
}
```

## Examples

### Basic Usage
```jsx
const { success, error } = useToast();

// Success message
success('File uploaded successfully!');

// Error message
error('Upload failed. Please try again.');

// Warning message
warning('This action cannot be undone.');

// Info message
info('Processing your request...');
```

### Advanced Usage
```jsx
const { addToast, success } = useToast();

// Custom toast with options
addToast('Custom message', {
  type: 'info',
  icon: '🔔',
  duration: 5000,
  closable: false
});

// Success with custom duration
success('Data saved!', { duration: 2000 });

// Error with custom icon
error('Network error', { icon: '🌐' });
```

### Legacy showToast Function
If you have existing `showToast` function, you can easily migrate:

```jsx
// Old way
const showToast = (msg) => {
  setToast(msg);
  setTimeout(() => setToast(""), 1500);
};

// New way
const { success, error, warning, info } = useToast();

const showToast = (msg, type = 'success') => {
  if (type === 'success') success(msg);
  else if (type === 'error') error(msg);
  else if (type === 'warning') warning(msg);
  else if (type === 'info') info(msg);
  else success(msg);
};
```

## Styling
The Toast component uses styled-components with predefined styles for each type:
- **Success**: Green gradient background
- **Error**: Red gradient background  
- **Warning**: Orange gradient background
- **Info**: Blue gradient background

## Features
- ✅ Multiple toast types (success, error, warning, info)
- ✅ Custom icons and durations
- ✅ Auto-remove after specified time
- ✅ Manual close button
- ✅ Smooth animations (slide in/out)
- ✅ Responsive design
- ✅ Z-index management
- ✅ Multiple toasts support

## Migration from toastBus
If you're migrating from the old `toastBus` system:

1. Replace `toastBus.emit('toast', message)` with `success(message)`
2. Remove old toast state management
3. Add `<ToastComponent toasts={toasts} onRemove={removeToast} />` to your JSX
4. Import the new components

## Best Practices
- Use appropriate toast types for different scenarios
- Keep messages concise and clear
- Use custom durations for important messages
- Consider using icons to make messages more recognizable
- Don't overuse toasts - they should provide value, not noise
