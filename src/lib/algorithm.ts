import { Expense, Member } from '@/store/useStore';

export interface Balance {
  memberId: string;
  name: string;
  paid: number;
  owed: number;
  net: number; // positive means they should receive money, negative means they owe money
}

export interface Transfer {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
}

export function calculateBalances(members: Member[], expenses: Expense[]): Balance[] {
  const balances: Record<string, Balance> = {};

  // Initialize balances
  members.forEach((m) => {
    balances[m.id] = {
      memberId: m.id,
      name: m.name,
      paid: 0,
      owed: 0,
      net: 0,
    };
  });

  // Calculate paid and owed
  expenses.forEach((expense) => {
    // Add to payer's paid amount
    if (balances[expense.payerId]) {
      balances[expense.payerId].paid += expense.amount;
    }

    // Split among participants
    const splitType = expense.splitType || 'EQUAL';

    if (splitType === 'EQUAL') {
      const share = expense.amount / expense.participantIds.length;
      expense.participantIds.forEach((pid) => {
        if (balances[pid]) {
          balances[pid].owed += share;
        }
      });
    } else if (splitType === 'CUSTOM') {
      expense.participantIds.forEach((pid) => {
        if (balances[pid] && expense.customAmounts && expense.customAmounts[pid] !== undefined) {
          balances[pid].owed += expense.customAmounts[pid];
        }
      });
    }
  });

  // Calculate net
  return Object.values(balances).map((b) => ({
    ...b,
    net: b.paid - b.owed,
  }));
}

export function calculateSettlement(balances: Balance[]): Transfer[] {
  // Debtors owe money (net < 0)
  const debtors = balances
    .filter((b) => b.net < -0.005)
    .sort((a, b) => a.net - b.net); // Ascending (most negative first)
    
  // Creditors are owed money (net > 0)
  const creditors = balances
    .filter((b) => b.net > 0.005)
    .sort((a, b) => b.net - a.net); // Descending (most positive first)

  const transfers: Transfer[] = [];
  let d = 0;
  let c = 0;

  while (d < debtors.length && c < creditors.length) {
    const debtor = debtors[d];
    const creditor = creditors[c];

    // Find the minimum amount to transfer to settle one of them
    const amount = Math.min(Math.abs(debtor.net), creditor.net);
    const roundedAmount = Math.round(amount * 100) / 100; // Keep 2 decimal places

    if (roundedAmount > 0) {
      transfers.push({
        fromId: debtor.memberId,
        fromName: debtor.name,
        toId: creditor.memberId,
        toName: creditor.name,
        amount: roundedAmount,
      });
    }

    // Update nets
    debtor.net += amount;
    creditor.net -= amount;

    // Move to next if settled (allowing a small float tolerance)
    if (Math.abs(debtor.net) < 0.005) d++;
    if (creditor.net < 0.005) c++;
  }

  return transfers;
}
