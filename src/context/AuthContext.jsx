// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

const ADMIN_EMAIL = 'admin@gmail.com';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Department Maps
  const departmentMapOld = {
    '01': 'CSE',
    '02': 'ECE',
    // Add more old-format departments...
  };

  const departmentMapNew = {
    '737': 'CSE',
    '738': 'ECE',
    // Add more new-format departments...
  };

  // ✅ Validate Roll Number Format
  const isValidRoll = (roll) => {
    return /^7176\d{7}$/.test(roll) || /^\d{16}$/.test(roll);
  };

  // ✅ Extract Metadata from Roll Number
  const extractMetadata = (roll) => {
    if (/^7176\d{7}$/.test(roll)) {
      // OLD FORMAT: 7176xxxxxxx
      const yoj = roll.substring(4, 6);
      const deptCode = roll.substring(6, 8);
      const studentId = roll.substring(8);
      return {
        normalizedRoll: roll,
        format: 'OLD',
        yoj: `20${yoj}`,
        deptCode,
        studentId,
        department: departmentMapOld[deptCode] || 'UNKNOWN',
      };
    } else if (/^\d{16}$/.test(roll)) {
      // NEW FORMAT: 16 digits
      const yoj = roll.substring(0, 2);
      const zone = roll.substring(2, 4);
      const collegeCode = roll.substring(4, 8);
      const deptCode = roll.substring(8, 11);
      const mediumCode = roll[11];
      const genderCode = roll[12];
      const studentId = roll.substring(13);

      const medium = mediumCode === '2' ? 'English' : 'Tamil';
      const gender = genderCode === '2' ? 'Female' : 'Male';

      return {
        normalizedRoll: roll,
        format: 'NEW',
        yoj: `20${yoj}`,
        zoneCode: zone,
        collegeCode,
        deptCode,
        studentId,
        medium,
        gender,
        department: departmentMapNew[deptCode] || 'UNKNOWN',
      };
    } else {
      throw new Error('Invalid roll number format');
    }
  };

  // ✅ Ensure student Firestore document exists
  const ensureStudentDocExists = async (metadata) => {
    const {
      normalizedRoll,
      yoj,
      deptCode,
      department,
      studentId,
      format,
      zoneCode,
      collegeCode,
      medium,
      gender
    } = metadata;

    const studentRef = doc(db, 'students', normalizedRoll);
    const snapshot = await getDoc(studentRef);

    if (!snapshot.exists()) {
      const docData = {
        rollNumber: normalizedRoll,
        yearOfJoining: yoj,
        departmentCode: deptCode,
        department,
        studentId,
        createdAt: serverTimestamp()
      };

      if (format === 'NEW') {
        docData.zoneCode = zoneCode;
        docData.collegeCode = collegeCode;
        docData.medium = medium;
        docData.gender = gender;
      }

      await setDoc(studentRef, docData);
    }
  };

  // ✅ Student Login with Roll Number
  const loginWithRollNumber = async (rollNumber) => {
    const cleanedRoll = rollNumber.replace(/\s+/g, '');

    if (!isValidRoll(cleanedRoll)) {
      throw new Error('Invalid roll number format.');
    }

    const metadata = extractMetadata(cleanedRoll);
    const { normalizedRoll } = metadata;
    const studentEmail = `${normalizedRoll}@student.portal`;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, studentEmail, normalizedRoll);
      await ensureStudentDocExists(metadata);
      return userCredential;
    } catch (error) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, studentEmail, normalizedRoll);
          await ensureStudentDocExists(metadata);
          return userCredential;
        } catch (creationError) {
          console.error('Account creation failed:', creationError);
          throw new Error('Could not create student account. Please contact admin.');
        }
      } else {
        console.error('Login failed:', error);
        throw new Error('Login failed. Please check your roll number.');
      }
    }
  };

  // ✅ Admin Login with Email/Password
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential;
    } catch (error) {
      console.error('Admin login failed:', error);
      throw new Error('Admin login failed. Check email and password.');
    }
  };

  // ✅ Logout
  const logout = async () => {
    await signOut(auth);
  };

  // ✅ Handle Auth State Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);

      if (user?.email === ADMIN_EMAIL) {
        setUserRole('admin');
      } else if (user?.email?.endsWith('@student.portal')) {
        setUserRole('user');
      } else {
        setUserRole(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    loading,
    login, // Admin Login
    loginWithRollNumber, // Student Login
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
