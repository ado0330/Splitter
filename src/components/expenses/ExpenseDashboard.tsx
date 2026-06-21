import { useState } from "react";
import { useStore, Expense } from "@/store/useStore";
import { ExpenseList } from "./ExpenseList";
import { SettlementView } from "../settlement/SettlementView";
import { ExpenseForm } from "./ExpenseForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Plus } from "lucide-react";

export function ExpenseDashboard() {
  const { groups, activeGroupId, setActiveGroup } = useStore();
  const [formOpen, setFormOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [activeTab, setActiveTab] = useState("expenses");

  const group = groups.find(g => g.id === activeGroupId);
  if (!group) return null;

  const openAddForm = () => {
    setExpenseToEdit(null);
    setFormOpen(true);
  };

  const openEditForm = (expense: Expense) => {
    setExpenseToEdit(expense);
    setFormOpen(true);
  };

  return (
    <div className="flex flex-col h-[100dvh] animate-in fade-in duration-500 bg-white dark:bg-zinc-950">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-950 px-4 pt-4 pb-2 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setActiveGroup(null)} className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 rounded-full h-8 w-8 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 -ml-1 shrink-0">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-bold text-xl tracking-tight truncate text-zinc-900 dark:text-zinc-100">{group.name}</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{group.members.length} members</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col relative bg-zinc-50/50 dark:bg-zinc-950/50 rounded-t-[24px] border-t border-zinc-100 dark:border-zinc-800/50 shadow-inner">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="px-4 pt-4 shrink-0">
            <TabsList className="w-full grid grid-cols-2 h-10 p-1 bg-zinc-100/80 dark:bg-zinc-900 rounded-lg shadow-sm">
              <TabsTrigger value="expenses" className="rounded-md text-[13px] font-semibold data-[state=active]:shadow-sm">List</TabsTrigger>
              <TabsTrigger value="settlement" className="rounded-md text-[13px] font-semibold data-[state=active]:shadow-sm">Settle</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="expenses" className="flex-1 overflow-y-auto px-4 py-4 m-0 focus-visible:outline-none">
            <ExpenseList onEdit={openEditForm} />
            {/* Spacer for FAB */}
            <div className="h-36 pb-[env(safe-area-inset-bottom)]"></div> 
          </TabsContent>

          <TabsContent value="settlement" className="flex-1 overflow-y-auto px-4 py-4 m-0 focus-visible:outline-none">
            <SettlementView />
            <div className="h-32 pb-[env(safe-area-inset-bottom)]"></div>
          </TabsContent>
        </Tabs>

        {/* Floating Action Button */}
        {activeTab === "expenses" && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none z-50 pb-[env(safe-area-inset-bottom)]">
            <button 
              onClick={openAddForm}
              className="pointer-events-auto flex items-center justify-center w-14 h-14 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full shadow-xl shadow-zinc-900/30 dark:shadow-black/40 hover:scale-105 active:scale-95 transition-transform"
            >
              <Plus className="w-7 h-7" />
            </button>
          </div>
        )}
      </main>

      <ExpenseForm 
        open={formOpen} 
        onOpenChange={setFormOpen} 
        expenseToEdit={expenseToEdit}
      />
    </div>
  );
}
