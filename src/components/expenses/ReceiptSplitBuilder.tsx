import { useState, useEffect } from "react";
import { Member } from "@/store/useStore";
import { ReceiptItem, ManualExtractor, GeminiExtractor } from "@/lib/extractor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Camera, Loader2, Receipt } from "lucide-react";

interface ReceiptSplitBuilderProps {
  members: Member[];
  initialItems?: ReceiptItem[];
  onChange: (items: ReceiptItem[], baseCustomAmounts: Record<string, number>) => void;
}

export function ReceiptSplitBuilder({ members, initialItems = [], onChange }: ReceiptSplitBuilderProps) {
  const [items, setItems] = useState<ReceiptItem[]>(initialItems);
  const [isExtracting, setIsExtracting] = useState(false);

  // Calculate and trigger onChange whenever items change
  useEffect(() => {
    const baseAmounts: Record<string, number> = {};
    members.forEach(m => { baseAmounts[m.id] = 0; });

    items.forEach(item => {
      if (item.participants.length > 0 && item.unitPrice > 0 && item.quantity > 0) {
        const itemTotal = item.unitPrice * item.quantity;
        const share = itemTotal / item.participants.length;
        
        item.participants.forEach(pid => {
          if (baseAmounts[pid] !== undefined) {
            baseAmounts[pid] += share;
          }
        });
      }
    });

    onChange(items, baseAmounts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, members]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    try {
      const extractor = new GeminiExtractor();
      const extractedItems = await extractor.extract(file);
      
      if (extractedItems.length > 0) {
        setItems(prev => [...prev, ...extractedItems]);
      } else {
        addItem();
        alert("Could not extract items from receipt. Please add manually.");
      }
    } catch (error) {
      console.error("Extraction failed", error);
      addItem();
    } finally {
      setIsExtracting(false);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const addItem = () => {
    const newItem: ReceiptItem = {
      id: crypto.randomUUID(),
      name: "",
      unitPrice: 0,
      quantity: 1,
      participants: members.map(m => m.id), // Default to all members
    };
    setItems(prev => [...prev, newItem]);
  };

  const updateItem = (id: string, updates: Partial<ReceiptItem>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const toggleParticipant = (itemId: string, participantId: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const isSelected = item.participants.includes(participantId);
        return {
          ...item,
          participants: isSelected 
            ? item.participants.filter(p => p !== participantId)
            : [...item.participants, participantId]
        };
      }
      return item;
    }));
  };

  return (
    <div className="space-y-4">
      <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col items-center justify-center gap-3">
        <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-1">
          <Receipt className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
          <span className="text-sm font-medium">Scan Receipt or Add Manually</span>
        </div>
        
        <div className="flex gap-2 w-full">
          <Button 
            variant="outline" 
            className="flex-1 relative overflow-hidden bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800 h-11 shadow-sm text-zinc-700 dark:text-zinc-300"
            disabled={isExtracting}
          >
            {isExtracting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin text-zinc-400 dark:text-zinc-500" />
            ) : (
              <Camera className="w-4 h-4 mr-2 text-zinc-500 dark:text-zinc-400" />
            )}
            <span className="font-medium">{isExtracting ? "Scanning..." : "Upload Receipt"}</span>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={isExtracting}
            />
          </Button>
          <Button 
            variant="outline" 
            onClick={addItem}
            className="flex-1 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800 h-11 shadow-sm text-zinc-700 dark:text-zinc-300"
          >
            <Plus className="w-4 h-4 mr-2 text-zinc-500 dark:text-zinc-400" />
            <span className="font-medium">Add Item</span>
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-start mb-3 gap-2">
              <div className="flex-1">
                <Input 
                  placeholder="Item Name (e.g., Chicken Pot)" 
                  value={item.name}
                  onChange={e => updateItem(item.id, { name: e.target.value })}
                  className="h-9 text-[13px] font-medium bg-zinc-50/50 dark:bg-zinc-950/50 border-transparent focus-visible:ring-zinc-300 dark:focus-visible:ring-zinc-700 focus-visible:bg-white dark:focus-visible:bg-zinc-950 shadow-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                />
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => removeItem(item.id)}
                className="h-9 w-9 text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 -mr-1"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex gap-2 mb-3">
              <div className="flex-1 space-y-1">
                <Label className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider pl-1">Unit Price (RM)</Label>
                <Input 
                  type="number" 
                  placeholder="0.00" 
                  value={item.unitPrice || ""}
                  onChange={e => updateItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                  className="h-9 text-[13px] font-semibold bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-none text-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div className="w-20 space-y-1">
                <Label className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider pl-1">Qty</Label>
                <Input 
                  type="number" 
                  placeholder="1" 
                  value={item.quantity || ""}
                  onChange={e => updateItem(item.id, { quantity: parseInt(e.target.value) || 0 })}
                  className="h-9 text-[13px] font-semibold text-center bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-none text-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div className="flex-1 space-y-1">
                <Label className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider pl-1 text-right block">Total</Label>
                <div className="h-9 flex items-center justify-end px-3 bg-zinc-100/50 dark:bg-zinc-800/50 border border-transparent rounded-md text-[13px] font-bold text-zinc-700 dark:text-zinc-300">
                  RM {((item.unitPrice || 0) * (item.quantity || 0)).toFixed(2)}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <Label className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium mb-2 block">Shared By ({item.participants.length})</Label>
              <div className="flex flex-wrap gap-1.5">
                {members.map(m => {
                  const isSelected = item.participants.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      onClick={() => toggleParticipant(item.id, m.id)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all active:scale-95 ${
                        isSelected 
                          ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-md shadow-zinc-900/10 dark:shadow-black/20" 
                          : "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      }`}
                    >
                      {m.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && !isExtracting && (
          <div className="text-center py-6 text-sm text-zinc-400 dark:text-zinc-500 font-medium border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
            No items yet. Upload a receipt or add manually.
          </div>
        )}
      </div>
    </div>
  );
}
