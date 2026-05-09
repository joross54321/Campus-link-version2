import { 
  setDoc, 
  doc, 
  collection, 
  query, 
  where, 
  getDocs,
  getDoc
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../lib/firebase';

const getAuthPassword = (surname: string) => {
  // Firebase requires at least 6 characters for passwords
  const clean = surname.trim();
  if (clean.length < 6) {
    return clean.padEnd(6, '1'); // Pad with '1's if too short
  }
  return clean;
};

export const seedInitialData = async () => {
  // 1. Create a Registrar Account
  const registrarId = 'REG-2026-001';
  const surname = 'Admin';
  const email = `${registrarId}@campuslink.isatu.edu.ph`.toLowerCase();
  
  try {
    const password = getAuthPassword(surname);
    let user;
    
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        user = userCredential.user;
      } catch (authError: any) {
        if (authError.code === 'auth/email-already-in-use') {
          try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            user = userCredential.user;
          } catch (signInErr) {
            console.warn(`Could not sync existing registrar account:`, signInErr);
          }
        } else {
          throw authError;
        }
      }
      
      if (user) {
        await setDoc(doc(db, 'users', user.uid), {
          studentId: registrarId,
          surname: surname,
          firstName: 'Project',
          role: 'registrar',
          maxUnits: 30
        });
      }

    // 2. Set System Config
    await setDoc(doc(db, 'system', 'config'), {
      currentSemester: '1',
      currentAcademicYear: '2025-2026',
      midtermDate: new Date('2026-10-15').toISOString()
    });

    // 3. Create sample faculty
    const sampleFaculty = [
      { id: 'FAC-2026-001', surname: 'Sator', firstName: 'Julian', college: 'College of Arts and Sciences' },
      { id: 'FAC-2026-002', surname: 'Reyes', firstName: 'Maria', college: 'College of Arts and Sciences' },
      { id: 'FAC-2026-003', surname: 'Padilla', firstName: 'Robert', college: 'College of Engineering' },
    ];

    for (const faculty of sampleFaculty) {
      const facultyEmail = `${faculty.id}@campuslink.isatu.edu.ph`.toLowerCase();
      const facultyPassword = getAuthPassword(faculty.surname);
      let user;
      
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, facultyEmail, facultyPassword);
        user = userCredential.user;
      } catch (authError: any) {
        if (authError.code === 'auth/email-already-in-use') {
          try {
            const userCredential = await signInWithEmailAndPassword(auth, facultyEmail, facultyPassword);
            user = userCredential.user;
          } catch (signInErr) {
            console.warn(`Could not sync existing faculty account ${faculty.id}:`, signInErr);
            continue; // Skip Firestore update if we can't get the UID
          }
        } else {
          console.warn(`Could not create auth for ${faculty.id}:`, authError);
          continue;
        }
      }

      if (user) {
        await setDoc(doc(db, 'users', user.uid), {
          studentId: faculty.id,
          surname: faculty.surname,
          firstName: faculty.firstName,
          role: 'professor',
          college: faculty.college
        });
      }
    }

    // 4. Create sample students
    const sampleStudents = [
      { id: '22-001', surname: 'Doe', firstName: 'John', yearLevel: 2, college: 'College of Arts and Sciences' },
      { id: '22-002', surname: 'Smith', firstName: 'Jane', yearLevel: 1, college: 'College of Technology' },
      { id: '22-003', surname: 'Simon', firstName: 'Joros', yearLevel: 3, college: 'College of Engineering' },
    ];

    for (const student of sampleStudents) {
      const studentEmail = `${student.id}@campuslink.isatu.edu.ph`.toLowerCase();
      const studentPassword = getAuthPassword(student.surname);
      let user;
      
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, studentEmail, studentPassword);
        user = userCredential.user;
      } catch (authError: any) {
        if (authError.code === 'auth/email-already-in-use') {
          try {
            const userCredential = await signInWithEmailAndPassword(auth, studentEmail, studentPassword);
            user = userCredential.user;
          } catch (signInErr) {
            console.warn(`Could not sync existing student account ${student.id}:`, signInErr);
            continue;
          }
        } else {
          console.warn(`Could not create auth for ${student.id}:`, authError);
          continue;
        }
      }

      if (user) {
        await setDoc(doc(db, 'users', user.uid), {
          studentId: student.id,
          surname: student.surname,
          firstName: student.firstName,
          role: 'student',
          yearLevel: student.yearLevel,
          college: student.college
        });
      }
    }

    // 5. Create some subjects
    const subjects = [
      { code: 'CS101', title: 'Introduction to Computing', units: 3, prerequisites: [], yearLevel: 1, semester: '1', status: 'open', college: 'College of Arts and Sciences', section: 'BSCS 1-A' },
      { code: 'CS102', title: 'Computer Programming 1', units: 3, prerequisites: ['CS101'], yearLevel: 1, semester: '2', status: 'open', college: 'College of Arts and Sciences', section: 'BSCS 2-B' },
      { code: 'CS103', title: 'Discrete Mathematics', units: 3, prerequisites: [], yearLevel: 1, semester: '1', status: 'open', college: 'College of Arts and Sciences', section: 'BSCS 1-A' },
      { code: 'CS104', title: 'Data Science Fundamentals', units: 3, prerequisites: [], yearLevel: 2, semester: '1', status: 'open', college: 'College of Arts and Sciences', section: 'BSCS 2-B' },
      { code: 'CS201', title: 'Data Structures and Algorithms', units: 3, prerequisites: ['CS102'], yearLevel: 2, semester: '1', status: 'open', college: 'College of Arts and Sciences', section: 'BSCS 2-A' },
      { code: 'CS301', title: 'Advanced Web Development', units: 3, prerequisites: ['CS201'], yearLevel: 3, semester: '1', status: 'open', college: 'College of Arts and Sciences', section: 'BSCS 3-A' },
      { code: 'EE101', title: 'Circuits 1', units: 3, prerequisites: [], yearLevel: 1, semester: '1', status: 'open', college: 'College of Engineering', section: 'BSEE 1-A' },
      { code: 'IT101', title: 'Network Fundamentals', units: 3, prerequisites: [], yearLevel: 1, semester: '1', status: 'open', college: 'College of Technology', section: 'BSIT 1-A' },
    ];

    for (const s of subjects) {
      await setDoc(doc(db, 'subjects', s.code), s);
    }

    return { success: true };
  } catch (error: any) {
    if (error.code === 'auth/operation-not-allowed') {
      throw new Error('Email/Password sign-in is not enabled in your Firebase Console. Please enable it under Authentication > Sign-in method.');
    }
    throw error;
  }
};

export const loginWithId = async (id: string, surname: string) => {
  const email = `${id}@campuslink.isatu.edu.ph`.toLowerCase();
  const password = getAuthPassword(surname);
  
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error: any) {
    // If user not found in auth, check if they exist in firestore
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('studentId', '==', id));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        
        const inputSurname = surname.toLowerCase();
        const storedSurname = userData.surname.toLowerCase();
        
        if (inputSurname === storedSurname) {
          const correctPassword = getAuthPassword(userData.surname);
          const oldPasswords = [
            userData.surname.padEnd(6, '0'),
            userData.surname.padEnd(6, '1'),
            userData.surname.padEnd(6, '123')
          ];
          
          try {
            return await createUserWithEmailAndPassword(auth, email, correctPassword);
          } catch (e: any) {
            if (e.code === 'auth/email-already-in-use') {
              // Try the "new" canonical password first
              try {
                return await signInWithEmailAndPassword(auth, email, correctPassword);
              } catch (signInErr) {
                // Try old common paddings
                for (const oldPass of oldPasswords) {
                  try {
                    return await signInWithEmailAndPassword(auth, email, oldPass);
                  } catch (p) {
                    continue;
                  }
                }
                throw signInErr;
              }
            }
            throw e;
          }
        }
      }
    }
    if (error.code === 'auth/operation-not-allowed') {
      throw new Error('Email/Password sign-in is not enabled in your Firebase Console. Please enable it under Authentication > Sign-in method.');
    }
    throw error;
  }
};
