import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
// Web-only
import secureApiService from '../services/secureApiService';
// Replace mobile storage with localStorage

// Types
export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  originalRole?: string;
  permissions: Record<string, boolean>;
  dataScopes: string[];
  schoolId?: string;
  department?: string;
  lastLogin?: string;
  isActive: boolean;
  teacherId?: string; // Teacher ID from the teacher table
  managedEntities?: {
    branches?: any[];
    courses?: any[];
    schools?: any[];
  };
  activeSchoolId?: string | null;
  activeBranchId?: string | null;
  activeCourseId?: string | null;
}

export interface ManagedContext {
  schoolId: string | null;
  branchId: string | null;
  courseId: string | null;
}

export interface SetManagedContextOptions {
  skipServerUpdate?: boolean;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string, role?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshAccessToken: (context?: any) => Promise<string>;
  updateUserContext: (context: any) => Promise<void>;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  hasDataScope: (scope: string) => boolean;
  userToken: string | null;
  checkStoredTokens: () => Promise<void>;
  managedContext: ManagedContext;
  setManagedContext: (context: Partial<ManagedContext>, options?: SetManagedContextOptions) => Promise<void>;
}

const MANAGED_CONTEXT_STORAGE_KEY = 'managedContext';
const LAST_SELECTION_CACHE_KEY = 'managedEntities:lastSelection';

const DEFAULT_MANAGED_CONTEXT: ManagedContext = {
  schoolId: null,
  branchId: null,
  courseId: null,
};

const normalizeContextValue = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'undefined') {
      return null;
    }
    return trimmed;
  }
  try {
    return String(value);
  } catch (error) {
    return null;
  }
};

const loadStoredManagedContext = (): ManagedContext => {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_MANAGED_CONTEXT };
  }
  try {
    // First, try to load from LAST_SELECTION_CACHE_KEY (used by ManagedEntitiesTab)
    const lastSelectionRaw = localStorage.getItem(LAST_SELECTION_CACHE_KEY);
    if (lastSelectionRaw) {
      try {
        const lastSelection = JSON.parse(lastSelectionRaw);
        const type = typeof lastSelection?.type === 'string' ? lastSelection.type : null;
        
        if (type === 'school' && lastSelection?.schoolId) {
          return {
            schoolId: normalizeContextValue(lastSelection.schoolId),
            branchId: null,
            courseId: null,
          };
        }
        
        if (type === 'branch' && lastSelection?.branchId) {
          return {
            schoolId: normalizeContextValue(lastSelection.schoolId),
            branchId: normalizeContextValue(lastSelection.branchId),
            courseId: null,
          };
        }
        
        if (type === 'course' && lastSelection?.courseId) {
          return {
            schoolId: normalizeContextValue(lastSelection.schoolId),
            branchId: normalizeContextValue(lastSelection.branchId),
            courseId: normalizeContextValue(lastSelection.courseId),
          };
        }
      } catch (e) {
        // If parsing fails, fall through to MANAGED_CONTEXT_STORAGE_KEY
      }
    }
    
    // Fall back to MANAGED_CONTEXT_STORAGE_KEY
    const stored = localStorage.getItem(MANAGED_CONTEXT_STORAGE_KEY);
    if (!stored) {
      return { ...DEFAULT_MANAGED_CONTEXT };
    }
    const parsed = JSON.parse(stored);
    return {
      schoolId: normalizeContextValue(parsed?.schoolId),
      branchId: normalizeContextValue(parsed?.branchId),
      courseId: normalizeContextValue(parsed?.courseId),
    };
  } catch (error) {
    return { ...DEFAULT_MANAGED_CONTEXT };
  }
};

const resolveInitialManagedContext = (user: User | null, stored: ManagedContext): ManagedContext => {
  const resolved: ManagedContext = {
    schoolId: stored.schoolId ?? null,
    branchId: stored.branchId ?? null,
    courseId: stored.courseId ?? null,
  };

  // If there's a cached selection, respect it
  const hasCachedSelection = resolved.schoolId || resolved.branchId || resolved.courseId;
  
  // If no cached selection, prioritize school selection (especially "Aria Delta School")
  if (!hasCachedSelection) {
    // First, try to find "Aria Delta School" (Code: ADS001) by default
    if (user?.managedEntities) {
      const managedSchools = Array.isArray(user.managedEntities.schools) ? user.managedEntities.schools : [];
      const ariaDeltaSchool = managedSchools.find((school: any) => {
        const code = normalizeContextValue(school?.code);
        return code === 'ADS001' || code === 'ads001';
      });
      
      if (ariaDeltaSchool) {
        resolved.schoolId =
          normalizeContextValue(ariaDeltaSchool?.id) ??
          normalizeContextValue(ariaDeltaSchool?.uuid) ??
          normalizeContextValue(ariaDeltaSchool?.code) ??
          null;
        // Clear branch and course when selecting school by default
        resolved.branchId = null;
        resolved.courseId = null;
        return resolved;
      }
    }
    
    // If "Aria Delta School" not found, use user's schoolId
    if (!resolved.schoolId) {
      resolved.schoolId = normalizeContextValue(user?.schoolId) ?? null;
    }
    
    // Only set branch/course if school is already set and we want to keep the hierarchy
    // But for default selection, we prefer school only
    if (resolved.schoolId) {
      resolved.branchId = null;
      resolved.courseId = null;
    }
  } else {
    // If there's a cached selection, ensure schoolId is set if branch or course is selected
    if (!resolved.schoolId) {
      resolved.schoolId = normalizeContextValue(user?.schoolId) ?? null;
      
      // Try to find school from branch or course if schoolId is not in user
      if (!resolved.schoolId && resolved.branchId && user?.managedEntities) {
        const managedBranches = Array.isArray(user.managedEntities.branches) ? user.managedEntities.branches : [];
        const branch = managedBranches.find((b: any) => {
          const branchRef = b?.branch ?? b;
          const branchId = normalizeContextValue(branchRef?.id ?? branchRef?.branchId ?? branchRef?.uuid);
          return branchId === resolved.branchId;
        });
        if (branch) {
          const branchRef = branch?.branch ?? branch;
          resolved.schoolId =
            normalizeContextValue(branch?.school?.id ?? branchRef?.school?.id ?? branchRef?.schoolId) ?? null;
        }
      }
      
      if (!resolved.schoolId && resolved.courseId && user?.managedEntities) {
        const managedCourses = Array.isArray(user.managedEntities.courses) ? user.managedEntities.courses : [];
        const course = managedCourses.find((c: any) => {
          const courseRef = c?.course ?? c;
          const courseId = normalizeContextValue(courseRef?.id ?? courseRef?.courseId ?? courseRef?.uuid);
          return courseId === resolved.courseId;
        });
        if (course) {
          const courseRef = course?.course ?? course;
          resolved.schoolId =
            normalizeContextValue(course?.school?.id ?? courseRef?.school?.id ?? courseRef?.schoolId) ?? null;
        }
      }
    }
  }

  return resolved;
};

export interface LoginCredentials {
  username: string;
  password: string;
  role?: string;
}

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normalizeRole = (role?: string | null): string | undefined => {
  if (!role) {
    return undefined;
  }

  const cleaned = role.trim();
  if (!cleaned) {
    return undefined;
  }

  return cleaned.replace(/\s+/g, '').replace(/-/g, '_').toUpperCase();
};

const mapRole = (role?: string | null): string | undefined => {
  const normalized = normalizeRole(role);
  if (!normalized) return normalized;
  if (normalized === 'TEACHER') return 'SCHOOL_ADMIN';
  if (normalized === 'SCHOOL_ADMIN') return 'TEACHER';
  return normalized;
};

// Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [managedContext, setManagedContextState] = useState<ManagedContext>(() => {
    if (typeof window === 'undefined') {
      return { ...DEFAULT_MANAGED_CONTEXT };
    }
    return loadStoredManagedContext();
  });
  
  const queryClient = useQueryClient();

  // Debug loading state changes
  useEffect(() => {
    // Loading state changed
  }, [loading]);

  // Debug user state changes
  useEffect(() => {
    // User state changed
  }, [user, userToken]);

  useEffect(() => {
    secureApiService.setManagedContext(managedContext);
    try {
      localStorage.setItem(MANAGED_CONTEXT_STORAGE_KEY, JSON.stringify(managedContext));
    } catch (storageError) {
      // ignore storage failures
    }
  }, [managedContext]);

  // Invalidate all queries when managed context changes to ensure fresh data for new context
  useEffect(() => {
    // Only invalidate if we have a user (not on initial load)
    if (user) {
      // Invalidate all queries to ensure fresh data is fetched with new context
      queryClient.invalidateQueries();
    }
  }, [managedContext.schoolId, managedContext.branchId, managedContext.courseId, user, queryClient]);

  const checkStoredTokens = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      
      // console.log('🔍 Checking stored tokens...');
      const token = await secureApiService.getAccessToken();
      // console.log('🔍 Token from secureApiService:', token ? 'Found' : 'Not found');
      
      if (token) {
        // Try to get user data from storage
        let userData: User | null = null;
        
        const storedUser = localStorage.getItem('user');
        // console.log('🔍 Stored user from localStorage:', storedUser ? 'Found' : 'Not found');
        if (storedUser) {
          userData = JSON.parse(storedUser);
          const storedOriginalRole = normalizeRole(userData?.originalRole || userData?.role);
          const mappedRole = mapRole(storedOriginalRole);
          if (mappedRole) {
            userData.role = mappedRole;
            userData.originalRole = storedOriginalRole;
          }
          if (!userData?.managedEntities) {
            userData = {
              ...userData,
              managedEntities: {
                branches: [],
                courses: [],
                schools: [],
              },
            };
          } else {
            userData.managedEntities = {
              branches: userData.managedEntities.branches || [],
              courses: userData.managedEntities.courses || [],
              schools: userData.managedEntities.schools || [],
            };
          }
          // console.log('🔍 Parsed user data:', userData);
        }
        
        if (userData) {
          // Decode JWT token to get current role and update user data
          try {
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              const jwtRole = normalizeRole(payload.role || payload.userRole) || 'USER';
              const mappedJwtRole = mapRole(jwtRole) || 'USER';
              if (userData.role !== mappedJwtRole) {
                userData.originalRole = jwtRole;
                userData.role = mappedJwtRole;
                
                // Update stored user data
                localStorage.setItem('user', JSON.stringify(userData));
              }
            }
          } catch (jwtError) {
            // console.log('JWT decode error during token check:', jwtError);
          }
          
          // Ensure teacherId is present (backfill from storage if missing)
          try {
            const storedTeacherId = localStorage.getItem('teacherId');
            if (!('teacherId' in userData) || !userData.teacherId) {
              if (storedTeacherId) {
                (userData as any).teacherId = storedTeacherId;
                // console.log('🔧 Backfilled teacherId from localStorage:', storedTeacherId);
                // Persist updated user with teacherId
                localStorage.setItem('user', JSON.stringify(userData));
              } else {
                console.warn('⚠️ No teacherId found in user or localStorage');
              }
            }
          } catch (e) {
            console.warn('⚠️ Error backfilling teacherId:', e);
          }
          
          const storedContext = loadStoredManagedContext();
          const resolvedContext = resolveInitialManagedContext(userData, storedContext);
          setManagedContextState(resolvedContext);
          secureApiService.setManagedContext(resolvedContext);
          userData = {
            ...userData,
            schoolId: resolvedContext.schoolId ?? userData.schoolId ?? null,
            activeSchoolId: resolvedContext.schoolId ?? userData.schoolId ?? null,
            activeBranchId: resolvedContext.branchId ?? null,
            activeCourseId: resolvedContext.courseId ?? null,
          } as User;
          localStorage.setItem(MANAGED_CONTEXT_STORAGE_KEY, JSON.stringify(resolvedContext));
          
          // Also update LAST_SELECTION_CACHE_KEY to keep them in sync
          if (resolvedContext.courseId) {
            localStorage.setItem(
              LAST_SELECTION_CACHE_KEY,
              JSON.stringify({
                type: 'course',
                courseId: resolvedContext.courseId,
                branchId: resolvedContext.branchId,
                schoolId: resolvedContext.schoolId,
              }),
            );
          } else if (resolvedContext.branchId) {
            localStorage.setItem(
              LAST_SELECTION_CACHE_KEY,
              JSON.stringify({
                type: 'branch',
                branchId: resolvedContext.branchId,
                schoolId: resolvedContext.schoolId,
              }),
            );
          } else if (resolvedContext.schoolId) {
            localStorage.setItem(
              LAST_SELECTION_CACHE_KEY,
              JSON.stringify({
                type: 'school',
                schoolId: resolvedContext.schoolId,
              }),
            );
          }
          
          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);
          setUserToken(token);
          // console.log('✅ User and token set successfully');
          return;
        } else {
          // Clear invalid token
          // console.log('❌ No user data found, clearing token');
          await secureApiService.clearAccessToken();
          secureApiService.clearManagedContext();
          setManagedContextState({ ...DEFAULT_MANAGED_CONTEXT });
          setUser(null);
          setUserToken(null);
          return;
        }
      } else {
        // console.log('❌ No token found');
        setUser(null);
        setUserToken(null);
        setManagedContextState({ ...DEFAULT_MANAGED_CONTEXT });
        secureApiService.clearManagedContext();
        return;
      }
    } catch (error) {
      // console.log('❌ Error in checkStoredTokens:', error);
      setUser(null);
      setUserToken(null);
      return;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Clear all stored data using secureApiService
      await secureApiService.clearAccessToken();
      
      // Invalidate all caches to clear previous user's data
      queryClient.clear();
      
      // Clear all storage data
      localStorage.removeItem('authToken');
      localStorage.removeItem('userToken');
      localStorage.removeItem('token');
      localStorage.removeItem('userPermissions');
      localStorage.removeItem(MANAGED_CONTEXT_STORAGE_KEY);
      sessionStorage.clear();
      secureApiService.clearManagedContext();
      
      setUser(null);
      setUserToken(null);
      setError(null);
      setManagedContextState({ ...DEFAULT_MANAGED_CONTEXT });
      
      // console.log('✅ Logout successful');
      
    } catch (error) {
      console.error('❌ Error during logout:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize authentication on mount - TEMPORARILY DISABLED
  useEffect(() => {
    // console.log('🔍 App mounted, checkStoredTokens called');
    checkStoredTokens();
  }, []);

  // Listen for session expiration events
  useEffect(() => {
    const handleSessionExpired = () => {
      // console.log('🔐 Session expired, logging out user...');
      logout();
    };

    // Listen for session expired events from API service
    window.addEventListener('sessionExpired', handleSessionExpired);

    return () => {
      window.removeEventListener('sessionExpired', handleSessionExpired);
    };
  }, [logout]);

  // Proactive token expiration check
  useEffect(() => {
    const checkTokenExpiration = () => {
      const token = userToken;
      if (!token) {
        // console.log('🔍 No token to check expiration');
        return;
      }

      try {
        // console.log('🔍 Checking token expiration for token:', token.substring(0, 20) + '...');
        // Decode JWT token to check expiration
        const parts = token.split('.');
        if (parts.length === 3) {
          const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
          const json = typeof atob === 'function' ? atob(padded) : window.atob(padded);
          const payload = JSON.parse(json);
          
          // console.log('🔍 Token payload:', payload);
          // console.log('🔍 Token exp:', payload.exp, 'Current time:', Date.now() / 1000);
          
          // Check if token is expired (exp is in seconds, Date.now() is in milliseconds)
          if (payload.exp && payload.exp * 1000 < Date.now()) {
            // console.log('🔐 Token expired, logging out user...');
            logout();
          } else {
            // console.log('✅ Token is valid');
          }
        } else {
          // console.log('❌ Invalid token format');
          logout();
        }
      } catch (error) {
        // console.log('❌ Error checking token expiration:', error);
        // If we can't decode the token, it's likely invalid
        logout();
      }
    };

    // Check token expiration every 2 minutes (more frequent for 24h tokens)
    const interval = setInterval(checkTokenExpiration, 2 * 60 * 1000);

    // Also check immediately when userToken changes - TEMPORARILY DISABLED
    // checkTokenExpiration();

    return () => {
      clearInterval(interval);
    };
  }, [userToken, logout]);

  const login = async (username: string, password: string, role?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      setError(null);
      
      // console.log('🔐 Attempting login with secureApiService...');
      
      // Use secureApiService.login which handles encryption/decryption
      const response = await secureApiService.login({ username, password });
      
      // Type assertion for response.data to include nested structures
      const responseData = response.data as any; // Using any for flexible API response structure
      
      // console.log('📋 Login response:', response);
      // console.log('📋 Response structure:', {
      //   success: response.success,
      //   hasData: !!responseData,
      //   dataKeys: responseData ? Object.keys(responseData) : [],
      //   hasToken: !!responseData?.token,
      //   tokenType: typeof responseData?.token,
      //   message: response.message
      // });
      
      if (response.success && responseData?.token) {
        const token = responseData.token;
        
        // Decode JWT token to get user role
        let jwtRole = 'user';
        let userId = 'unknown';
        
        try {
          // console.log('🔍 Decoding JWT token...');
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const base64 = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
            const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
            const json = typeof atob === 'function' ? atob(padded) : window.atob(padded);
            const payload = JSON.parse(json);
            jwtRole = (payload.role || payload.userRole || 'user');
            userId = payload.userId || payload.sub || username;
            // console.log('✅ JWT decoded:', { role: jwtRole, userId });
          } else {
            // console.log('❌ Invalid JWT token format');
          }
        } catch (jwtError) {
          // console.log('❌ Error decoding JWT token:', jwtError);
        }
        
        // Create user object from response data
        const resolvedRole = normalizeRole(
          jwtRole
          || responseData.user?.role
          || responseData.role
          || responseData.userRole
          || 'user'
        ) || 'USER';
        const mappedRole = mapRole(resolvedRole) || 'USER';

        // Extract teacher ID from the response (if user is a teacher/school admin)
        const teacherId = responseData.teacher?.id || responseData.teacherId || undefined;

        const managedEntities =
          responseData.user?.managedEntities ||
          responseData.managedEntities || {
            branches: [],
            courses: [],
            schools: [],
          };

        const userData: User = {
          id: responseData.user?.id || userId,
          username: responseData.user?.username || responseData.username || responseData.email || username,
          email: responseData.user?.email || responseData.email || username,
          firstName: responseData.user?.firstName || responseData.firstName || responseData.name?.split(' ')[0] || username.split('@')[0] || '',
          lastName: responseData.user?.lastName || responseData.lastName || responseData.name?.split(' ').slice(1).join(' ') || '',
          role: mappedRole,
          originalRole: resolvedRole,
          permissions: responseData.permissions || responseData.metadata?.permissions || {},
          dataScopes: responseData.dataScopes || responseData.metadata?.dataScopes || ['*'],
          schoolId: responseData.user?.schoolId || responseData.schoolId || responseData.school?.id,
          department: responseData.user?.department || responseData.department || responseData.metadata?.department,
          lastLogin: responseData.user?.lastLogin || responseData.lastLogin || new Date().toISOString(),
          isActive: responseData.user?.isActive || responseData.isActive || responseData.user?.status === 'ACTIVE' || responseData.status === 'ACTIVE',
          teacherId: teacherId, // Add teacher ID for teacher portal
          managedEntities: managedEntities as any,
        };

        const storedContext = loadStoredManagedContext();
        const resolvedContext = resolveInitialManagedContext(userData, storedContext);
        userData.schoolId = resolvedContext.schoolId ?? userData.schoolId ?? null;
        userData.activeSchoolId = resolvedContext.schoolId ?? userData.schoolId ?? null;
        userData.activeBranchId = resolvedContext.branchId ?? null;
        userData.activeCourseId = resolvedContext.courseId ?? null;
        setManagedContextState(resolvedContext);
        secureApiService.setManagedContext(resolvedContext);
        localStorage.setItem(MANAGED_CONTEXT_STORAGE_KEY, JSON.stringify(resolvedContext));
        
        // Also update LAST_SELECTION_CACHE_KEY to keep them in sync
        if (resolvedContext.courseId) {
          localStorage.setItem(
            LAST_SELECTION_CACHE_KEY,
            JSON.stringify({
              type: 'course',
              courseId: resolvedContext.courseId,
              branchId: resolvedContext.branchId,
              schoolId: resolvedContext.schoolId,
            }),
          );
        } else if (resolvedContext.branchId) {
          localStorage.setItem(
            LAST_SELECTION_CACHE_KEY,
            JSON.stringify({
              type: 'branch',
              branchId: resolvedContext.branchId,
              schoolId: resolvedContext.schoolId,
            }),
          );
        } else if (resolvedContext.schoolId) {
          localStorage.setItem(
            LAST_SELECTION_CACHE_KEY,
            JSON.stringify({
              type: 'school',
              schoolId: resolvedContext.schoolId,
            }),
          );
        }

        // console.log('👤 Created user object (final):', userData);
        
        // Log teacher response when logging into teacher portal
        const roleForTeacherLog = userData.originalRole || userData.role;
        // if (roleForTeacherLog === 'TEACHER' || roleForTeacherLog === 'SCHOOL_ADMIN') {
        //   console.log('═══════════════════════════════════════════════════════════════');
        //   console.log('👨‍🏫 TEACHER PORTAL LOGIN - Complete Teacher Response');
        //   console.log('═══════════════════════════════════════════════════════════════');
        //   console.log('📋 USER DETAILS:', {
        //     userId: userData.id,
        //     username: userData.username,
        //     email: userData.email,
        //     fullName: `${userData.firstName} ${userData.lastName}`,
        //     role: userData.role,
        //     originalRole: userData.originalRole,
        //     schoolId: userData.schoolId,
        //     teacherId: userData.teacherId, // ⭐ This is the teacher ID to use for API calls
        //   });
        //   console.log('👨‍🏫 TEACHER DATA:', responseData.teacher);
        //   console.log('🔑 AUTHENTICATION:', {
        //     token: token.substring(0, 50) + '...',
        //     sessionId: responseData.sessionId,
        //     expiresAt: responseData.expiresAt,
        //   });
        //   console.log('🔐 PERMISSIONS:', responseData.permissions);
        //   console.log('📊 FULL RAW RESPONSE:', responseData);
        //   console.log('⏰ LOGIN TIME:', new Date().toISOString());
        //   console.log('═══════════════════════════════════════════════════════════════');
        //   console.log('💡 USE THIS TEACHER ID FOR API CALLS:', userData.teacherId);
        //   console.log('💡 ENDPOINT EXAMPLE: GET /api/classes/teacher/' + userData.teacherId);
        //   console.log('═══════════════════════════════════════════════════════════════');
        // }
        
        setUser(userData as User);
        setUserToken(token);
        
        // Invalidate parent portal related caches to ensure fresh data for new login
        queryClient.invalidateQueries({ queryKey: ['parent-children'] });
        queryClient.invalidateQueries({ queryKey: ['parent-notifications'] });
        queryClient.invalidateQueries({ queryKey: ['parent-dashboard'] });
        
        // Store user data (web)
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('userToken', token);
        if (userData.teacherId) {
          localStorage.setItem('teacherId', String(userData.teacherId));
        }
        // console.log('💾 Stored user data in localStorage:', {
        //   user: localStorage.getItem('user'),
        //   userToken: localStorage.getItem('userToken')
        // });
        
        // Store the new token in secureApiService
        await secureApiService.setAccessToken(token);
        
        // console.log('✅ Login successful, user stored');
        // console.log('🔍 Final state check:', {
        //   userState: userData,
        //   tokenState: token,
        //   localStorageUser: localStorage.getItem('user'),
        //   localStorageToken: localStorage.getItem('userToken')
        // });
        
        return { success: true };
      } else {
        const errorMessage = response.message || 'Login failed';
        // console.log('❌ Login failed:', errorMessage);
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed';
      console.error('❌ Login error:', errorMessage);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const refreshAccessToken = useCallback(async (context?: any): Promise<string> => {
    try {
      // Since the RBAC access token endpoint doesn't exist, we'll use the regular token refresh
      const token = await secureApiService.getAccessToken();
      if (token) {
        return token;
      } else {
        throw new Error('No access token available');
      }
    } catch (error) {
      throw new Error('Failed to refresh access token');
    }
  }, []);

  const updateUserContext = useCallback(async (context: any) => {
    try {
      if (!user) {
        throw new Error('No user logged in');
      }

      await secureApiService.generateAccessToken({
        ...context,
        userId: user.id,
        contextUpdate: true,
      });
    } catch (error) {
      console.error('❌ Error updating user context:', error);
      throw error;
    }
  }, [user]);

  const setManagedContext = useCallback(
    async (context: Partial<ManagedContext>, options: SetManagedContextOptions = {}) => {
      const hasSchoolId = Object.prototype.hasOwnProperty.call(context, 'schoolId');
      const hasBranchId = Object.prototype.hasOwnProperty.call(context, 'branchId');
      const hasCourseId = Object.prototype.hasOwnProperty.call(context, 'courseId');

      const normalized: ManagedContext = {
        schoolId: hasSchoolId ? normalizeContextValue(context.schoolId) : managedContext.schoolId,
        branchId: hasBranchId ? normalizeContextValue(context.branchId) : managedContext.branchId,
        courseId: hasCourseId ? normalizeContextValue(context.courseId) : managedContext.courseId,
      };

      setManagedContextState(normalized);
      secureApiService.setManagedContext(normalized);
      try {
        localStorage.setItem(MANAGED_CONTEXT_STORAGE_KEY, JSON.stringify(normalized));
        
        // Also update LAST_SELECTION_CACHE_KEY to keep them in sync
        if (normalized.courseId) {
          localStorage.setItem(
            LAST_SELECTION_CACHE_KEY,
            JSON.stringify({
              type: 'course',
              courseId: normalized.courseId,
              branchId: normalized.branchId,
              schoolId: normalized.schoolId,
            }),
          );
        } else if (normalized.branchId) {
          localStorage.setItem(
            LAST_SELECTION_CACHE_KEY,
            JSON.stringify({
              type: 'branch',
              branchId: normalized.branchId,
              schoolId: normalized.schoolId,
            }),
          );
        } else if (normalized.schoolId) {
          localStorage.setItem(
            LAST_SELECTION_CACHE_KEY,
            JSON.stringify({
              type: 'school',
              schoolId: normalized.schoolId,
            }),
          );
        }
      } catch (storageError) {
        console.warn('Failed to persist managed context:', storageError);
      }

      setUser((prev) => {
        if (!prev) return prev;
        const updated: User = {
          ...prev,
          schoolId: normalized.schoolId ?? prev.schoolId ?? null,
          activeSchoolId: normalized.schoolId ?? prev.schoolId ?? null,
          activeBranchId: normalized.branchId ?? null,
          activeCourseId: normalized.courseId ?? null,
        };
        return updated;
      });

      // Invalidate all React Query caches when context changes to ensure fresh data
      // This ensures that when user selects a different branch/course/school,
      // all API data is refetched with the new context
      queryClient.invalidateQueries();

      if (!options.skipServerUpdate) {
        try {
          await updateUserContext({
            schoolId: normalized.schoolId,
            branchId: normalized.branchId,
            courseId: normalized.courseId,
          });
        } catch (error) {
          console.error('❌ Error syncing managed context:', error);
          throw error;
        }
      }
    },
    [managedContext, updateUserContext],
  );

  // Permission checking methods
  const hasPermission = useCallback((permission: string): boolean => {
    if (!user || !user.permissions) return false;
    return user.permissions[permission] === true;
  }, [user]);

  const roleInheritance: Record<string, string[]> = useMemo(() => ({
    SUPER_DUPER_ADMIN: [
      'SUPER_DUPER_ADMIN',
      'SUPER_ADMIN',
      'SCHOOL_ADMIN',
      'ADMIN',
      'OWNER',
      'TEACHER',
      'STAFF',
      'ACCOUNTANT',
      'PARENT',
    ],
    SUPER_ADMIN: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ADMIN', 'TEACHER', 'STAFF', 'ACCOUNTANT'],
    OWNER: ['OWNER', 'ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STAFF'],
    ADMIN: ['ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STAFF'],
    SCHOOL_ADMIN: ['SCHOOL_ADMIN', 'TEACHER', 'STAFF'],
  TEACHER: ['TEACHER', 'STAFF'],
  BRANCH_MANAGER: ['BRANCH_MANAGER', 'TEACHER', 'STAFF'],
  COURSE_MANAGER: ['COURSE_MANAGER', 'TEACHER', 'STAFF'],
    STAFF: ['STAFF'],
    PARENT: ['PARENT'],
    ACCOUNTANT: ['ACCOUNTANT'],
    STUDENT: ['STUDENT'],
  }), []);

  const hasRole = useCallback((role: string): boolean => {
    if (!user) return false;
    const userRole = normalizeRole(user.role);
    const targetRole = normalizeRole(role);
    if (!userRole || !targetRole) return false;
    const impliedRoles = roleInheritance[userRole] ?? [userRole];
    return impliedRoles.includes(targetRole);
  }, [roleInheritance, user]);

  const hasDataScope = useCallback((scope: string): boolean => {
    if (!user || !user.dataScopes) return false;
    return user.dataScopes.includes('*') || user.dataScopes.includes(scope);
  }, [user]);

  const isAuthenticated = !!user && !!userToken;

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      login,
      logout,
      refreshAccessToken,
      updateUserContext,
      isAuthenticated,
      hasPermission,
      hasRole,
      hasDataScope,
      userToken,
      checkStoredTokens,
      managedContext,
      setManagedContext,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
