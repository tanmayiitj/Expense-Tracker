import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Expense, CategoryItem } from '@/lib/expense-types'

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
