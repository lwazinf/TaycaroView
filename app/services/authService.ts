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
  getDocs
} from 'firebase/firestore';
import { auth, firestore } from '../utils/firebase';
import { User, UserRole, LoginCredentials, RegisterData } from '../types/auth';

// Helper function to clean undefined values from objects
const cleanFirestoreData = (obj: any): any => {
  const cleaned: any = {};
  Object.keys(obj).forEach(key => {
    if (obj[key] !== undefined && obj[key] !== null) {
      if (typeof obj[key] === 'object' && !Array.isArray(obj[key]) && obj[key].constructor === Object) {
        const cleanedNested = cleanFirestoreData(obj[key]);
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
  } catch (error) {
    console.error('❌ Error creating user profile:', error);
    throw error;
  }
};

// Get user profile from Firestore
export const getUserProfile = async (uid: string): Promise<User | null> => {
  try {
    console.log('📄 Getting user profile for:', uid);
    const userDoc = await getDoc(doc(firestore, 'users', uid));
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      const userProfile = {
        uid: userDoc.id,
        email: data.email || '',
        displayName: data.displayName || '',
        role: data.role || 'instructor',
        institution: data.institution || '',
        department: data.department || '',
        createdAt: data.createdAt?.toDate() || new Date(),
        lastLogin: data.lastLogin?.toDate() || new Date(),
        isActive: data.isActive ?? true,
        profileImage: data.profileImage || ''
      };
      console.log('✅ User profile found:', userProfile);
      return userProfile;
    }
    
    console.log('⚠️ User document not found for uid:', uid);
    return null;
  } catch (error) {
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
      } catch (updateError) {
        console.warn('⚠️ Failed to update lastLogin:', updateError);
      }
    }
    
    return userProfile;
  } catch (error) {
    console.error('❌ Error ensuring user document:', error);
    throw error;
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
  } catch (error: any) {
    console.error('❌ Login error:', error);
    
    switch (error.code) {
      case 'auth/invalid-email':
        throw new Error('Invalid email address');
      case 'auth/user-disabled':
        throw new Error('This account has been disabled');
      case 'auth/user-not-found':
        throw new Error('No account found with this email');
      case 'auth/wrong-password':
        throw new Error('Incorrect password');
      case 'auth/too-many-requests':
        throw new Error('Too many failed attempts. Please try again later');
      case 'auth/invalid-credential':
        throw new Error('Invalid email or password');
      default:
        throw new Error(error.message || 'Login failed');
    }
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
      } catch (error) {
        console.error('❌ Error in auth state change:', error);
        callback(null);
      }
    } else {
      console.log('👤 No user authenticated');
      callback(null);
    }
  });
};

// Rest of your functions remain the same...
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
  } catch (error: any) {
    console.error('Registration error:', error);
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        throw new Error('An account with this email already exists');
      case 'auth/invalid-email':
        throw new Error('Invalid email address');
      case 'auth/operation-not-allowed':
        throw new Error('Email/password accounts are not enabled');
      case 'auth/weak-password':
        throw new Error('Password should be at least 6 characters');
      default:
        throw new Error(error.message || 'Registration failed');
    }
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    console.log('👋 Logging out user...');
    await signOut(auth);
    console.log('✅ User logged out successfully');
  } catch (error) {
    console.error('❌ Logout error:', error);
    throw error;
  }
};

export const resetUserPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error('Password reset error:', error);
    
    switch (error.code) {
      case 'auth/invalid-email':
        throw new Error('Invalid email address');
      case 'auth/user-not-found':
        throw new Error('No account found with this email');
      default:
        throw new Error('Failed to send password reset email');
    }
  }
};

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
  } catch (error) {
    console.error('Profile update error:', error);
    throw error;
  }
};

export const checkUserRole = (user: User | null, requiredRoles: UserRole[]): boolean => {
  if (!user) return false;
  return requiredRoles.includes(user.role);
};