import { useState, useEffect } from "react";
import { useStore, Expense, SplitType } from "@/store/useStore";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMediaQuery } from "@/hooks/use-media-query";

interface ExpenseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenseToEdit?: Expense | null;
}

export function ExpenseForm({ open, onOpenChange, expenseToEdit }: ExpenseFormProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { groups, activeGroupId, addExpense, updateExpense } = useStore();
  const group = groups.find(g => g.id === activeGroupId);
  
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [payerId, setPayerId] = useState<string>("");
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [splitType, setSplitType] = useState<SplitType>("EQUAL");
  const [baseCustomAmounts, setBaseCustomAmounts] = useState<Record<string, string>>({});
  const [additionalChargesMode, setAdditionalChargesMode] = useState<'NONE' | 'PERCENT' | 'RM'>('NONE');
  const [serviceChargePct, setServiceChargePct] = useState("");
  const [taxPct, setTaxPct] = useState("");
  const [extraChargesAmount, setExtraChargesAmount] = useState("");

  useEffect(() => {
    if (open && group) {
      if (expenseToEdit) {
        setDescription(expenseToEdit.description);
        setAmount(expenseToEdit.amount.toString());
        setPayerId(expenseToEdit.payerId);
        setParticipantIds(expenseToEdit.participantIds);
        setSplitType(expenseToEdit.splitType || "EQUAL");
        
        const stringBaseAmounts: Record<string, string> = {};
        if (expenseToEdit.baseCustomAmounts) {
          for (const [k, v] of Object.entries(expenseToEdit.baseCustomAmounts)) {
            stringBaseAmounts[k] = v.toString();
          }
        } else if (expenseToEdit.customAmounts) { // fallback
          for (const [k, v] of Object.entries(expenseToEdit.customAmounts)) {
            stringBaseAmounts[k] = v.toString();
          }
        }
        setBaseCustomAmounts(stringBaseAmounts);
        setAdditionalChargesMode(expenseToEdit.additionalChargesMode || 'NONE');
        setServiceChargePct(expenseToEdit.serviceChargePct?.toString() || "");
        setTaxPct(expenseToEdit.taxPct?.toString() || "");
        setExtraChargesAmount(expenseToEdit.extraChargesAmount?.toString() || "");
      } else {
        setDescription("");
        setAmount("");
        setPayerId(group.members[0]?.id || "");
        setParticipantIds(group.members.map(m => m.id)); // Default to all
        setSplitType("EQUAL");
        setBaseCustomAmounts({});
        setAdditionalChargesMode('NONE');
        setServiceChargePct("");
        setTaxPct("");
        setExtraChargesAmount("");
      }
    }
  }, [open, expenseToEdit, group]);

  if (!group) return null;

  const parsedAmount = parseFloat(amount) || 0;
  
  const subtotal = participantIds.reduce((sum, id) => sum + (parseFloat(baseCustomAmounts[id]) || 0), 0);
  
  let computedExtra = 0;
  if (additionalChargesMode === 'PERCENT') {
    const sc = parseFloat(serviceChargePct) || 0;
    const tax = parseFloat(taxPct) || 0;
    computedExtra = subtotal * ((sc + tax) / 100);
  } else if (additionalChargesMode === 'RM') {
    computedExtra = parseFloat(extraChargesAmount) || 0;
  }
  
  const grandTotal = subtotal + computedExtra;
  const diff = parsedAmount - grandTotal;

  const isSaveDisabled = 
    !description.trim() || 
    !amount || 
    !payerId || 
    participantIds.length === 0 ||
    (splitType === "CUSTOM" && Math.abs(diff) > 0.01) ||
    (splitType === "CUSTOM" && subtotal === 0);

  const handleSave = () => {
    if (isSaveDisabled) return;

    let finalCustomAmounts: Record<string, number> | undefined = undefined;
    let finalBaseCustomAmounts: Record<string, number> | undefined = undefined;
    
    if (splitType === "CUSTOM") {
      finalCustomAmounts = {};
      finalBaseCustomAmounts = {};
      
      for (const id of participantIds) {
        const base = parseFloat(baseCustomAmounts[id]) || 0;
        finalBaseCustomAmounts[id] = base;
        finalCustomAmounts[id] = parsedAmount * (base / subtotal);
      }
    }

    const payload = {
      description: description.trim(),
      amount: parsedAmount,
      payerId,
      participantIds,
      splitType,
      customAmounts: finalCustomAmounts,
      baseCustomAmounts: finalBaseCustomAmounts,
      additionalChargesMode: splitType === 'CUSTOM' ? additionalChargesMode : 'NONE',
      serviceChargePct: additionalChargesMode === 'PERCENT' ? (parseFloat(serviceChargePct) || undefined) : undefined,
      taxPct: additionalChargesMode === 'PERCENT' ? (parseFloat(taxPct) || undefined) : undefined,
      extraChargesAmount: additionalChargesMode === 'RM' ? (parseFloat(extraChargesAmount) || undefined) : undefined,
    };

    if (expenseToEdit) {
      updateExpense(expenseToEdit.id, payload);
    } else {
      addExpense(payload);
    }
    
    onOpenChange(false);
  };

  const toggleParticipant = (id: string) => {
    setParticipantIds(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (participantIds.length === group.members.length) {
      setParticipantIds([]);
    } else {
      setParticipantIds(group.members.map(m => m.id));
    }
  };

  const formContent = (
    <div className="space-y-6 px-4 py-2">
      <div className="space-y-2">
        <Label className="text-zinc-500 font-medium">Description</Label>
        <Input 
          placeholder="e.g. Dinner, Grab..." 
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="text-lg h-14 bg-zinc-50/80 border-transparent focus-visible:ring-zinc-300 focus-visible:bg-white rounded-xl shadow-none"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-zinc-500 font-medium">Amount (RM)</Label>
        <Input 
          type="number"
          placeholder="0.00" 
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="text-2xl h-14 font-semibold bg-zinc-50/80 border-transparent focus-visible:ring-zinc-300 focus-visible:bg-white rounded-xl shadow-none"
        />
      </div>

      <div className="space-y-3">
        <Label className="text-zinc-500 font-medium">Paid By</Label>
        <div className="flex flex-wrap gap-2">
          {group.members.map(m => (
            <button
              key={m.id}
              onClick={() => setPayerId(m.id)}
              className={`px-4 py-2.5 rounded-xl text-[15px] font-medium transition-colors ${
                payerId === m.id 
                  ? "bg-zinc-900 text-white shadow-md shadow-zinc-900/10" 
                  : "bg-zinc-100/80 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 pb-4">
        <div className="flex items-center justify-between">
          <Label className="text-zinc-500 font-medium">Split Between</Label>
          <button onClick={toggleAll} className="text-xs font-medium text-emerald-600 hover:text-emerald-700">
            {participantIds.length === group.members.length ? "Deselect All" : "Select All"}
          </button>
        </div>

        <div className="flex gap-2 p-1 bg-zinc-100/80 rounded-lg">
          <button 
            onClick={() => setSplitType('EQUAL')}
            className={`flex-1 py-1.5 text-[13px] font-semibold rounded-md transition-all ${splitType === 'EQUAL' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            Equal Split
          </button>
          <button 
            onClick={() => setSplitType('CUSTOM')}
            className={`flex-1 py-1.5 text-[13px] font-semibold rounded-md transition-all ${splitType === 'CUSTOM' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            Custom Amounts
          </button>
        </div>

        <div className={`flex ${splitType === 'CUSTOM' ? 'flex-col gap-3 mt-4' : 'flex-wrap gap-2 mt-3'}`}>
          {group.members.map(m => {
            const isSelected = participantIds.includes(m.id);
            return (
              <div key={m.id} className={splitType === 'CUSTOM' ? "flex items-center gap-3" : ""}>
                <button
                  onClick={() => toggleParticipant(m.id)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-[15px] font-medium transition-all active:scale-[0.98] ${
                    isSelected 
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/30 shadow-sm" 
                      : "bg-white text-zinc-400 border border-zinc-200"
                  } ${splitType === 'CUSTOM' ? "flex-1 justify-start h-12" : ""}`}
                >
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center border transition-colors shrink-0 ${isSelected ? "border-emerald-500 bg-emerald-500 text-white" : "border-zinc-300"}`}>
                    {isSelected && <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none"><path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  {m.name}
                </button>
                
                {splitType === 'CUSTOM' && isSelected && (
                  <div className="w-[100px] shrink-0 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm font-medium">RM</span>
                    <Input 
                      type="number"
                      placeholder="0.00"
                      value={baseCustomAmounts[m.id] || ""}
                      onChange={(e) => setBaseCustomAmounts(prev => ({ ...prev, [m.id]: e.target.value }))}
                      className="pl-9 pr-3 h-12 bg-zinc-50 border-zinc-200 font-semibold focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {splitType === 'CUSTOM' && participantIds.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-zinc-500 font-medium">Additional Charges</Label>
              <div className="flex bg-zinc-100 rounded-md p-0.5">
                <button 
                  onClick={() => setAdditionalChargesMode('NONE')}
                  className={`px-3 py-1 text-[11px] font-bold rounded uppercase transition-colors ${additionalChargesMode === 'NONE' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}
                >None</button>
                <button 
                  onClick={() => setAdditionalChargesMode('PERCENT')}
                  className={`px-3 py-1 text-[11px] font-bold rounded uppercase transition-colors ${additionalChargesMode === 'PERCENT' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}
                >%</button>
                <button 
                  onClick={() => setAdditionalChargesMode('RM')}
                  className={`px-3 py-1 text-[11px] font-bold rounded uppercase transition-colors ${additionalChargesMode === 'RM' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}
                >RM</button>
              </div>
            </div>

            {additionalChargesMode === 'PERCENT' && (
              <div className="flex gap-3">
                <div className="flex-1 space-y-2">
                  <Label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Service Charge (%)</Label>
                  <Input type="number" placeholder="10" value={serviceChargePct} onChange={e => setServiceChargePct(e.target.value)} className="bg-zinc-50 border-zinc-200 shadow-none h-11" />
                </div>
                <div className="flex-1 space-y-2">
                  <Label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Tax (%)</Label>
                  <Input type="number" placeholder="6" value={taxPct} onChange={e => setTaxPct(e.target.value)} className="bg-zinc-50 border-zinc-200 shadow-none h-11" />
                </div>
              </div>
            )}

            {additionalChargesMode === 'RM' && (
              <div className="space-y-2">
                <Label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Extra Charges (RM)</Label>
                <Input type="number" placeholder="0.00" value={extraChargesAmount} onChange={e => setExtraChargesAmount(e.target.value)} className="bg-zinc-50 border-zinc-200 shadow-none h-11" />
              </div>
            )}

            {(additionalChargesMode !== 'NONE' || Math.abs(diff) > 0.01) && (
              <div className="bg-zinc-50 rounded-xl p-4 space-y-2.5 border border-zinc-100">
                <div className="flex justify-between text-[13px] text-zinc-500 font-medium">
                  <span>Subtotal</span>
                  <span>RM {subtotal.toFixed(2)}</span>
                </div>
                {additionalChargesMode !== 'NONE' && (
                  <div className="flex justify-between text-[13px] text-zinc-500 font-medium">
                    <span>Total Extra</span>
                    <span>RM {computedExtra.toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-2.5 mt-2.5 border-t border-zinc-200/80 flex justify-between font-bold text-sm">
                  <span className="text-zinc-900">Grand Total</span>
                  <span className="text-emerald-600">RM {grandTotal.toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className={`p-3 rounded-xl border text-center text-[13px] font-bold uppercase tracking-wide ${
              Math.abs(diff) < 0.01 ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
              : diff > 0 ? "bg-zinc-50 text-zinc-600 border-zinc-200"
              : "bg-red-50 text-red-600 border-red-100"
            }`}>
              {Math.abs(diff) < 0.01 ? "RM 0.00 Remaining 🎉" 
               : diff > 0 ? `Missing: RM ${diff.toFixed(2)}`
               : `Over by: RM ${Math.abs(diff).toFixed(2)}`}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl p-0 overflow-hidden gap-0 border-zinc-100">
          <DialogHeader className="px-6 pt-6 pb-2 border-b border-zinc-50">
            <DialogTitle className="text-xl">{expenseToEdit ? "Edit Expense" : "Add Expense"}</DialogTitle>
          </DialogHeader>
          <div className="px-2 max-h-[60vh] overflow-y-auto">
            {formContent}
          </div>
          <DialogFooter className="p-4 bg-zinc-50/50 border-t border-zinc-100">
            <Button onClick={handleSave} disabled={isSaveDisabled} className="w-full h-12 rounded-xl text-base shadow-none font-medium disabled:opacity-50 disabled:bg-zinc-900">
              Save Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-white border-zinc-100 focus:outline-none">
        <DrawerHeader className="text-left border-b border-zinc-50 pb-4">
          <DrawerTitle className="text-2xl font-bold">{expenseToEdit ? "Edit Expense" : "New Expense"}</DrawerTitle>
        </DrawerHeader>
        <div className="max-h-[80vh] overflow-y-auto py-2">
          {formContent}
        </div>
        <DrawerFooter className="pt-2 border-t border-zinc-50 pb-8">
          <Button onClick={handleSave} disabled={isSaveDisabled} className="w-full h-14 rounded-xl text-lg font-medium shadow-none disabled:opacity-50 disabled:bg-zinc-900">
            Save
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
