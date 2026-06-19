import { Member } from '@/store/useStore';

export interface ParsedExpense {
  description: string;
  amount: number;
  payerId: string | null;
  participantIds: string[]; // Will default to all members if unspecified
}

export function parseExpenseText(text: string, members: Member[]): ParsedExpense[] {
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  const results: ParsedExpense[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for modifier like "除3" or "divide 3" applied to the previous expense
    if ((line.startsWith('除') || line.toLowerCase().startsWith('divide')) && results.length > 0) {
      const match = line.match(/\d+/);
      if (match) {
        const count = parseInt(match[0], 10);
        const lastExpense = results[results.length - 1];
        
        // If a division is specified but we don't know exactly who,
        // we can try to guess or just pick the payer + first N-1 members.
        // For simplicity in UI, if '除 N' is found, we can select the payer + (N-1) other members
        if (lastExpense.payerId) {
            const payer = members.find(m => m.id === lastExpense.payerId);
            if (payer) {
                const others = members.filter(m => m.id !== payer.id).slice(0, count - 1);
                lastExpense.participantIds = [payer.id, ...others.map(o => o.id)];
            }
        }
        continue; // Skip processing this line as a new expense
      }
    }

    // Standard pattern: "Description - Amount Payer"
    // e.g. "14/6 Grab去 - 10 zx" or "小猪先生 - 51 zx"
    let description = '';
    let amount = 0;
    let payerName = '';

    const dashMatch = line.match(/^(.*?)\s*-\s*([\d.]+)\s+(.*?)$/);
    if (dashMatch) {
      description = dashMatch[1].trim();
      amount = parseFloat(dashMatch[2]);
      payerName = dashMatch[3].trim();
    } else {
      // Fallback pattern without dash: "Description Amount Payer"
      const spaceMatch = line.match(/^(.*?)\s+([\d.]+)\s+(.*?)$/);
      if (spaceMatch) {
        description = spaceMatch[1].trim();
        amount = parseFloat(spaceMatch[2]);
        payerName = spaceMatch[3].trim();
      } else {
        // If we can't parse it, skip or handle gracefully
        continue;
      }
    }

    // Find payer by name (case-insensitive substring or exact match)
    const payer = members.find((m) => m.name.toLowerCase() === payerName.toLowerCase()) || 
                  members.find((m) => m.name.toLowerCase().includes(payerName.toLowerCase()) || payerName.toLowerCase().includes(m.name.toLowerCase()));

    results.push({
      description,
      amount,
      payerId: payer ? payer.id : null,
      participantIds: members.map((m) => m.id), // Default to all members
    });
  }

  return results;
}
