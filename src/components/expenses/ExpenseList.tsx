import { useStore, Expense } from "@/store/useStore";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit2, Copy, Trash2, CalendarDays } from "lucide-react";

interface ExpenseListProps {
  onEdit: (expense: Expense) => void;
}

export function ExpenseList({ onEdit }: ExpenseListProps) {
  const { groups, activeGroupId, removeExpense, addExpense } = useStore();
  const group = groups.find(g => g.id === activeGroupId);

  if (!group) return null;

  // Filter out payments and sort descending by date
  const expenses = [...group.expenses]
    .filter(e => !e.isPayment)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="w-20 h-20 bg-white dark:bg-zinc-900 shadow-sm border border-zinc-100 dark:border-zinc-800 rounded-full flex items-center justify-center">
          <span className="text-3xl">💸</span>
        </div>
        <div>
          <p className="text-zinc-900 dark:text-zinc-100 font-medium text-lg">No expenses yet</p>
          <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-1">Tap the + button to add one.</p>
        </div>
      </div>
    );
  }

  // Group by date
  const groupedExpenses: Record<string, Expense[]> = {};
  expenses.forEach(expense => {
    const date = new Date(expense.createdAt);
    // Format: "15 Jun (Tue)"
    const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', weekday: 'short' });
    if (!groupedExpenses[dateStr]) groupedExpenses[dateStr] = [];
    groupedExpenses[dateStr].push(expense);
  });

  const handleDuplicate = (expense: Expense) => {
    addExpense({
      description: `${expense.description} (Copy)`,
      amount: expense.amount,
      payerId: expense.payerId,
      participantIds: expense.participantIds
    });
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedExpenses).map(([dateStr, dayExpenses]) => (
        <div key={dateStr} className="space-y-3">
          {/* Date Header */}
          <div className="flex items-center gap-2 px-1 sticky top-0 z-10 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-sm py-1">
            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-zinc-200/50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400">
              <CalendarDays className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 tracking-tight">{dateStr}</h3>
            <div className="flex-1 h-px bg-zinc-200/50 dark:bg-zinc-800/50 ml-2"></div>
            <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">
              RM {dayExpenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
            </span>
          </div>

          {/* Day Expenses */}
          <div className="space-y-2">
            {dayExpenses.map((expense) => {
              const payer = group.members.find((m) => m.id === expense.payerId)?.name || "Unknown";
              const participantCount = expense.participantIds.length;
              const isAll = participantCount === group.members.length;

              return (
                <div 
                  key={expense.id} 
                  className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/80 shadow-sm active:scale-[0.98] transition-transform group"
                >
                  <div className="flex-1 min-w-0 pr-3 cursor-pointer" onClick={() => onEdit(expense)}>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-[15px] truncate leading-tight mb-0.5">{expense.description}</p>
                    <p className="text-[12px] text-zinc-500 dark:text-zinc-400">
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">{payer}</span> paid
                      <span className="text-zinc-300 dark:text-zinc-700 mx-1.5">•</span>
                      {isAll ? "Split equally" : `For ${participantCount} people`}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <div className="text-right mr-1.5 cursor-pointer" onClick={() => onEdit(expense)}>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 block text-[15px]">
                        RM {expense.amount.toFixed(2)}
                      </span>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger className="h-8 w-8 flex items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors focus:outline-none">
                        <MoreVertical className="w-4 h-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 rounded-xl border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl p-1.5">
                        <DropdownMenuItem onClick={() => onEdit(expense)} className="rounded-lg cursor-pointer text-zinc-700 dark:text-zinc-300 focus:bg-zinc-50 dark:focus:bg-zinc-800 focus:text-zinc-900 dark:focus:text-zinc-100 py-2.5 font-medium text-sm">
                          <Edit2 className="w-4 h-4 mr-2 text-zinc-400" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(expense)} className="rounded-lg cursor-pointer text-zinc-700 dark:text-zinc-300 focus:bg-zinc-50 dark:focus:bg-zinc-800 focus:text-zinc-900 dark:focus:text-zinc-100 py-2.5 font-medium text-sm">
                          <Copy className="w-4 h-4 mr-2 text-zinc-400" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => removeExpense(expense.id)} className="rounded-lg cursor-pointer text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/50 focus:text-red-700 py-2.5 font-medium text-sm">
                          <Trash2 className="w-4 h-4 mr-2 text-red-400" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
