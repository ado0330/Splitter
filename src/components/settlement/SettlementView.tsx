import { useState } from "react";
import { useStore } from "@/store/useStore";
import { calculateBalances, calculateSettlement } from "@/lib/algorithm";
import { ArrowRight, Copy, Share } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SettlementView() {
  const { groups, activeGroupId, addExpense, addExpenses, removeExpense } = useStore();
  const group = groups.find(g => g.id === activeGroupId);
  const [filterDate, setFilterDate] = useState<string>("ALL");
  const [showDetails, setShowDetails] = useState(false);

  const getPaymentDate = () => {
    if (filterDate === "ALL" || filteredExpenses.length === 0) return new Date();
    return new Date(filteredExpenses[0].createdAt);
  };

  const handleSettleUp = (t: any) => {
    addExpense({
      description: `💸 Settlement: ${t.fromName} paid ${t.toName}`,
      amount: t.amount,
      payerId: t.fromId,
      participantIds: [t.toId],
      splitType: 'EQUAL',
      isPayment: true,
      createdAt: getPaymentDate(),
    });
  };

  const handleSettleAll = () => {
    const paymentDate = getPaymentDate();
    const settlementExpenses = actualTransfers.map(t => ({
      description: `💸 Settlement: ${t.fromName} paid ${t.toName}`,
      amount: t.amount,
      payerId: t.fromId,
      participantIds: [t.toId],
      splitType: 'EQUAL' as const,
      isPayment: true,
      createdAt: paymentDate,
    }));
    addExpenses(settlementExpenses);
  };

  const handleUndoPayment = (t: any) => {
    const payment = filteredExpenses.find(e => 
      e.isPayment && 
      e.payerId === t.fromId && 
      e.participantIds.includes(t.toId)
    );
    if (payment) {
      removeExpense(payment.id);
    }
  };
  
  if (!group || group.expenses.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-400 dark:text-zinc-500 text-sm">
        No expenses to settle.
      </div>
    );
  }

  const sortedExpenses = [...group.expenses].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const uniqueDates = Array.from(new Set(sortedExpenses.map(e => {
    const d = new Date(e.createdAt);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', weekday: 'short' });
  })));

  const filteredExpenses = filterDate === "ALL" 
    ? group.expenses 
    : group.expenses.filter(e => {
        const d = new Date(e.createdAt);
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', weekday: 'short' }) === filterDate;
      });

  const rawExpenses = filteredExpenses.filter(e => !e.isPayment);
  const rawBalances = calculateBalances(group.members, rawExpenses);
  const rawTransfers = calculateSettlement(rawBalances);

  const actualBalances = calculateBalances(group.members, filteredExpenses);
  const actualTransfers = calculateSettlement(actualBalances);
  const isAllSettled = rawTransfers.length > 0 && actualTransfers.length === 0;

  const generateShareText = () => {
    let text = `${group.name}\n\nSettlement Result\n\n`;
    if (rawTransfers.length === 0) {
      text += "Everyone is settled up! 🎉";
    } else {
      rawTransfers.forEach(t => {
        text += `💸 ${t.fromName} → ${t.toName} RM ${t.amount.toFixed(2)}\n`;
      });
    }
    return text;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generateShareText());
      alert("Copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy", err);
      alert("Failed to copy text. Please try again.");
    }
  };

  const handleShare = async () => {
    const text = generateShareText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${group.name} Settlement`,
          text: text,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error("Error sharing", err);
        }
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-300">
      
      {/* Date Filter */}
      {uniqueDates.length > 0 && (
        <div className="-mx-4 px-4 pb-2 pt-1 overflow-x-auto no-scrollbar flex gap-2">
          <button
            onClick={() => setFilterDate("ALL")}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filterDate === "ALL"
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-md shadow-zinc-900/10 dark:shadow-black/20' 
                : 'bg-zinc-100 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
            }`}
          >
            Overview
          </button>
          {uniqueDates.map(dateStr => (
            <button
              key={dateStr}
              onClick={() => setFilterDate(dateStr)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filterDate === dateStr
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-md shadow-zinc-900/10 dark:shadow-black/20' 
                  : 'bg-zinc-100 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
              }`}
            >
              {dateStr}
            </button>
          ))}
        </div>
      )}

      {/* Settlement Plan */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Optimized Settlement Plan</h3>
          {actualTransfers.length > 1 && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleSettleAll}
              className="h-7 px-3 rounded-full text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 hover:text-emerald-800 dark:hover:text-emerald-300"
            >
              Settle All
            </Button>
          )}
        </div>
        
        {isAllSettled && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-center text-sm font-bold text-emerald-600 dark:text-emerald-500 border border-emerald-100 dark:border-emerald-900/50 mb-2 animate-in slide-in-from-top-2">
            🎉 All Settled!
          </div>
        )}

        {rawTransfers.length === 0 ? (
          <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl text-center text-sm font-medium text-zinc-500 dark:text-zinc-400 border border-zinc-100 dark:border-zinc-800/50">
            No transfers needed.
          </div>
        ) : (
          <div className="space-y-3">
            {rawTransfers.map((t, i) => {
              const isPaid = !actualTransfers.some(at => at.fromId === t.fromId && at.toId === t.toId);

              return (
                <div key={i} className={`flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border rounded-2xl shadow-sm transition-all ${isPaid ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/30 dark:bg-emerald-950/20 opacity-70' : 'border-zinc-100 dark:border-zinc-800'}`}>
                  <div className="flex items-center gap-3 font-medium text-[15px]">
                    <span className={`text-zinc-800 dark:text-zinc-200 ${isPaid ? 'line-through text-zinc-400 dark:text-zinc-500' : ''}`}>{t.fromName}</span>
                    <div className="flex flex-col items-center justify-center text-zinc-300 dark:text-zinc-600 px-2">
                      <span className="text-[10px] uppercase font-semibold text-zinc-400 dark:text-zinc-500 mb-0.5">Pay</span>
                      <ArrowRight className={`w-4 h-4 ${isPaid ? 'text-emerald-300 dark:text-emerald-700' : ''}`} />
                    </div>
                    <span className={`text-zinc-800 dark:text-zinc-200 ${isPaid ? 'line-through text-zinc-400 dark:text-zinc-500' : ''}`}>{t.toName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-bold ${isPaid ? 'text-emerald-500 dark:text-emerald-600 line-through opacity-70' : 'text-emerald-600 dark:text-emerald-400'}`}>RM {t.amount.toFixed(2)}</span>
                    {isPaid ? (
                      <button 
                        onClick={() => handleUndoPayment(t)}
                        className="flex items-center justify-center h-7 px-3 rounded-full text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-200 dark:hover:bg-emerald-800 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors cursor-pointer"
                      >
                        ✅ Settled
                      </button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleSettleUp(t)}
                        className="h-7 px-3 rounded-full text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 hover:text-emerald-800 dark:hover:text-emerald-300"
                      >
                        Mark Paid
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="flex gap-3 pt-2">
        <Button onClick={handleCopy} variant="outline" className="flex-1 rounded-xl h-12 shadow-sm font-medium border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800">
          <Copy className="w-4 h-4 mr-2" /> Copy
        </Button>
        <Button onClick={handleShare} className="flex-1 rounded-xl h-12 shadow-sm font-medium bg-emerald-600 dark:bg-emerald-700 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white">
          <Share className="w-4 h-4 mr-2" /> Share
        </Button>
      </div>

      <div className="pt-6">
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-center py-3 text-[13px] font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors bg-zinc-100/80 dark:bg-zinc-900/80 rounded-xl"
        >
          {showDetails ? "Hide Calculation Details" : "Show Calculation Details"}
        </button>
      </div>

      {showDetails && (
        <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">

          
          {/* Stats Summary */}
          <section className="space-y-4">
            <h3 className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Total Stats</h3>
            <div className="space-y-0 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/50 rounded-2xl shadow-sm overflow-hidden">
              {actualBalances.map((b, idx) => (
                <div key={b.memberId} className={`flex justify-between items-center text-sm p-4 ${idx !== actualBalances.length - 1 ? 'border-b border-zinc-50 dark:border-zinc-800/50' : ''}`}>
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">{b.name}</span>
                  <div className="text-right flex gap-6">
                    <div className="flex flex-col">
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium uppercase mb-0.5">Paid</span>
                      <span className="text-zinc-700 dark:text-zinc-300">{b.paid.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium uppercase mb-0.5">Owed</span>
                      <span className="text-zinc-700 dark:text-zinc-300">{b.owed.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

    </div>
  );
}
