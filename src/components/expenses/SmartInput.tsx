import { useState } from "react";
import { useStore } from "@/store/useStore";
import { parseExpenseText } from "@/lib/parser";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export function SmartInput() {
  const [text, setText] = useState("");
  const { groups, activeGroupId, addExpenses } = useStore();
  const group = groups.find(g => g.id === activeGroupId);

  const handleParse = () => {
    if (!text.trim() || !group) return;
    const parsed = parseExpenseText(text, group.members);
    
    // Check if any parsing failed or has null payer
    const validExpenses = parsed.filter(p => p.amount > 0 && p.payerId);
    
    if (validExpenses.length === 0) {
      alert("Could not parse any valid expenses. Please check the format.\nExample:\nGrab去 - 10 zx\n除3");
      return;
    }

    if (validExpenses.length < parsed.length) {
      alert(`Parsed ${validExpenses.length} out of ${parsed.length} items. Some were invalid or missing payer.`);
    }

    addExpenses(validExpenses as any);
    setText(""); // Clear after successful parse
  };

  return (
    <div className="space-y-4 bg-zinc-50/80 p-5 rounded-2xl border border-zinc-100">
      <div className="flex items-center gap-2 text-zinc-800 mb-1">
        <Sparkles className="w-4 h-4 text-amber-500" />
        <h2 className="text-sm font-medium">Smart Input</h2>
      </div>
      <Textarea
        placeholder="14/6 Grab - 10 Alex&#10;Dinner - 51 Jason&#10;Drinks - 17.9 Sarah&#10;Grab return - 9 Alex&#10;Split all"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="min-h-[140px] resize-none bg-white border-zinc-200 text-[15px] leading-relaxed rounded-xl shadow-sm"
      />
      <Button onClick={handleParse} className="w-full h-12 rounded-xl shadow-none font-medium text-sm" disabled={!text.trim()}>
        Parse & Add
      </Button>
    </div>
  );
}
