import { useState } from "react";
import { useStore, Expense } from "@/store/useStore";
import { ExpenseList } from "./ExpenseList";
import { SmartInput } from "./SmartInput";
import { SettlementView } from "../settlement/SettlementView";
import { ExpenseForm } from "./ExpenseForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Plus } from "lucide-react";
import { calculateBalances } from "@/lib/algorithm";

export function ExpenseDashboard() {
  const { groups, activeGroupId, setActiveGroup } = useStore();
  const [formOpen, setFormOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [activeTab, setActiveTab] = useState("expenses");

  const group = groups.find(g => g.id === activeGroupId);
  if (!group) return null;

  const balances = calculateBalances(group.members, group.expenses);

  const openAddForm = () => {
    setExpenseToEdit(null);
    setFormOpen(true);
  };

  const openEditForm = (expense: Expense) => {
    setExpenseToEdit(expense);
    setFormOpen(true);
  };

  return (
    <div className="flex flex-col h-screen animate-in fade-in duration-500 bg-white">
      {/* Header */}
      <header className="bg-white px-6 pt-6 pb-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setActiveGroup(null)} className="text-zinc-400 hover:text-zinc-800 rounded-full h-10 w-10 bg-zinc-50 -ml-2 shrink-0">
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="font-bold text-2xl tracking-tight truncate">{group.name}</h1>
            <p className="text-sm text-zinc-500 font-medium">{group.members.length} members</p>
          </div>
        </div>
      </header>

      {/* Live Balances Horizontal Scroll */}
      <div className="px-6 pb-4 shrink-0 overflow-x-auto no-scrollbar flex gap-3">
        {balances.map(b => (
          <div key={b.memberId} className="flex-shrink-0 bg-white shadow-sm shadow-zinc-200/50 rounded-2xl px-4 py-3 border border-zinc-100 min-w-[100px] flex flex-col justify-center">
            <p className="text-[11px] uppercase font-bold text-zinc-400 mb-0.5 tracking-wider">{b.name}</p>
            <p className={`font-bold text-lg leading-none ${b.net > 0 ? 'text-emerald-500' : b.net < 0 ? 'text-red-500' : 'text-zinc-400'}`}>
              {b.net > 0 ? '+' : ''}{b.net.toFixed(0)}
            </p>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col relative bg-zinc-50/50 rounded-t-[32px] border-t border-zinc-100 shadow-inner">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="px-6 pt-6 shrink-0">
            <TabsList className="w-full grid grid-cols-3 h-12 p-1.5 bg-zinc-100/80 rounded-xl shadow-sm">
              <TabsTrigger value="expenses" className="rounded-lg text-[13px] font-semibold data-[state=active]:shadow-sm">List</TabsTrigger>
              <TabsTrigger value="settlement" className="rounded-lg text-[13px] font-semibold data-[state=active]:shadow-sm">Settle</TabsTrigger>
              <TabsTrigger value="import" className="rounded-lg text-[13px] font-semibold data-[state=active]:shadow-sm">Import</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="expenses" className="flex-1 overflow-y-auto px-6 py-6 m-0 focus-visible:outline-none">
            <ExpenseList onEdit={openEditForm} />
            {/* Spacer for FAB */}
            <div className="h-36 pb-[env(safe-area-inset-bottom)]"></div> 
          </TabsContent>

          <TabsContent value="settlement" className="flex-1 overflow-y-auto px-6 py-6 m-0 focus-visible:outline-none">
            <SettlementView />
            <div className="h-36 pb-[env(safe-area-inset-bottom)]"></div>
          </TabsContent>

          <TabsContent value="import" className="flex-1 overflow-y-auto px-6 py-6 m-0 focus-visible:outline-none">
            <SmartInput />
          </TabsContent>
        </Tabs>

        {/* Floating Action Button */}
        {activeTab === "expenses" && (
          <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none z-50 pb-[env(safe-area-inset-bottom)]">
            <button 
              onClick={openAddForm}
              className="pointer-events-auto flex items-center justify-center w-16 h-16 bg-zinc-900 text-white rounded-full shadow-2xl shadow-zinc-900/40 hover:scale-105 active:scale-95 transition-transform"
            >
              <Plus className="w-8 h-8" />
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
