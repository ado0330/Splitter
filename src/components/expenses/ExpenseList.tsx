import { useStore, Expense } from "@/store/useStore";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit2, Copy, Trash2 } from "lucide-react";

interface ExpenseListProps {
  onEdit: (expense: Expense) => void;
}

export function ExpenseList({ onEdit }: ExpenseListProps) {
  const { groups, activeGroupId, removeExpense, addExpense } = useStore();
  const group = groups.find(g => g.id === activeGroupId);

  if (!group || group.expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="w-20 h-20 bg-white shadow-sm border border-zinc-100 rounded-full flex items-center justify-center">
          <span className="text-3xl">💸</span>
        </div>
        <div>
          <p className="text-zinc-900 font-medium text-lg">No expenses yet</p>
          <p className="text-zinc-400 text-sm mt-1">Tap the + button to add one.</p>
        </div>
      </div>
    );
  }

  // Reverse to show newest first
  const expenses = [...group.expenses].reverse();

  const handleDuplicate = (expense: Expense) => {
    addExpense({
      description: `${expense.description} (Copy)`,
      amount: expense.amount,
      payerId: expense.payerId,
      participantIds: expense.participantIds
    });
  };

  return (
    <div className="space-y-3">
      {expenses.map((expense) => {
        const payer = group.members.find((m) => m.id === expense.payerId)?.name || "Unknown";
        const participantCount = expense.participantIds.length;
        const isAll = participantCount === group.members.length;

        return (
          <div 
            key={expense.id} 
            className="flex items-center justify-between p-4 rounded-2xl bg-white border border-zinc-100 shadow-sm active:scale-[0.98] transition-transform group"
          >
            <div className="flex-1 min-w-0 pr-4 cursor-pointer" onClick={() => onEdit(expense)}>
              <p className="font-semibold text-zinc-900 text-[16px] truncate leading-tight mb-1">{expense.description}</p>
              <p className="text-[13px] text-zinc-500">
                <span className="font-medium text-zinc-700">{payer}</span> paid
                <span className="text-zinc-300 mx-1.5">•</span>
                {isAll ? "Split equally" : `For ${participantCount} people`}
              </p>
            </div>
            
            <div className="flex items-center gap-1">
              <div className="text-right mr-2 cursor-pointer" onClick={() => onEdit(expense)}>
                <span className="font-bold text-zinc-900 block text-base">
                  RM {expense.amount.toFixed(2)}
                </span>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger className="h-8 w-8 flex items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors focus:outline-none">
                  <MoreVertical className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 rounded-xl border-zinc-100 shadow-xl p-1.5">
                  <DropdownMenuItem onClick={() => onEdit(expense)} className="rounded-lg cursor-pointer text-zinc-700 focus:bg-zinc-50 focus:text-zinc-900 py-2.5 font-medium text-sm">
                    <Edit2 className="w-4 h-4 mr-2 text-zinc-400" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDuplicate(expense)} className="rounded-lg cursor-pointer text-zinc-700 focus:bg-zinc-50 focus:text-zinc-900 py-2.5 font-medium text-sm">
                    <Copy className="w-4 h-4 mr-2 text-zinc-400" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => removeExpense(expense.id)} className="rounded-lg cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700 py-2.5 font-medium text-sm">
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
  );
}
