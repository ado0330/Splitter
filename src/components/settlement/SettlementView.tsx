import { useStore } from "@/store/useStore";
import { calculateBalances, calculateSettlement } from "@/lib/algorithm";
import { ArrowRight, Copy, Share } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SettlementView() {
  const { groups, activeGroupId } = useStore();
  const group = groups.find(g => g.id === activeGroupId);
  
  if (!group || group.expenses.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-400 text-sm">
        No expenses to settle.
      </div>
    );
  }

  const balances = calculateBalances(group.members, group.expenses);
  const transfers = calculateSettlement(balances);

  const generateShareText = () => {
    let text = `${group.name}\n\nSettlement Result\n\n`;
    if (transfers.length === 0) {
      text += "Everyone is settled up! 🎉";
    } else {
      transfers.forEach(t => {
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
    <div className="space-y-10 pb-10 animate-in fade-in duration-300">
      
      <div className="flex gap-3">
        <Button onClick={handleCopy} variant="outline" className="flex-1 rounded-xl h-12 shadow-sm font-medium border-zinc-200 text-zinc-700 bg-white hover:bg-zinc-50">
          <Copy className="w-4 h-4 mr-2" /> Copy
        </Button>
        <Button onClick={handleShare} className="flex-1 rounded-xl h-12 shadow-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white">
          <Share className="w-4 h-4 mr-2" /> Share
        </Button>
      </div>

      {/* Settlement Plan */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-zinc-800">Optimized Settlement Plan</h3>
        {transfers.length === 0 ? (
          <div className="p-6 bg-emerald-50 rounded-2xl text-center text-sm font-medium text-emerald-600 border border-emerald-100">
            Everyone is settled up! 🎉
          </div>
        ) : (
          <div className="space-y-3">
            {transfers.map((t, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white border border-zinc-100 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3 font-medium text-[15px]">
                  <span className="text-zinc-800">{t.fromName}</span>
                  <div className="flex flex-col items-center justify-center text-zinc-300 px-2">
                    <span className="text-[10px] uppercase font-semibold text-zinc-400 mb-0.5">Pay</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                  <span className="text-zinc-800">{t.toName}</span>
                </div>
                <span className="font-bold text-emerald-600">RM {t.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Net Balance */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-zinc-800">Net Balance</h3>
        <div className="grid grid-cols-2 gap-3">
          {balances.map(b => (
            <div key={b.memberId} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex flex-col gap-1">
              <span className="text-xs font-medium text-zinc-500">{b.name}</span>
              <span className={`text-lg font-bold ${b.net > 0 ? 'text-emerald-500' : b.net < 0 ? 'text-red-500' : 'text-zinc-400'}`}>
                {b.net > 0 ? '+' : ''}{b.net.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </section>
      
      {/* Stats Summary */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-zinc-800">Total Stats</h3>
        <div className="space-y-0 bg-white border border-zinc-100 rounded-2xl shadow-sm overflow-hidden">
          {balances.map((b, idx) => (
            <div key={b.memberId} className={`flex justify-between items-center text-sm p-4 ${idx !== balances.length - 1 ? 'border-b border-zinc-50' : ''}`}>
              <span className="font-medium text-zinc-800">{b.name}</span>
              <div className="text-right flex gap-6">
                <div className="flex flex-col">
                  <span className="text-[11px] text-zinc-400 font-medium uppercase mb-0.5">Paid</span>
                  <span className="text-zinc-700">{b.paid.toFixed(2)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-zinc-400 font-medium uppercase mb-0.5">Owed</span>
                  <span className="text-zinc-700">{b.owed.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
