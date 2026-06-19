import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Member {
  id: string;
  name: string;
}

export type SplitType = 'EQUAL' | 'CUSTOM';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  payerId: string;
  participantIds: string[];
  splitType?: SplitType;
  customAmounts?: Record<string, number>;
  baseCustomAmounts?: Record<string, number>;
  additionalChargesMode?: 'NONE' | 'PERCENT' | 'RM';
  serviceChargePct?: number;
  taxPct?: number;
  extraChargesAmount?: number;
  createdAt: Date;
}

export interface Group {
  id: string;
  name: string;
  members: Member[];
  expenses: Expense[];
  createdAt: Date;
}

interface AppState {
  groups: Group[];
  activeGroupId: string | null;
  
  // Group actions
  setActiveGroup: (id: string | null) => void;
  createGroup: (name: string, memberNames: string[]) => void;
  renameGroup: (id: string, newName: string) => void;
  deleteGroup: (id: string) => void;
  duplicateGroup: (id: string, newName: string) => void;
  
  // Expense actions
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  addExpenses: (expenses: Omit<Expense, 'id' | 'createdAt'>[]) => void;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  removeExpense: (id: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      groups: [],
      activeGroupId: null,

      setActiveGroup: (id) => set({ activeGroupId: id }),

      createGroup: (name, memberNames) => {
        const members = memberNames.map((n) => ({
          id: crypto.randomUUID(),
          name: n.trim(),
        }));
        const newGroup: Group = {
          id: crypto.randomUUID(),
          name,
          members,
          expenses: [],
          createdAt: new Date(),
        };
        set((state) => ({
          groups: [...state.groups, newGroup],
          activeGroupId: newGroup.id,
        }));
      },

      renameGroup: (id, newName) => {
        set((state) => ({
          groups: state.groups.map(g => g.id === id ? { ...g, name: newName } : g)
        }));
      },

      deleteGroup: (id) => {
        set((state) => ({
          groups: state.groups.filter(g => g.id !== id),
          activeGroupId: state.activeGroupId === id ? null : state.activeGroupId,
        }));
      },

      duplicateGroup: (id, newName) => {
        set((state) => {
          const source = state.groups.find(g => g.id === id);
          if (!source) return state;
          
          const newMembers = source.members.map(m => ({
             id: crypto.randomUUID(), 
             name: m.name 
          }));
          
          const newGroup: Group = {
            id: crypto.randomUUID(),
            name: newName,
            members: newMembers,
            expenses: [],
            createdAt: new Date(),
          };
          
          return {
            groups: [...state.groups, newGroup],
          };
        });
      },

      addExpense: (expense) => {
        set((state) => {
          if (!state.activeGroupId) return state;
          const newExpense: Expense = {
            ...expense,
            id: crypto.randomUUID(),
            createdAt: new Date(),
          };
          return {
            groups: state.groups.map(g => 
              g.id === state.activeGroupId 
                ? { ...g, expenses: [...g.expenses, newExpense] }
                : g
            )
          };
        });
      },

      addExpenses: (expenses) => {
        set((state) => {
          if (!state.activeGroupId) return state;
          const newExpenses: Expense[] = expenses.map(e => ({
            ...e,
            id: crypto.randomUUID(),
            createdAt: new Date(),
          }));
          return {
            groups: state.groups.map(g => 
              g.id === state.activeGroupId 
                ? { ...g, expenses: [...g.expenses, ...newExpenses] }
                : g
            )
          };
        });
      },

      updateExpense: (id, updatedFields) => {
        set((state) => {
          if (!state.activeGroupId) return state;
          return {
            groups: state.groups.map(g => 
              g.id === state.activeGroupId 
                ? {
                    ...g,
                    expenses: g.expenses.map(e => e.id === id ? { ...e, ...updatedFields } : e)
                  }
                : g
            )
          };
        });
      },

      removeExpense: (id) => {
        set((state) => {
          if (!state.activeGroupId) return state;
          return {
            groups: state.groups.map(g => 
              g.id === state.activeGroupId 
                ? { ...g, expenses: g.expenses.filter((e) => e.id !== id) }
                : g
            )
          };
        });
      },
    }),
    {
      name: 'ai-expense-splitter-storage',
      version: 2,
      migrate: (persistedState: any, version: number) => {
        // Drop v1 state completely to avoid crash
        if (version !== 2 || !Array.isArray(persistedState?.groups)) {
          return {
            groups: [],
            activeGroupId: null,
          };
        }
        return persistedState;
      },
    }
  )
);
