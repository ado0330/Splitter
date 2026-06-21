import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMediaQuery } from "@/hooks/use-media-query";

interface CreateGroupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateGroup({ open, onOpenChange }: CreateGroupProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const createGroup = useStore((state) => state.createGroup);
  const [name, setName] = useState('');
  const [membersStr, setMembersStr] = useState('');

  const handleSubmit = () => {
    if (!name.trim() || !membersStr.trim()) return;
    
    const members = membersStr.split(/[\s,]+/).filter(Boolean);
    if (members.length < 2) {
      alert("At least 2 members are required.");
      return;
    }
    
    createGroup(name, members);
    setName('');
    setMembersStr('');
    onOpenChange(false);
  };

  const FormContent = (
    <div className="space-y-6 px-4 py-2">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-zinc-500 font-medium">Group Name</Label>
        <Input 
          id="name" 
          placeholder="e.g. Japan Trip ✈️" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          className="text-lg h-14 bg-zinc-50/80 dark:bg-zinc-900/80 border-transparent focus-visible:ring-zinc-300 dark:focus-visible:ring-zinc-700 focus-visible:bg-white dark:focus-visible:bg-zinc-900 rounded-xl shadow-none"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="members" className="text-zinc-500 font-medium">Members</Label>
        <Input 
          id="members" 
          placeholder="e.g. Alex Ben Chloe David" 
          value={membersStr} 
          onChange={(e) => setMembersStr(e.target.value)} 
          className="text-lg h-14 bg-zinc-50/80 dark:bg-zinc-900/80 border-transparent focus-visible:ring-zinc-300 dark:focus-visible:ring-zinc-700 focus-visible:bg-white dark:focus-visible:bg-zinc-900 rounded-xl shadow-none"
        />
        <p className="text-sm text-zinc-400 mt-1">Separate names with spaces or commas.</p>
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl p-0 overflow-hidden gap-0 border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <DialogHeader className="px-6 pt-6 pb-2 border-b border-zinc-50 dark:border-zinc-800/50">
            <DialogTitle className="text-xl">New Group</DialogTitle>
          </DialogHeader>
          <div className="px-2 max-h-[60vh] overflow-y-auto">
            {FormContent}
          </div>
          <DialogFooter className="p-4 bg-zinc-50/50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800/50">
            <Button onClick={handleSubmit} className="w-full h-12 rounded-xl text-base shadow-none font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200">
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-white dark:bg-zinc-950 border-zinc-100 dark:border-zinc-800 focus:outline-none">
        <DrawerHeader className="text-left border-b border-zinc-50 dark:border-zinc-800/50 pb-4">
          <DrawerTitle className="text-2xl font-bold">New Group</DrawerTitle>
        </DrawerHeader>
        <div className="max-h-[80vh] overflow-y-auto py-2">
          {FormContent}
        </div>
        <DrawerFooter className="pt-2 border-t border-zinc-50 dark:border-zinc-800/50 pb-8">
          <Button onClick={handleSubmit} className="w-full h-14 rounded-xl text-lg font-medium shadow-none bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200">
            Create
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
