import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  setDoc,
  getDoc,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Expense, CategoryItem, UserSettings } from '@/lib/expense-types'

function userExpensesCol(uid: string) {
  return collection(db, 'users', uid, 'expenses')
}

function userCategoriesCol(uid: string) {
  return collection(db, 'users', uid, 'categories')
}

// --- Expenses ---

export function subscribeExpenses(
  uid: string,
  onData: (expenses: Expense[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const q = query(userExpensesCol(uid), orderBy('timestamp', 'desc'))
  return onSnapshot(
    q,
    (snapshot) => {
      const expenses: Expense[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Expense[]
      onData(expenses)
    },
    onError
  )
}

export async function addExpense(uid: string, expense: Omit<Expense, 'id'>): Promise<string> {
  const docRef = await addDoc(userExpensesCol(uid), expense)
  return docRef.id
}

export async function updateExpense(uid: string, id: string, data: Partial<Expense>): Promise<void> {
  const { id: _id, ...updateData } = data
  await updateDoc(doc(userExpensesCol(uid), id), updateData)
}

export async function deleteExpense(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(userExpensesCol(uid), id))
}

// Retroactively tag all expenses with cycle label based on cycle start
export async function batchUpdateExpenseCycleLabels(
  uid: string,
  expenses: Expense[],
  cycleStartDate: string,
  cycleLabel: string
): Promise<void> {
  const cycleStartTimestamp = new Date(cycleStartDate).getTime()
  
  const updates = expenses
    .filter((expense) => {
      const expenseTimestamp = new Date(expense.date).getTime()
      return expenseTimestamp >= cycleStartTimestamp
    })
    .map((expense) =>
      updateDoc(doc(userExpensesCol(uid), expense.id), {
        cycleLabel,
      })
    )

  await Promise.all(updates)
}

// --- Categories ---

export function subscribeCategories(
  uid: string,
  onData: (categories: CategoryItem[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const q = query(userCategoriesCol(uid), orderBy('name'))
  return onSnapshot(
    q,
    (snapshot) => {
      const categories: CategoryItem[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as (CategoryItem & { id: string })[]
      onData(categories)
    },
    onError
  )
}

export async function addCategory(uid: string, category: CategoryItem): Promise<string> {
  const docRef = await addDoc(userCategoriesCol(uid), category)
  return docRef.id
}

export async function deleteCategory(uid: string, name: string): Promise<void> {
  // Find the category doc by name, then delete it
  const q = query(userCategoriesCol(uid))
  return new Promise((resolve, reject) => {
    const unsub = onSnapshot(q, async (snapshot) => {
      unsub()
      const catDoc = snapshot.docs.find((d) => d.data().name === name)
      if (catDoc) {
        await deleteDoc(doc(userCategoriesCol(uid), catDoc.id))
      }
      resolve()
    }, reject)
  })
}

// --- Seed default categories if user has none ---

export async function seedDefaultCategories(uid: string, defaults: CategoryItem[]): Promise<void> {
  const q = query(userCategoriesCol(uid))
  return new Promise((resolve, reject) => {
    const unsub = onSnapshot(q, async (snapshot) => {
      unsub()
      if (snapshot.empty) {
        const promises = defaults.map((cat) => addDoc(userCategoriesCol(uid), cat))
        await Promise.all(promises)
      }
      resolve()
    }, reject)
  })
}

// --- User Settings ---

function userSettingsDoc(uid: string) {
  return doc(db, 'users', uid, 'settings', 'general')
}

export function subscribeUserSettings(
  uid: string,
  onData: (settings: UserSettings | null) => void,
  onError: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    userSettingsDoc(uid),
    (snapshot) => {
      if (snapshot.exists()) {
        onData(snapshot.data() as UserSettings)
      } else {
        onData(null)
      }
    },
    onError
  )
}

export async function updateUserSettings(uid: string, settings: Partial<UserSettings>): Promise<void> {
  await setDoc(userSettingsDoc(uid), settings, { merge: true })
}

export async function getUserSettings(uid: string): Promise<UserSettings | null> {
  const snapshot = await getDoc(userSettingsDoc(uid))
  return snapshot.exists() ? (snapshot.data() as UserSettings) : null
}

// --- Delete all user data (factory reset) ---

export async function deleteAllUserData(uid: string): Promise<void> {
  // Delete all expenses
  const expensesSnap = await new Promise<import('firebase/firestore').QuerySnapshot>((resolve, reject) => {
    const unsub = onSnapshot(query(userExpensesCol(uid)), (snap) => {
      unsub()
      resolve(snap)
    }, reject)
  })
  const expenseDeletes = expensesSnap.docs.map((d) => deleteDoc(d.ref))

  // Delete all categories
  const categoriesSnap = await new Promise<import('firebase/firestore').QuerySnapshot>((resolve, reject) => {
    const unsub = onSnapshot(query(userCategoriesCol(uid)), (snap) => {
      unsub()
      resolve(snap)
    }, reject)
  })
  const categoryDeletes = categoriesSnap.docs.map((d) => deleteDoc(d.ref))

  // Delete settings
  const settingsDelete = deleteDoc(userSettingsDoc(uid))

  await Promise.all([...expenseDeletes, ...categoryDeletes, settingsDelete])
}
