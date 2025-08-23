// Mock data for development/testing purposes
export const mockLoginResponse = {
  access_token: "mock-access-token-12345",
  token_type: "bearer",
  refresh_token: "mock-refresh-token-67890",
  expires_in: 82518,
  scope: "read write delete"
};

export const mockUser = {
  id: 38482,
  displayName: "Test Student",
  username: "testuser",
  email: "testuser@e.tlu.edu.vn",
  active: true,
  person: {
    id: 75659,
    firstName: "Test",
    lastName: "Student",
    displayName: "Test Student",
    birthDate: 1129309200000,
    phoneNumber: "0123456789",
    email: "testuser@e.tlu.edu.vn",
  },
  roles: [
    {
      id: 7,
      name: "ROLE_STUDENT",
      authority: "ROLE_STUDENT"
    }
  ]
};

export const mockCourses = [
  {
    id: 1,
    subjectName: "Advanced Software Engineering",
    subjectCode: "SE301",
    numberOfCredit: 3,
    isSelected: false,
    status: 'available' as const
  },
  {
    id: 2,
    subjectName: "Database Management Systems",
    subjectCode: "DB201",
    numberOfCredit: 3,
    isSelected: false,
    status: 'available' as const
  },
  {
    id: 3,
    subjectName: "Web Development",
    subjectCode: "WEB101",
    numberOfCredit: 4,
    isSelected: false,
    status: 'available' as const
  },
  {
    id: 4,
    subjectName: "Machine Learning Basics",
    subjectCode: "ML101",
    numberOfCredit: 3,
    isSelected: false,
    status: 'available' as const
  },
  {
    id: 5,
    subjectName: "Network Security",
    subjectCode: "NS201",
    numberOfCredit: 3,
    isSelected: false,
    status: 'full' as const
  }
];

export const mockEnrolledCourses = [
  {
    id: 100,
    courseSubject: {
      id: 6,
      subjectName: "Introduction to Programming",
      subjectCode: "PROG101",
      numberOfCredit: 4
    },
    semesterId: 13,
    enrollmentClass: {
      classCode: "PROG101-01",
      teacher: "Dr. John Smith"
    }
  }
];

// Mock API responses with realistic delays
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApiCall = async <T>(data: T, shouldFail = false, delayMs = 500): Promise<T> => {
  await delay(delayMs);
  
  if (shouldFail) {
    throw new Error('Mock API error for testing');
  }
  
  return data;
};
