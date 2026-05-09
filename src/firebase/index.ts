'use client';

import { firebaseApp, db, auth } from '@/lib/firebase';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';

export function initializeFirebase() {
  return {
    firebaseApp,
    auth,
    firestore: db
  };
}

export function getSdks(app: FirebaseApp) {
  return {
    firebaseApp: app,
    auth: auth,
    firestore: db
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
