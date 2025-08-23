/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosError } from 'axios';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import { 
  mockLoginResponse, 
  mockUser, 
  mockCourses, 
  mockApiCall 
} from './mockData';

// Types for API responses
export interface LoginResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
}

export interface User {
  id: number;
  displayName: string;
  username: string;
  email: string;
  active: boolean;
  person: {
    id: number;
    firstName: string;
    lastName: string;
    displayName: string;
    birthDate: number;
    phoneNumber: string;
    email: string;
  };
  roles: Array<{
    id: number;
    name: string;
    authority: string;
  }>;
}

// Interface for the API response from /api/semester/{semesterId}/subjects
export interface Courses {
  createDate: null | string;
  createdBy: null | string;
  modifyDate: null | string;
  modifiedBy: null | string;
  id: null | number;
  voided: boolean;
  studentId: number;
  semesterId: null | number;
  periodId: number;
  classId: null | number;
  student: null | any; // Replace 'any' with a specific type if you know the structure
  courseRegisterViewObject: CourseRegisterViewObject;
  studentSubjectMarks: null | any; // Replace 'any' with a specific type if you know the structure
  listEduProgram: null | any[]; // Replace 'any' with a specific type if you know the structure
  listStudentCourseSubject: null | any[];
}

export interface CourseRegisterViewObject {
  isAllowUnRegister: boolean;
  startDate: number;
  endDate: number;
  startDateString: string;
  endDateString: string;
  startUnDate: null | number;
  endUnDate: null | number;
  startUnDateString: null | string;
  endUnDateString: null | string;
  listSubjectRegistrationDtos: SubjectRegistrationDto[];
  isDuplicated: null | boolean;
  listOldCs: CourseSubjectDto[];
  allowRegister: boolean;
}

export interface SubjectRegistrationDto {
  subjectName: string;
  registerPeriodId: number;
  hasParaSubject: boolean;
  isForcedRegType: boolean;
  paraSubjects: null | any;
  dependSubjectNames: null | string[];
  courseSubjectDtos: CourseSubjectDto[];
  isAllowSubjectUnRegister: boolean;
  hasSubjectReg: null | boolean;
  isUpgradeMark: null | boolean;
  id: number;
}

export interface CourseSubjectDto {
  createDate: null | string;
  createdBy: null | string;
  modifyDate: null | string;
  modifiedBy: null | string;
  id: number;
  voided: boolean;
  code: string;
  shortCode: string;
  subjectId: number;
  subjectName: null | string;
  subjectCode: null | string;
  parent: null | any;
  subCourseSubjects: null | CourseSubjectDto[];
  isUsingConfig: boolean;
  isFullClass: boolean;
  courseSubjectConfigs: null | any;
  timetables: Timetable[];
  semesterSubject: null | any;
  maxStudent: number;
  minStudent: number;
  numberStudent: number;
  courseSubjectType: null | any;
  learningSkillId: null | number;
  learningSkillName: null | string;
  learningSkillCode: null | string;
  isSelected: boolean;
  children: null | any;
  hashCourseSubjects: any;
  expanded: boolean;
  isGrantAll: boolean;
  isDeniedAll: boolean;
  trainingBase: null | any;
  isOvelapTime: boolean | null;
  overLapClasses: string[];
  courseYearId: null | number;
  courseYearCode: null | string;
  courseYearName: null | string;
  displayName: string;
  numberOfCredit: number;
  isFeeByCourseSubject: null | boolean;
  feePerCredit: null | number;
  tuitionCoefficient: null | number;
  totalFee: null | number;
  feePerStudent: null | number;
  enrollmentClassId: null | number;
  enrollmentClassCode: null | string;
  numberHours: null | number;
  teacher: null | any;
  teacherName: null | string;
  teacherCode: null | string;
  startDate: null | number;
  endDate: null | number;
  learningMethod: null | any;
  status: number;
  subjectExams: null | any;
  semesterId: null | number;
  semesterCode: null | string;
  periodId: null | number;
  periodName: null | string;
  username: null | string;
  actionTime: null | string;
  logContent: null | string;
  numberSubCourseSubject: number;
  numberLearningSkill: number;
  check: boolean;
}

export interface Timetable {
  id: number;
  endHour: Hour | null;
  startHour: Hour | null;
  teacher: Teacher | null;
  assistantTeacher: null | Teacher;
  room: Room | null;
  weekIndex: number;
  fromWeek: number;
  toWeek: number;
  start: string;
  end: string;
  teacherName: string | null;
  roomName: string | null;
  roomCode: null | string;
  staffCode: null | string;
  assistantStaffCode: null | string;
  courseHourseStartCode: number;
  courseHourseEndCode: number;
  numberHours: null | number;
  startDate: number;
  endDate: number;
  subjectName: null | string;
  courseSubjectCode: null | string;
  courseSubjectId: number | null;
}

export interface Hour {
  id: number;
  name: string;
  start: number | null;
  startString: string | null;
  end: number | null;
  endString: string | null;
  indexNumber: number;
  type: null | any;
}

export interface Teacher {
  createDate: null | string;
  createdBy: null | string;
  modifyDate: null | string;
  modifiedBy: null | string;
  id: number;
  firstName: null | string;
  lastName: null | string;
  displayName: string;
  shortName: null | string;
  birthDate: null | string;
  birthDateString: null | string;
  birthPlace: null | string;
  gender: null | number;
  startDate: null | string;
  endDate: null | string;
  phoneNumber: null | string;
  idNumber: null | string;
  idNumberIssueBy: null | string;
  idNumberIssueDate: null | string;
  idNumberIssueDateString: null | string;
  email: null | string;
  nationality: null | string;
  nativeVillage: null | string;
  ethnics: null | string;
  religion: null | string;
  photo: null | string;
  photoCropped: null | string;
  address: any[];
  userId: null | number;
  communistYouthUnionJoinDate: null | string;
  communistYouthUnionJoinDateString: null | string;
  communistPartyJoinDate: null | string;
  communistPartyJoinDateString: null | string;
  carrer: null | string;
  createIp: null | string;
  modifyIp: null | string;
  staffCode: string;
  positions: any[];
  agreements: any[];
  user: null | any;
  currentCell: null | any;
}

// Interface for room details
export interface Room {
  id: number;
  name: string;
  code: string;
  capacity: null | number;
  examCapacity: null | number;
  building: null | any;
  dupName: null | string;
  dupCode: null | string;
  duplicate: boolean;
}

export interface RegistrationResponse {
  success: boolean;
  message: string;
  courseSubjectId?: number;
}

export interface SemesterInfo {
  id: number;
  semesterCode: string;
  semesterName: string;
  description: string | null;
  schoolYear: {
    id: number;
    name: string;
    code: string;
    year: number;
    current: boolean | null;
    startDate: number;
    endDate: number;
    children: unknown[] | null;
    displayName: string | null;
    semesterId: number | null;
    isSemester: number;
    semesters: unknown[] | null;
  };
  year: number | null;
  startDate: number;
  endDate: number;
  isCurrent: boolean;
  parent: unknown | null;
  children: unknown[];
  subSemesters: unknown[] | null;
  tuitionFeePerCredit: number | null;
  startRegisterDate: number | null;
  startRegisterDateString: string | null;
  endRegisterDate: number | null;
  endRegisterDateString: string | null;
  isLockRegister: boolean | null;
  ordinalNumbers: number;
  behaviorMarkStart: number | null;
  behaviorMarkEnd: number | null;
  semesterRegisterPeriods: Array<{
    createDate: string | null;
    createdBy: string | null;
    modifyDate: string | null;
    modifiedBy: string | null;
    id: number;
    voided: boolean;
    semester: unknown;
    name: string;
    displayOrder: number;
    startRegisterTime: number | null;
    endRegisterTime: number | null;
    endUnRegisterTime: number | null;
    startRegisterTimeString: string | null;
    endRegisterTimeString: string | null;
    endUnRegisterTimeString: string | null;
    isLockRegister: boolean | null;
    examPeriods: unknown[];
  }>;
  examRegisterPeriods: unknown[] | null;
  typeMarkRecognition: number;
  educationStart: number | null;
  educationEnd: number | null;
  studentStart: number | null;
  studentEnd: number | null;
  trainingBaseId: number | null;
}

// Base API configuration
const BASE_URL = 'https://sinhvien1.tlu.edu.vn/education';
const USE_MOCK_DATA = false; // Set to false to use real API (course listing now integrated)

class ApiService {
  private axiosInstance: AxiosInstance;
  private retryCount = 5;
  private baseRetryDelay = 1000; // 1 second

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor with intelligent retry mechanism
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const config = error.config as AxiosRequestConfig & { _retryCount?: number };
        
        // Check if this is a retryable error
        const isRetryableError = this.isRetryableError(error);
        const hasRetriesLeft = (config._retryCount || 0) < this.retryCount;
        
        if (isRetryableError && hasRetriesLeft && config) {
          config._retryCount = (config._retryCount || 0) + 1;
          
          // Calculate exponential backoff delay
          const delay = this.baseRetryDelay * Math.pow(2, config._retryCount - 1);
          
          // Log retry attempt
          console.log(`Retrying request (attempt ${config._retryCount}/${this.retryCount}) after ${delay}ms delay`);
          
          // Wait before retrying
          await this.delay(delay);
          
          // Retry the request
          return this.axiosInstance.request(config);
        }
        
        return Promise.reject(error);
      }
    );
  }

  private isRetryableError(error: AxiosError): boolean {
    // Network errors or server errors (5xx)
    if (!error.response) return true; // Network error
    
    const status = error.response.status;
    return status >= 500 || status === 429; // Server errors or rate limiting
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Authentication methods
  async login(username: string, password: string): Promise<LoginResponse> {
    // For development, use mock data
    if (USE_MOCK_DATA) {
      if (username === 'demo' && password === 'demo') {
        const response = await mockApiCall(mockLoginResponse);
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('refresh_token', response.refresh_token);
        return response;
      } else {
        throw new Error('Invalid credentials. Use demo/demo for testing.');
      }
    }

    // Real API call
    try {
      // Create form data as the API expects application/x-www-form-urlencoded
      const formData = new URLSearchParams();
      formData.append('client_id', 'education_client');
      formData.append('grant_type', 'password');
      formData.append('username', username);
      formData.append('password', password);
      formData.append('client_secret', 'password');

      const response = await this.axiosInstance.post('/oauth/token', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      
      // Store token in localStorage
      if (response.data.access_token) {
        localStorage.setItem('access_token', response.data.access_token);
        localStorage.setItem('refresh_token', response.data.refresh_token);
      }
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<User> {
    if (USE_MOCK_DATA) {
      return await mockApiCall(mockUser);
    }

    const response = await this.axiosInstance.get('/api/users/getCurrentUser');
    return response.data;
  }

  async logout(): Promise<void> {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  async getCurrentSemesterInfo(): Promise<SemesterInfo> {
    if (USE_MOCK_DATA) {
      // Return mock semester info for development
      const mockSemesterInfo: SemesterInfo = {
        id: 13,
        semesterCode: "1_2025_2026",
        semesterName: "1_2025_2026",
        description: null,
        schoolYear: {
          id: 7,
          name: "2025-2026",
          code: "2025-2026",
          year: 2025,
          current: true,
          startDate: 1756659600000,
          endDate: 1788022800000,
          children: null,
          displayName: "2025-2026",
          semesterId: null,
          isSemester: 0,
          semesters: null
        },
        year: null,
        startDate: 1756659600000,
        endDate: 1768669200000,
        isCurrent: true,
        parent: null,
        children: [],
        subSemesters: null,
        tuitionFeePerCredit: null,
        startRegisterDate: null,
        startRegisterDateString: null,
        endRegisterDate: null,
        endRegisterDateString: null,
        isLockRegister: null,
        ordinalNumbers: 13,
        behaviorMarkStart: null,
        behaviorMarkEnd: null,
        semesterRegisterPeriods: [
          {
            createDate: null,
            createdBy: null,
            modifyDate: null,
            modifiedBy: null,
            id: 65,
            voided: false,
            semester: {},
            name: "Học kỳ chính",
            displayOrder: 1,
            startRegisterTime: null,
            endRegisterTime: null,
            endUnRegisterTime: null,
            startRegisterTimeString: null,
            endRegisterTimeString: null,
            endUnRegisterTimeString: null,
            isLockRegister: null,
            examPeriods: []
          }
        ],
        examRegisterPeriods: null,
        typeMarkRecognition: 1,
        educationStart: null,
        educationEnd: null,
        studentStart: null,
        studentEnd: null,
        trainingBaseId: null
      };
      
      return await mockApiCall(mockSemesterInfo);
    }

    const response = await this.axiosInstance.get('/api/semester/semester_info');
    return response.data;
  }

  // Course management methods
  async getAvailableCourses(registrationPeriodId: number): Promise<Courses> {
    if (USE_MOCK_DATA) {
      // Simulate some network delay
      return await mockApiCall(mockCourses);
    }

    try {
      console.log(`Fetching courses for registration period ID: ${registrationPeriodId}`);
      const user = await this.getCurrentUser();
      const personId = user.person.id;
      const response = await this.axiosInstance.get<Courses>(`/api/cs_reg_mongo/findByPeriod/${personId}/${registrationPeriodId}`);

      console.log(`Received ${JSON.stringify(response.data, null, 2).length} courses from API`);
      
      // Transform the API response to match our Course interface
      const courses: Courses = response.data;
      return courses;
    } catch (error) {
      console.error('Error fetching courses:', error);
      // Fallback to mock data if API fails
      console.log('Falling back to mock data due to API error');
      return await mockApiCall(mockCourses);
    }
  }

  // Registration methods
  // Note: Registration APIs still use the actual semester ID, not the registration period ID
  async registerForCourse(courseSubjectId: number, semesterId: number): Promise<RegistrationResponse> {
    if (USE_MOCK_DATA) {
      // Simulate registration with some randomness for testing
      const success = Math.random() > 0.3; // 70% success rate for testing
      
      if (success) {
        await mockApiCall({ success: true });
        return {
          success: true,
          message: 'Successfully registered for course',
          courseSubjectId
        };
      } else {
        return {
          success: false,
          message: 'Course is full or registration failed',
          courseSubjectId
        };
      }
    }

    try {
      await this.axiosInstance.post('/api/StudentCourseSubject/register', {
        courseSubjectId,
        semesterId
      });
      
      return {
        success: true,
        message: 'Successfully registered for course',
        courseSubjectId
      };
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return {
        success: false,
        message: axiosError.response?.data?.message || axiosError.message || 'Registration failed',
        courseSubjectId
      };
    }
  }

  // Note: Unregistration APIs still use the actual semester ID, not the registration period ID
  async unregisterFromCourse(courseSubjectId: number, semesterId: number): Promise<RegistrationResponse> {
    if (USE_MOCK_DATA) {
      await mockApiCall({ success: true });
      return {
        success: true,
        message: 'Successfully unregistered from course',
        courseSubjectId
      };
    }

    try {
      await this.axiosInstance.delete('/api/StudentCourseSubject/unregister', {
        data: { courseSubjectId, semesterId }
      });
      
      return {
        success: true,
        message: 'Successfully unregistered from course',
        courseSubjectId
      };
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return {
        success: false,
        message: axiosError.response?.data?.message || axiosError.message || 'Unregistration failed',
        courseSubjectId
      };
    }
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
