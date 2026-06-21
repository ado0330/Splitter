import { useState, useEffect } from "react";
import { useStore, Expense, SplitType } from "@/store/useStore";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ReceiptSplitBuilder } from "./ReceiptSplitBuilder";
import { ReceiptItem } from "@/lib/extractor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMediaQuery } from "@/hooks/use-media-query";
import { evaluateMath } from "@/lib/utils";

interface ExpenseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenseToEdit?: Expense | null;
}

export function ExpenseForm({ open, onOpenChange, expenseToEdit }: ExpenseFormProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { groups, activeGroupId, addExpense, updateExpense } = useStore();
  const group = groups.find(g => g.id === activeGroupId);
  const getTodayString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [description, setDescription] = useState("");
  const [expenseDate, setExpenseDate] = useState(getTodayString());
  const [amount, setAmount] = useState("");
  const [payerId, setPayerId] = useState<string>("");
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [splitType, setSplitType] = useState<SplitType>("EQUAL");
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
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
        setReceiptItems(expenseToEdit.receiptItems || []);
        
        if (expenseToEdit.createdAt) {
          const d = new Date(expenseToEdit.createdAt);
          setExpenseDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
        } else {
          setExpenseDate(getTodayString());
        }
        
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
        setExpenseDate(getTodayString());
        setAmount("");
        setPayerId(group.members[0]?.id || "");
        setParticipantIds(group.members.map(m => m.id)); // Default to all
        setSplitType("EQUAL");
        setReceiptItems([]);
        setBaseCustomAmounts({});
        setAdditionalChargesMode('NONE');
        setServiceChargePct("");
        setTaxPct("");
        setExtraChargesAmount("");
      }
    }
  }, [open, expenseToEdit, group]);

  if (!group) return null;

  const parsedAmount = evaluateMath(amount);
  
  const subtotal = participantIds.reduce((sum, id) => sum + evaluateMath(baseCustomAmounts[id] || ""), 0);
  
  let computedExtra = 0;
  if (additionalChargesMode === 'PERCENT') {
    const sc = evaluateMath(serviceChargePct);
    const tax = evaluateMath(taxPct);
    computedExtra = subtotal * ((sc + tax) / 100);
  } else if (additionalChargesMode === 'RM') {
    computedExtra = evaluateMath(extraChargesAmount);
  }
  
  const grandTotal = subtotal + computedExtra;
  const diff = parsedAmount - grandTotal;

  const isSaveDisabled = 
    !description.trim() || 
    !amount || 
    !payerId || 
    participantIds.length === 0 ||
    (splitType !== "EQUAL" && Math.abs(diff) > 0.01) ||
    (splitType !== "EQUAL" && subtotal === 0);

  const handleSave = () => {
    if (isSaveDisabled) return;

    let finalCustomAmounts: Record<string, number> | undefined = undefined;
    let finalBaseCustomAmounts: Record<string, number> | undefined = undefined;
    
    if (splitType !== "EQUAL") {
      finalCustomAmounts = {};
      finalBaseCustomAmounts = {};
      
      for (const id of participantIds) {
        const base = evaluateMath(baseCustomAmounts[id] || "");
        finalBaseCustomAmounts[id] = base;
        finalCustomAmounts[id] = parsedAmount * (base / subtotal);
      }
    }

    const [y, m, d] = expenseDate.split('-');
    const parsedDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d), 12, 0, 0);

    const payload = {
      description: description.trim(),
      amount: parsedAmount,
      payerId,
      participantIds,
      splitType,
      customAmounts: finalCustomAmounts,
      baseCustomAmounts: finalBaseCustomAmounts,
      receiptItems: splitType === 'ITEMIZED' ? receiptItems : undefined,
      additionalChargesMode: splitType !== 'EQUAL' ? additionalChargesMode : 'NONE',
      serviceChargePct: additionalChargesMode === 'PERCENT' ? (evaluateMath(serviceChargePct) || undefined) : undefined,
      taxPct: additionalChargesMode === 'PERCENT' ? (evaluateMath(taxPct) || undefined) : undefined,
      extraChargesAmount: additionalChargesMode === 'RM' ? (evaluateMath(extraChargesAmount) || undefined) : undefined,
      createdAt: parsedDate,
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
    <div className="space-y-4 px-4 py-1">
      <div className="space-y-1.5">
        <Label className="text-zinc-500 font-medium">Description</Label>
        <Input 
          placeholder="e.g. Dinner, Grab..." 
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="text-base h-12 bg-zinc-50/80 dark:bg-zinc-900/80 border-transparent focus-visible:ring-zinc-300 dark:focus-visible:ring-zinc-700 focus-visible:bg-white dark:focus-visible:bg-zinc-900 rounded-xl shadow-none"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-zinc-500 font-medium">Date</Label>
        <Input 
          type="date"
          value={expenseDate}
          onChange={e => setExpenseDate(e.target.value)}
          className="text-base h-12 bg-zinc-50/80 dark:bg-zinc-900/80 border-transparent focus-visible:ring-zinc-300 dark:focus-visible:ring-zinc-700 focus-visible:bg-white dark:focus-visible:bg-zinc-900 rounded-xl shadow-none [color-scheme:light] dark:[color-scheme:dark]"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-zinc-500 font-medium">Amount (RM)</Label>
        <Input 
          type="text"
          placeholder="0.00 or 10+5" 
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="text-xl h-12 font-semibold bg-zinc-50/80 dark:bg-zinc-900/80 border-transparent focus-visible:ring-zinc-300 dark:focus-visible:ring-zinc-700 focus-visible:bg-white dark:focus-visible:bg-zinc-900 rounded-xl shadow-none"
        />
        {/[+\-*/()]/.test(amount) && (
          <p className="text-[11px] font-bold text-emerald-600">
            = RM {evaluateMath(amount).toFixed(2)}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-zinc-500 font-medium">Paid By</Label>
        <div className="flex flex-wrap gap-2">
          {group.members.map(m => (
            <button
              key={m.id}
              onClick={() => setPayerId(m.id)}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                payerId === m.id 
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-md shadow-zinc-900/10 dark:shadow-black/20" 
                  : "bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 pb-2">
        <div className="flex items-center justify-between">
          <Label className="text-zinc-500 font-medium">Split Between</Label>
          <button onClick={toggleAll} className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-wider">
            {participantIds.length === group.members.length ? "Deselect All" : "Select All"}
          </button>
        </div>

        <div className="flex gap-2 p-1 bg-zinc-100/80 dark:bg-zinc-900/80 rounded-lg">
          <button 
            onClick={() => setSplitType('EQUAL')}
            className={`flex-1 py-1 text-[12px] font-bold rounded-md transition-all ${splitType === 'EQUAL' ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
          >
            Equal
          </button>
          <button 
            onClick={() => setSplitType('CUSTOM')}
            className={`flex-1 py-1 text-[12px] font-bold rounded-md transition-all ${splitType === 'CUSTOM' ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
          >
            Custom
          </button>
          <button 
            onClick={() => setSplitType('ITEMIZED')}
            className={`flex-1 py-1 text-[12px] font-bold rounded-md transition-all ${splitType === 'ITEMIZED' ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
          >
            Receipt
          </button>
        </div>

        {splitType === 'ITEMIZED' && (
          <div className="mt-3">
            <ReceiptSplitBuilder 
              members={group.members} 
              initialItems={receiptItems} 
              onChange={(items, baseAmounts) => {
                setReceiptItems(items);
                const strBaseAmounts: Record<string, string> = {};
                for (const [k, v] of Object.entries(baseAmounts)) {
                  strBaseAmounts[k] = v.toFixed(2);
                }
                setBaseCustomAmounts(strBaseAmounts);
                // Also automatically select participants that have an amount
                const activeIds = Object.entries(baseAmounts).filter(([, v]) => v > 0).map(([k]) => k);
                setParticipantIds(activeIds);
              }} 
            />
          </div>
        )}

        {splitType !== 'ITEMIZED' && (
          <div className={`flex ${splitType === 'CUSTOM' ? 'flex-col gap-2 mt-3' : 'flex-wrap gap-2 mt-2'}`}>
            {group.members.map(m => {
            const isSelected = participantIds.includes(m.id);
            return (
              <div key={m.id} id={`participant-row-${m.id}`} className={splitType === 'CUSTOM' ? "flex items-center gap-2" : ""}>
                <button
                  onClick={() => toggleParticipant(m.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-all active:scale-[0.98] ${
                    isSelected 
                      ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500/30 shadow-sm" 
                      : "bg-white dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-800"
                  } ${splitType === 'CUSTOM' ? "flex-1 justify-start h-10" : ""}`}
                >
                  <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors shrink-0 ${isSelected ? "border-emerald-500 bg-emerald-500 text-white" : "border-zinc-300"}`}>
                    {isSelected && <svg className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="none"><path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  {m.name}
                </button>
                
                {splitType === 'CUSTOM' && isSelected && (
                  <div className="w-[110px] shrink-0 relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-medium">RM</span>
                    <Input 
                      type="text"
                      placeholder="0.00"
                      value={baseCustomAmounts[m.id] || ""}
                      onChange={(e) => setBaseCustomAmounts(prev => ({ ...prev, [m.id]: e.target.value }))}
                      onFocus={() => {
                        setTimeout(() => {
                          const row = document.getElementById(`participant-row-${m.id}`);
                          if (row) {
                            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }
                        }, 300);
                      }}
                      className="pl-8 pr-2 h-10 text-[16px] bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 font-semibold focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500 dark:focus-visible:border-emerald-500"
                    />
                    {/[+\-*/()]/.test(baseCustomAmounts[m.id] || "") && (
                      <div className="absolute -bottom-4 right-1 text-[10px] font-bold text-emerald-600">
                        = {evaluateMath(baseCustomAmounts[m.id]).toFixed(2)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        )}

        {splitType !== 'EQUAL' && participantIds.length > 0 && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-zinc-500 font-medium">Additional Charges</Label>
              <div className="flex bg-zinc-100 dark:bg-zinc-900 rounded-md p-0.5">
                <button 
                  onClick={() => setAdditionalChargesMode('NONE')}
                  className={`px-2.5 py-0.5 text-[10px] font-bold rounded uppercase transition-colors ${additionalChargesMode === 'NONE' ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                >None</button>
                <button 
                  onClick={() => setAdditionalChargesMode('PERCENT')}
                  className={`px-2.5 py-0.5 text-[10px] font-bold rounded uppercase transition-colors ${additionalChargesMode === 'PERCENT' ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                >%</button>
                <button 
                  onClick={() => setAdditionalChargesMode('RM')}
                  className={`px-2.5 py-0.5 text-[10px] font-bold rounded uppercase transition-colors ${additionalChargesMode === 'RM' ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                >RM</button>
              </div>
            </div>

            {additionalChargesMode === 'PERCENT' && (
              <div className="flex gap-2">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Service Charge (%)</Label>
                  <Input type="text" placeholder="10" value={serviceChargePct} onChange={e => setServiceChargePct(e.target.value)} className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-none h-10 text-[13px]" />
                </div>
                <div className="flex-1 space-y-1.5">
                  <Label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Tax (%)</Label>
                  <Input type="text" placeholder="6" value={taxPct} onChange={e => setTaxPct(e.target.value)} className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-none h-10 text-[13px]" />
                </div>
              </div>
            )}

            {additionalChargesMode === 'RM' && (
              <div className="space-y-1.5 pb-2">
                <Label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Extra Charges (RM)</Label>
                <div className="relative">
                  <Input type="text" placeholder="0.00 or 10+5" value={extraChargesAmount} onChange={e => setExtraChargesAmount(e.target.value)} className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-none h-10 text-[13px]" />
                  {/[+\-*/()]/.test(extraChargesAmount) && (
                    <div className="absolute -bottom-4 right-1 text-[10px] font-bold text-emerald-600">
                      = {evaluateMath(extraChargesAmount).toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {(additionalChargesMode !== 'NONE' || Math.abs(diff) > 0.01) && (
              <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-3 space-y-2 border border-zinc-100 dark:border-zinc-800/50">
                <div className="flex justify-between text-[12px] text-zinc-500 dark:text-zinc-400 font-medium">
                  <span>Subtotal</span>
                  <span>RM {subtotal.toFixed(2)}</span>
                </div>
                {additionalChargesMode !== 'NONE' && (
                  <div className="flex justify-between text-[12px] text-zinc-500 dark:text-zinc-400 font-medium">
                    <span>Total Extra</span>
                    <span>RM {computedExtra.toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-2 mt-2 border-t border-zinc-200/80 dark:border-zinc-800/80 flex justify-between font-bold text-[13px]">
                  <span className="text-zinc-900 dark:text-zinc-100">Grand Total</span>
                  <span className="text-emerald-600 dark:text-emerald-400">RM {grandTotal.toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className={`p-3 rounded-xl border text-center text-[13px] font-bold uppercase tracking-wide ${
              Math.abs(diff) < 0.01 ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50" 
              : diff > 0 ? "bg-zinc-50 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800"
              : "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/50"
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
        <DialogContent className="sm:max-w-[425px] rounded-2xl p-0 overflow-hidden gap-0 border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <DialogHeader className="px-6 pt-6 pb-2 border-b border-zinc-50 dark:border-zinc-800/50">
            <DialogTitle className="text-xl">{(expenseToEdit ? "Edit Expense" : "Add Expense")}</DialogTitle>
          </DialogHeader>
          <div className="px-2 max-h-[60vh] overflow-y-auto">
            {formContent}
          </div>
          <DialogFooter className="p-4 bg-zinc-50/50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800/50">
            <Button onClick={handleSave} disabled={isSaveDisabled} className="w-full h-12 rounded-xl text-base shadow-none font-medium disabled:opacity-50 disabled:bg-zinc-900 dark:disabled:bg-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900">
              Save Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-white dark:bg-zinc-950 border-zinc-100 dark:border-zinc-800 focus:outline-none">
        <DrawerHeader className="text-left border-b border-zinc-50 dark:border-zinc-800/50 pb-3">
          <DrawerTitle className="text-xl font-bold">{expenseToEdit ? "Edit Expense" : "New Expense"}</DrawerTitle>
        </DrawerHeader>
        <div className="max-h-[85vh] overflow-y-auto py-2">
          {formContent}
        </div>
        <DrawerFooter className="pt-2 border-t border-zinc-50 dark:border-zinc-800/50 pb-6">
          <Button onClick={handleSave} disabled={isSaveDisabled} className="w-full h-12 rounded-xl text-base font-medium shadow-none disabled:opacity-50 disabled:bg-zinc-900 dark:disabled:bg-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900">
            Save
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
