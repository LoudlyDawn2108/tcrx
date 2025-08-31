# Request Abort Implementation

This implementation adds request abort functionality to handle cases where components unmount during API calls, such as when users logout while requests are in progress.

## Key Features

1. **AbortController Integration**: All API methods now accept an optional `AbortSignal` parameter
2. **Automatic Cleanup**: Custom hooks automatically clean up ongoing requests when components unmount
3. **Intelligent Retry Logic**: Retry mechanism respects abort signals and doesn't retry cancelled requests
4. **Store-Level Management**: Each store manages its own abort controller

## Implementation Details

### API Service Changes

```typescript
// All API methods now accept an optional AbortSignal
async getAvailableCourses(registrationPeriodId: number, personId: number, signal?: AbortSignal): Promise<SemesterPeriodData>
async registerForCourse(courseSubjectId: number, semesterId: number, signal?: AbortSignal): Promise<RegistrationResponse>
```

### Store-Level Abort Controllers

Each store maintains its own `AbortController`:

```typescript
interface CourseState {
  // ... other state
  abortController: AbortController | null;
  abortRequests: () => void;
}
```

### Custom Cleanup Hooks

```typescript
// Clean up all requests
useRequestCleanup()

// Clean up specific store requests
useCourseRequestCleanup()
useSemesterRequestCleanup()
useRegistrationRequestCleanup()
```

### Component Usage

```typescript
const CourseList: React.FC<CourseListProps> = ({ semesterId }) => {
  // Automatically clean up course requests when component unmounts
  useCourseRequestCleanup();
  
  // ... rest of component
};
```

### Logout Integration

The auth store automatically cleans up all ongoing requests when logging out:

```typescript
logout: () => {
  // Clean up all ongoing requests before logging out
  // ... cleanup code
  
  apiService.logout();
  // ... rest of logout
}
```

## Error Handling

The implementation properly handles different types of errors:

1. **Cancelled Requests**: Don't update state or show errors for cancelled requests
2. **Network Errors**: Continue with retry logic for legitimate network errors
3. **Server Errors**: Retry server errors but respect abort signals

## Usage Examples

### Basic Component Cleanup
```typescript
const MyComponent = () => {
  useRequestCleanup(); // Cleans up all requests on unmount
  
  return <div>My Component</div>;
};
```

### Manual Abort
```typescript
const { abortRequests } = useCourseStore();

// Manually abort ongoing course requests
const handleAbort = () => {
  abortRequests();
};
```

### Registration Process Abort
```typescript
const { abortRegistration } = useRegistrationStore();

// Abort ongoing registration process
const handleStopRegistration = () => {
  abortRegistration();
};
```

## Benefits

1. **Prevents Memory Leaks**: No more callbacks from unmounted components
2. **Cleaner User Experience**: No error messages from requests that were cancelled due to navigation
3. **Resource Efficiency**: Saves bandwidth and server resources by cancelling unnecessary requests
4. **Better Error Handling**: Distinguishes between legitimate errors and cancelled requests

## Testing

To test the abort functionality:

1. Start a course fetch operation
2. Quickly logout or navigate away
3. The request should be cancelled and no state updates should occur
4. No error messages should appear for the cancelled request
