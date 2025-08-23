# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

# TLU Course Registration Client

A modern, intelligent client for university course registration that solves common problems like server overload, poor failure handling, and inefficient workflows.

## Features

### 🔄 Intelligent Automatic Retry Mechanism
- Automatically retries failed requests due to network errors, timeouts, or server errors
- Uses exponential backoff strategy (1s, 2s, 4s, 8s...)
- Maximum 5 retries per request with clear user feedback

### 📚 Efficient Bulk Course Registration
- Select multiple courses with checkboxes
- Register for all selected courses with a single button
- Sequential registration to avoid overwhelming the server

### ⏰ Pre-Registration Queuing & Scheduling
- Add courses to queue before registration starts
- Automatic execution when registration window opens
- Real-time countdown timer to registration start

### 📊 Transparent Real-time Log View
- Live log of all registration activities
- Shows timestamp, course info, status, and error messages
- Track retry attempts and success/failure rates

## How to Use

### Development/Demo Mode

The application is currently set to use mock data for development and testing. 

**Demo Credentials:**
- Username: `demo`
- Password: `demo`

### Getting Started

1. **Start the application:**
   ```bash
   npm run dev
   ```

2. **Login:**
   - Use `demo`/`demo` for testing
   - The app will show a modern login interface

3. **Select Courses:**
   - Browse available courses in the main list
   - Use checkboxes to select multiple courses
   - Use "Select All" / "Deselect All" for convenience

4. **Registration Options:**
   
   **If registration is open:**
   - Click "Register Selected Courses" for immediate registration
   
   **If registration hasn't started:**
   - Click "Add to Registration Queue"
   - Courses will automatically register when the window opens
   - Watch the countdown timer

5. **Monitor Progress:**
   - Check the log panel for real-time updates
   - See retry attempts, successes, and failures
   - Track overall registration statistics

## Configuration

### Registration Times
Edit `src/stores/registrationStore.ts`:

```typescript
export const REGISTRATION_START_TIME = new Date('2025-08-25T08:00:00');
export const REGISTRATION_END_TIME = new Date('2025-08-25T23:59:59');
```

### Switch to Real API
Edit `src/services/api.ts`:

```typescript
const USE_MOCK_DATA = false; // Set to false for production
```

### Server Configuration
Update the base URL in `src/services/api.ts`:

```typescript
const BASE_URL = 'https://your-university-api.edu/education';
```

## Technical Architecture

### State Management (Zustand)
- **authStore**: User authentication and session management
- **courseStore**: Course data and selection state
- **logStore**: Registration activity logging
- **registrationStore**: Queue management and timing

### API Service Layer
- Centralized Axios instance with interceptors
- Intelligent retry mechanism with exponential backoff
- Support for both mock and real API data
- Proper error handling and logging

### Components
- **LoginPage**: Authentication interface
- **DashboardPage**: Main application layout
- **CourseList**: Course browsing and selection
- **RegistrationControls**: Registration actions and queue management
- **LogView**: Real-time activity monitoring

## Key Benefits

1. **Reduces Server Load**: Sequential requests and intelligent retries
2. **Better User Experience**: Bulk operations and automatic queue processing
3. **Reliability**: Handles network failures gracefully
4. **Transparency**: Clear feedback on all operations
5. **Efficiency**: Pre-registration queuing saves time during peak hours

## Development Notes

- Built with React 19, TypeScript, and Tailwind CSS
- Uses Zustand for lightweight state management
- Axios for HTTP requests with retry interceptors
- Responsive design for desktop and mobile

## Future Enhancements

- Push notifications for registration updates
- Course scheduling conflict detection
- Waitlist management
- Integration with university calendar systems
- Advanced filtering and search capabilities

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
