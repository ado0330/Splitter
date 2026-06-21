import { supabase } from './supabase';
import { Group } from '@/store/useStore';

export async function pushGroupToCloud(group: Group, userId: string) {
  // Upsert Group
  const { error: gError } = await supabase.from('groups').upsert({
    id: group.id,
    user_id: userId,
    name: group.name,
    is_pinned: group.isPinned || false,
    created_at: group.createdAt,
    updated_at: new Date()
  });
  if (gError) throw gError;

  // Upsert Members
  if (group.members.length > 0) {
    const membersData = group.members.map(m => ({
      id: m.id,
      group_id: group.id,
      name: m.name,
      updated_at: new Date()
    }));
    const { error: mError } = await supabase.from('members').upsert(membersData);
    if (mError) throw mError;
  }

  // Upsert Expenses
  const expensesData = group.expenses.map(e => ({
    id: e.id,
    group_id: group.id,
    description: e.description,
    amount: e.amount,
    payer_id: e.payerId,
    split_type: e.splitType,
    additional_charges_mode: e.additionalChargesMode,
    service_charge_pct: e.serviceChargePct,
    tax_pct: e.taxPct,
    extra_charges_amount: e.extraChargesAmount,
    is_payment: e.isPayment,
    participant_ids: e.participantIds,
    custom_amounts: e.customAmounts,
    base_custom_amounts: e.baseCustomAmounts,
    receipt_items: e.receiptItems,
    created_at: e.createdAt,
    updated_at: new Date()
  }));
  
  if (expensesData.length > 0) {
    const { error: eError } = await supabase.from('expenses').upsert(expensesData);
    if (eError) throw eError;
    
    // Delete expenses that were removed locally
    const currentExpenseIds = group.expenses.map(e => e.id);
    const { error: dError } = await supabase
      .from('expenses')
      .delete()
      .eq('group_id', group.id)
      .not('id', 'in', `(${currentExpenseIds.join(',')})`);
      
    if (dError) {
      console.warn("Failed to delete removed expenses:", dError);
    }
  } else {
    // Delete all expenses for this group if none left locally
    await supabase.from('expenses').delete().eq('group_id', group.id);
  }
}

export async function pullGroupsFromCloud(): Promise<Group[]> {
  const { data: groups, error: gError } = await supabase.from('groups').select('*').order('created_at', { ascending: false });
  if (gError) throw gError;

  const { data: members, error: mError } = await supabase.from('members').select('*');
  if (mError) throw mError;

  const { data: expenses, error: eError } = await supabase.from('expenses').select('*');
  if (eError) throw eError;

  return groups.map((g: any) => ({
    id: g.id,
    name: g.name,
    isPinned: g.is_pinned,
    createdAt: new Date(g.created_at),
    members: members.filter((m: any) => m.group_id === g.id).map((m: any) => ({
      id: m.id,
      name: m.name
    })),
    expenses: expenses.filter((e: any) => e.group_id === g.id).map((e: any) => ({
      id: e.id,
      description: e.description,
      amount: e.amount,
      payerId: e.payer_id,
      participantIds: e.participant_ids || [],
      splitType: e.split_type,
      additionalChargesMode: e.additional_charges_mode,
      serviceChargePct: e.service_charge_pct,
      taxPct: e.tax_pct,
      extraChargesAmount: e.extra_charges_amount,
      isPayment: e.is_payment,
      customAmounts: e.custom_amounts || undefined,
      baseCustomAmounts: e.base_custom_amounts || undefined,
      receiptItems: e.receipt_items || undefined,
      createdAt: new Date(e.created_at)
    })).sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }));
}
