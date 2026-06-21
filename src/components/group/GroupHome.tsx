import { useState } from 'react';
import { useStore, Group } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Copy, Trash2, Edit2, Plus, Users, ReceiptText, Pin, PinOff } from 'lucide-react';
import { CreateGroup } from './CreateGroup';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent, TouchSensor, MouseSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { calculateBalances, calculateSettlement } from '@/lib/algorithm';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserMenu } from '@/components/auth/UserMenu';

function SortableGroupCard({ group, onSelect, onMenuAction }: { group: Group, onSelect: () => void, onMenuAction: (action: string, group: Group) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: group.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    position: 'relative' as const,
  };

  const rawExpenses = group.expenses.filter(e => !e.isPayment);

  const lastExpense = rawExpenses.length > 0 
    ? rawExpenses.reduce((latest, e) => new Date(e.createdAt) > new Date(latest.createdAt) ? e : latest)
    : null;
  const lastUpdatedDate = lastExpense ? new Date(lastExpense.createdAt) : new Date(group.createdAt);
  
  const diffInDays = Math.floor((new Date().getTime() - lastUpdatedDate.getTime()) / (1000 * 60 * 60 * 24));
  let timeAgo = "Today";
  if (diffInDays === 1) timeAgo = "Yesterday";
  else if (diffInDays > 1) timeAgo = `${diffInDays}d ago`;

  const uniqueDays = new Set(rawExpenses.map(e => new Date(e.createdAt).toDateString())).size;
  
  const balances = calculateBalances(group.members, group.expenses); // include payments to see actual remaining debt
  const transfers = calculateSettlement(balances);
  
  const isEmpty = rawExpenses.length === 0;
  const isSettled = !isEmpty && transfers.length === 0;

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className={`bg-white dark:bg-zinc-900 rounded-2xl p-5 border shadow-sm transition-all group/card cursor-grab active:cursor-grabbing touch-manipulation ${isDragging ? 'shadow-xl scale-105 border-emerald-200 dark:border-emerald-800/50' : 'border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700'} ${group.isPinned ? 'ring-1 ring-emerald-500/20 bg-emerald-50/10 dark:bg-emerald-950/20' : ''}`}
      onClick={onSelect}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 mb-0.5">{group.name}</h3>
            {group.isPinned && <Pin className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 fill-emerald-500 dark:fill-emerald-400 shrink-0" />}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            {group.members.length} {group.members.length === 1 ? 'member' : 'members'} • {uniqueDays} {uniqueDays === 1 ? 'day' : 'days'}
          </p>
        </div>
        
        <div 
          onClick={(e) => {
            e.stopPropagation(); // Prevent card click and drag
          }}
          onPointerDown={(e) => e.stopPropagation()} // Prevent drag start when interacting with menu
        >
          <DropdownMenu>
            <DropdownMenuTrigger className="h-8 w-8 flex items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus:outline-none">
              <MoreVertical className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-xl border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl p-1.5 z-50">
              <DropdownMenuItem onClick={() => onMenuAction('pin', group)} className="rounded-lg cursor-pointer text-zinc-700 dark:text-zinc-300 focus:bg-zinc-50 dark:focus:bg-zinc-800 py-2.5 font-medium text-sm">
                {group.isPinned ? <><PinOff className="w-4 h-4 mr-2 text-zinc-400" /> Unpin</> : <><Pin className="w-4 h-4 mr-2 text-zinc-400" /> Pin Group</>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onMenuAction('rename', group)} className="rounded-lg cursor-pointer text-zinc-700 dark:text-zinc-300 focus:bg-zinc-50 dark:focus:bg-zinc-800 py-2.5 font-medium text-sm">
                <Edit2 className="w-4 h-4 mr-2 text-zinc-400" /> Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onMenuAction('duplicate', group)} className="rounded-lg cursor-pointer text-zinc-700 dark:text-zinc-300 focus:bg-zinc-50 dark:focus:bg-zinc-800 py-2.5 font-medium text-sm">
                <Copy className="w-4 h-4 mr-2 text-zinc-400" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onMenuAction('delete', group)} className="rounded-lg cursor-pointer text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/50 py-2.5 font-medium text-sm">
                <Trash2 className="w-4 h-4 mr-2 text-red-400" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-50 dark:border-zinc-800/50">
        <div>
          {isEmpty ? (
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
              ⚪ Empty Trip
            </span>
          ) : isSettled ? (
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
              🎉 All Settled
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 text-[10px] font-bold uppercase tracking-wider">
              🟠 Settlement Pending
            </span>
          )}
        </div>
        
        <div className="text-[11px] text-zinc-400 font-medium">
          Updated {timeAgo}
        </div>
      </div>
    </div>
  );
}

export function GroupHome() {
  const { groups, setActiveGroup, deleteGroup, duplicateGroup, renameGroup, togglePinGroup, reorderGroups } = useStore();
  const [createOpen, setCreateOpen] = useState(false);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderGroups(active.id as string, over.id as string);
    }
  };

  const handleMenuAction = (action: string, group: Group) => {
    switch (action) {
      case 'pin':
        togglePinGroup(group.id);
        break;
      case 'rename': {
        const newName = prompt("Enter new name:", group.name);
        if (newName && newName.trim()) renameGroup(group.id, newName.trim());
        break;
      }
      case 'duplicate': {
        const newName = prompt("Enter name for duplicated group:", `${group.name} (Copy)`);
        if (newName && newName.trim()) duplicateGroup(group.id, newName.trim());
        break;
      }
      case 'delete':
        if (confirm(`Are you sure you want to delete "${group.name}"?`)) {
          deleteGroup(group.id);
        }
        break;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-24 animate-in fade-in duration-500">
      <header className="px-6 pt-12 pb-6 bg-white dark:bg-zinc-900 shadow-sm shadow-zinc-200/50 dark:shadow-black/20 sticky top-0 z-10 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Splitter ✨</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 font-medium">Split expenses with friends easily.</p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <UserMenu />
        </div>
      </header>

      <main className="flex-1 px-6 pt-6 space-y-4">
        {groups.length > 0 && <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">Your Groups</h2>}
        
        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-white dark:bg-zinc-900 shadow-sm border border-zinc-100 dark:border-zinc-800 rounded-full flex items-center justify-center">
              <span className="text-3xl">🗂️</span>
            </div>
            <div>
              <p className="text-zinc-900 dark:text-zinc-100 font-medium text-lg">No Groups Yet</p>
              <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-1">Create your first group to start splitting expenses.</p>
            </div>
            <Button onClick={() => setCreateOpen(true)} className="mt-4 rounded-xl shadow-none font-medium px-6 h-12 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
              Create Group
            </Button>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={groups.map(g => g.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {groups.map((group) => (
                  <SortableGroupCard 
                    key={group.id} 
                    group={group} 
                    onSelect={() => setActiveGroup(group.id)} 
                    onMenuAction={handleMenuAction}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </main>

      {groups.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 pb-[env(safe-area-inset-bottom)]">
          <button 
            onClick={() => setCreateOpen(true)}
            className="flex items-center justify-center px-6 h-14 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full shadow-2xl shadow-zinc-900/40 dark:shadow-black/40 hover:scale-105 active:scale-95 transition-transform font-medium"
          >
            <Plus className="w-5 h-5 mr-1.5" /> New Group
          </button>
        </div>
      )}

      <CreateGroup open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
