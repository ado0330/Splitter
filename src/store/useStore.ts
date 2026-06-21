import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Member {
  id: string;
  name: string;
}

export type SplitType = 'EQUAL' | 'CUSTOM' | 'ITEMIZED';


export interface Expense {
  id: string;
  description: string;
  amount: number;
  payerId: string;
  participantIds: string[];
  splitType?: SplitType;
  customAmounts?: Record<string, number>;
  baseCustomAmounts?: Record<string, number>;
  receiptItems?: import('./../lib/extractor').ReceiptItem[];
  additionalChargesMode?: 'NONE' | 'PERCENT' | 'RM';
  serviceChargePct?: number;
  taxPct?: number;
  extraChargesAmount?: number;
  isPayment?: boolean;
  createdAt: Date;
}

export interface Group {
  id: string;
  name: string;
  members: Member[];
  expenses: Expense[];
  isPinned?: boolean;
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
  togglePinGroup: (id: string) => void;
  reorderGroups: (activeId: string, overId: string) => void;
  

  // Expense actions
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'> & { createdAt?: Date }) => void;
  addExpenses: (expenses: (Omit<Expense, 'id' | 'createdAt'> & { createdAt?: Date })[]) => void;
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
          groups: [newGroup, ...state.groups],
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
            groups: [newGroup, ...state.groups],
          };
        });
      },

      togglePinGroup: (id) => {
        set((state) => {
          const groupIndex = state.groups.findIndex(g => g.id === id);
          if (groupIndex === -1) return state;
          const group = state.groups[groupIndex];
          const newGroups = [...state.groups];
          newGroups.splice(groupIndex, 1);
          if (!group.isPinned) {
            newGroups.unshift({ ...group, isPinned: true });
          } else {
            const unpinnedIndex = newGroups.findIndex(g => !g.isPinned);
            const targetIndex = unpinnedIndex === -1 ? newGroups.length : unpinnedIndex;
            newGroups.splice(targetIndex, 0, { ...group, isPinned: false });
          }
          return { groups: newGroups };
        });
      },

      reorderGroups: (activeId, overId) => {
        set((state) => {
          const oldIndex = state.groups.findIndex(g => g.id === activeId);
          const newIndex = state.groups.findIndex(g => g.id === overId);
          if (oldIndex === -1 || newIndex === -1) return state;
          
          const activeGroup = state.groups[oldIndex];
          const overGroup = state.groups[newIndex];
          if (!!activeGroup.isPinned !== !!overGroup.isPinned) return state;
          
          const newGroups = [...state.groups];
          const [movedGroup] = newGroups.splice(oldIndex, 1);
          newGroups.splice(newIndex, 0, movedGroup);
          
          return { groups: newGroups };
        });
      },


      addExpense: (expense) => {
        set((state) => {
          if (!state.activeGroupId) return state;
          const newExpense: Expense = {
            ...expense,
            id: crypto.randomUUID(),
            createdAt: expense.createdAt || new Date(),
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
            createdAt: e.createdAt || new Date(),
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
