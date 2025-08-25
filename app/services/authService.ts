import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile as updateFirebaseProfile,
  User as FirebaseUser,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { auth, firestore } from '../utils/firebase';
import { User, UserRole, LoginCredentials, RegisterData } from '../types/auth';

// Error message mappings using Record
const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'Invalid email address',
  'auth/user-disabled': 'This account has been disabled',
  'auth/user-not-found': 'No account found with this email',
  'auth/wrong-password': 'Incorrect password',
  'auth/too-many-requests': 'Too many failed attempts. Please try again later',
  'auth/invalid-credential': 'Invalid email or password',
  'auth/email-already-in-use': 'An account with this email already exists',
  'auth/operation-not-allowed': 'Email/password accounts are not enabled',
  'auth/weak-password': 'Password should be at least 6 characters'
};

// Helper function to get error messages
const getFirebaseErrorMessage = (error: unknown): string => {
  const errorRecord = error as Record<string, unknown>;
  
  if (typeof errorRecord.code === 'string' && errorRecord.code in FIREBASE_ERROR_MESSAGES) {
    return FIREBASE_ERROR_MESSAGES[errorRecord.code];
  }
  
  if (typeof errorRecord.message === 'string') {
    return errorRecord.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

// Helper function to clean undefined values from objects
const cleanFirestoreData = (obj: Record<string, unknown>): Record<string, unknown> => {
  const cleaned: Record<string, unknown> = {};
  Object.keys(obj).forEach(key => {
    if (obj[key] !== undefined && obj[key] !== null) {
      if (typeof obj[key] === 'object' && !Array.isArray(obj[key]) && obj[key]?.constructor === Object) {
        const cleanedNested = cleanFirestoreData(obj[key] as Record<string, unknown>);
        if (Object.keys(cleanedNested).length > 0) {
          cleaned[key] = cleanedNested;
        }
      } else {
        cleaned[key] = obj[key];
      }
    }
  });
  return cleaned;
};

// Create user profile in Firestore
export const createUserProfile = async (
  firebaseUser: FirebaseUser,
  additionalData: {
    displayName: string;
    role: UserRole;
    institution?: string;
    department?: string;
  }
): Promise<User> => {
  try {
    const userProfile: User = {
      uid: firebaseUser.uid,
      email: firebaseUser.email!,
      displayName: additionalData.displayName,
      role: additionalData.role,
      institution: additionalData.institution || '',
      department: additionalData.department || '',
      createdAt: new Date(),
      lastLogin: new Date(),
      isActive: true,
      profileImage: firebaseUser.photoURL || ''
    };

    const firestoreData = cleanFirestoreData({
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: additionalData.displayName,
      role: additionalData.role,
      institution: additionalData.institution || '',
      department: additionalData.department || '',
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      isActive: true,
      profileImage: firebaseUser.photoURL || ''
    });

    await setDoc(doc(firestore, 'users', firebaseUser.uid), firestoreData);
    console.log('✅ User profile created in Firestore');

    return userProfile;
  } catch (error: unknown) {
    console.error('❌ Error creating user profile:', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
};

// Get user profile from Firestore
export const getUserProfile = async (uid: string): Promise<User | null> => {
  try {
    console.log('📄 Getting user profile for:', uid);
    const userDoc = await getDoc(doc(firestore, 'users', uid));
    
    if (userDoc.exists()) {
      const data = userDoc.data() as Record<string, unknown>;
      const userProfile: User = {
        uid: userDoc.id,
        email: (data.email as string) || '',
        displayName: (data.displayName as string) || '',
        role: (data.role as UserRole) || 'instructor',
        institution: (data.institution as string) || '',
        department: (data.department as string) || '',
        createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
lastLogin: (data.lastLogin as Timestamp)?.toDate() || new Date(),
        isActive: (data.isActive as boolean) ?? true,
        profileImage: (data.profileImage as string) || ''
      };
      console.log('✅ User profile found:', userProfile);
      return userProfile;
    }
    
    console.log('⚠️ User document not found for uid:', uid);
    return null;
  } catch (error: unknown) {
    console.error('❌ Error getting user profile:', error);
    return null;
  }
};

// Function to ensure user document exists
export const ensureUserDocument = async (firebaseUser: FirebaseUser): Promise<User> => {
  try {
    let userProfile = await getUserProfile(firebaseUser.uid);
    
    if (!userProfile) {
      console.log('🔧 Creating missing user document...');
      userProfile = await createUserProfile(firebaseUser, {
        displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        role: 'instructor',
        institution: '',
        department: ''
      });
      console.log('✅ Missing user document created');
    } else {
      // Update last login
      try {
        await updateDoc(doc(firestore, 'users', firebaseUser.uid), {
          lastLogin: serverTimestamp()
        });
        console.log('✅ Last login updated');
      } catch (updateError: unknown) {
        console.warn('⚠️ Failed to update lastLogin:', updateError);
      }
    }
    
    return userProfile;
  } catch (error: unknown) {
    console.error('❌ Error ensuring user document:', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
};

// Login function with enhanced persistence
export const loginUser = async (credentials: LoginCredentials): Promise<User> => {
  try {
    console.log('🔐 Login attempt for:', credentials.email);
    
    // Set persistence FIRST, before any authentication
    const persistenceType = credentials.rememberMe ? browserLocalPersistence : browserSessionPersistence;
    console.log('💾 Setting persistence to:', credentials.rememberMe ? 'LOCAL' : 'SESSION');
    
    await setPersistence(auth, persistenceType);

    const { user: firebaseUser } = await signInWithEmailAndPassword(
      auth,
      credentials.email,
      credentials.password
    );

    console.log('✅ Firebase authentication successful');

    // Ensure user document exists and update last login
    const userProfile = await ensureUserDocument(firebaseUser);

    if (!userProfile.isActive) {
      throw new Error('Account is deactivated. Please contact administrator.');
    }

    console.log('✅ Login completely successful');
    return userProfile;
  } catch (error: unknown) {
    console.error('❌ Login error:', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
};

// Enhanced auth state change listener
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  console.log('👂 Setting up auth state listener...');
  
  return onAuthStateChanged(auth, async (firebaseUser) => {
    console.log('🔄 Auth state changed:', firebaseUser ? `User: ${firebaseUser.email}` : 'No user');
    
    if (firebaseUser) {
      try {
        // Ensure user document exists
        const userProfile = await ensureUserDocument(firebaseUser);
        console.log('✅ User profile retrieved/created:', userProfile.email);
        callback(userProfile);
      } catch (error: unknown) {
        console.error('❌ Error in auth state change:', error);
        callback(null);
      }
    } else {
      console.log('👤 No user authenticated');
      callback(null);
    }
  });
};

// Register user function
export const registerUser = async (registerData: RegisterData): Promise<User> => {
  try {
    if (registerData.password !== registerData.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    if (registerData.password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    const existingUsers = await getDocs(
      query(collection(firestore, 'users'), where('email', '==', registerData.email))
    );

    if (!existingUsers.empty) {
      throw new Error('An account with this email already exists');
    }

    const { user: firebaseUser } = await createUserWithEmailAndPassword(
      auth,
      registerData.email,
      registerData.password
    );

    await updateFirebaseProfile(firebaseUser, {
      displayName: registerData.displayName
    });

    // Set persistence for new users too
    await setPersistence(auth, browserLocalPersistence);

    const userProfile = await createUserProfile(firebaseUser, {
      displayName: registerData.displayName,
      role: registerData.role,
      institution: registerData.institution,
      department: registerData.department
    });

    return userProfile;
  } catch (error: unknown) {
    console.error('Registration error:', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
};

// Logout function
export const logoutUser = async (): Promise<void> => {
  try {
    console.log('👋 Logging out user...');
    await signOut(auth);
    console.log('✅ User logged out successfully');
  } catch (error: unknown) {
    console.error('❌ Logout error:', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
};

// Reset password function
export const resetUserPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: unknown) {
    console.error('Password reset error:', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
};

// Update user profile function
export const updateUserProfile = async (uid: string, data: Partial<User>): Promise<void> => {
  try {
    const cleanedData = cleanFirestoreData({
      ...data,
      lastLogin: serverTimestamp()
    });

    await updateDoc(doc(firestore, 'users', uid), cleanedData);
    
    if (data.displayName && auth.currentUser) {
      await updateFirebaseProfile(auth.currentUser, {
        displayName: data.displayName
      });
    }
  } catch (error: unknown) {
    console.error('Profile update error:', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
};

// Check user role function
export const checkUserRole = (user: User | null, requiredRoles: UserRole[]): boolean => {
  if (!user) return false;
  return requiredRoles.includes(user.role);
};