import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Copy, Trash2, Edit2, Plus, Users, ReceiptText } from 'lucide-react';
import { CreateGroup } from './CreateGroup';

export function GroupHome() {
  const { groups, setActiveGroup, deleteGroup, duplicateGroup, renameGroup } = useStore();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 pb-24 animate-in fade-in duration-500">
      <header className="px-6 pt-12 pb-6 bg-white shadow-sm shadow-zinc-200/50 sticky top-0 z-10">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Splitter ✨</h1>
        <p className="text-zinc-500 mt-1 font-medium">Split expenses with friends easily.</p>
      </header>

      <main className="flex-1 px-6 pt-6 space-y-4">
        {groups.length > 0 && <h2 className="text-lg font-bold text-zinc-800">Your Groups</h2>}
        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-white shadow-sm border border-zinc-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">🗂️</span>
            </div>
            <div>
              <p className="text-zinc-900 font-medium text-lg">No Groups Yet</p>
              <p className="text-zinc-400 text-sm mt-1">Create your first group to start splitting expenses.</p>
            </div>
            <Button onClick={() => setCreateOpen(true)} className="mt-4 rounded-xl shadow-none font-medium px-6 h-12">
              Create Group
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => {
              const totalAmount = group.expenses.reduce((sum, e) => sum + e.amount, 0);

              const lastExpense = group.expenses.length > 0 
                ? group.expenses.reduce((latest, e) => new Date(e.createdAt) > new Date(latest.createdAt) ? e : latest)
                : null;
              const lastUpdatedDate = lastExpense ? new Date(lastExpense.createdAt) : new Date(group.createdAt);
              
              const diffInDays = Math.floor((new Date().getTime() - lastUpdatedDate.getTime()) / (1000 * 60 * 60 * 24));
              let timeAgo = "Today";
              if (diffInDays === 1) timeAgo = "Yesterday";
              else if (diffInDays > 1) timeAgo = `${diffInDays}d ago`;

              return (
              <div 
                key={group.id} 
                className="bg-white rounded-2xl p-5 border border-zinc-100 shadow-sm active:scale-[0.98] transition-transform group cursor-pointer relative"
                onClick={() => setActiveGroup(group.id)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-zinc-900 mb-0.5">{group.name}</h3>
                    <p className="text-xs text-zinc-400 font-medium">Updated {timeAgo}</p>
                  </div>
                  
                  <div onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="h-8 w-8 flex items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 transition-colors focus:outline-none">
                        <MoreVertical className="w-4 h-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 rounded-xl border-zinc-100 shadow-xl p-1.5">
                        <DropdownMenuItem 
                          onClick={() => {
                            const newName = prompt("Enter new name:", group.name);
                            if (newName && newName.trim()) renameGroup(group.id, newName.trim());
                          }} 
                          className="rounded-lg cursor-pointer text-zinc-700 focus:bg-zinc-50 py-2.5 font-medium text-sm"
                        >
                          <Edit2 className="w-4 h-4 mr-2 text-zinc-400" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            const newName = prompt("Enter name for duplicated group:", `${group.name} (Copy)`);
                            if (newName && newName.trim()) duplicateGroup(group.id, newName.trim());
                          }} 
                          className="rounded-lg cursor-pointer text-zinc-700 focus:bg-zinc-50 py-2.5 font-medium text-sm"
                        >
                          <Copy className="w-4 h-4 mr-2 text-zinc-400" /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete "${group.name}"?`)) {
                              deleteGroup(group.id);
                            }
                          }} 
                          className="rounded-lg cursor-pointer text-red-600 focus:bg-red-50 py-2.5 font-medium text-sm"
                        >
                          <Trash2 className="w-4 h-4 mr-2 text-red-400" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="flex items-end justify-between mt-4 pt-4 border-t border-zinc-50">
                  <div className="flex gap-2 text-[11px] font-medium text-zinc-500">
                    <div className="flex items-center gap-1.5 bg-zinc-50 px-2 py-1 rounded-md border border-zinc-100">
                      <Users className="w-3 h-3" />
                      {group.members.length}
                    </div>
                    <div className="flex items-center gap-1.5 bg-zinc-50 px-2 py-1 rounded-md border border-zinc-100">
                      <ReceiptText className="w-3 h-3" />
                      {group.expenses.length}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end justify-center">
                    <span className="text-xl font-bold text-zinc-900 leading-none">
                      <span className="text-xs font-semibold text-zinc-400 mr-1 uppercase">RM</span>
                      {totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </main>

      {/* FAB for New Group */}
      {groups.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pb-[env(safe-area-inset-bottom)]">
          <button 
            onClick={() => setCreateOpen(true)}
            className="flex items-center justify-center px-6 h-14 bg-zinc-900 text-white rounded-full shadow-2xl shadow-zinc-900/40 hover:scale-105 active:scale-95 transition-transform font-medium"
          >
            <Plus className="w-5 h-5 mr-1.5" /> New Group
          </button>
        </div>
      )}

      <CreateGroup open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
