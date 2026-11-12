import {
  Account,
  Category,
  LedgerEntry,
  LedgerJournal,
  Transaction,
} from '@/types/finance';

/**
 * Validates the core financial ledger invariant:
 * 1. Total debits must equal total credits
 * 2. Minimum 2 entries per journal
 * 3. All amounts must be positive
 */
export function validateLedgerJournal(journal: LedgerJournal): {
  isValid: boolean;
  error?: string;
  totalDebits: number;
  totalCredits: number;
} {
  if (!journal.entries || journal.entries.length < 2) {
    return {
      isValid: false,
      error: 'Jurnal keuangan harus memiliki minimal 2 entri berpasangan (Double-Entry).',
      totalDebits: 0,
      totalCredits: 0,
    };
  }

  let debits = 0;
  let credits = 0;

  for (const entry of journal.entries) {
    if (entry.amount <= 0) {
      return {
        isValid: false,
        error: `Nilai entri buku besar harus bilangan positif. Ditemukan: ${entry.amount}`,
        totalDebits: 0,
        totalCredits: 0,
      };
    }

    if (entry.side === 'DEBIT') {
      debits += entry.amount;
    } else if (entry.side === 'CREDIT') {
      credits += entry.amount;
    }
  }

  // Exact decimal comparison (allowing standard float precision margin)
  const difference = Math.abs(debits - credits);
  if (difference > 0.001) {
    return {
      isValid: false,
      error: `Jurnal tidak seimbang! Total Debit (Rp ${debits.toLocaleString('id-ID')}) != Total Kredit (Rp ${credits.toLocaleString('id-ID')})`,
      totalDebits: debits,
      totalCredits: credits,
    };
  }

  return {
    isValid: true,
    totalDebits: debits,
    totalCredits: credits,
  };
}

/**
 * Generates an immutable Double-Entry Journal for a financial transaction
 */
export function createJournalForTransaction(
  tx: Transaction,
  accounts: Account[],
  categories: Category[]
): LedgerJournal {
  const account = accounts.find((a) => a.id === tx.account_id);
  const accountName = account ? account.name : 'Akun Kas/Bank';
  const category = categories.find((c) => c.id === tx.category_id);
  const categoryName = category ? category.name : 'Umum';

  const journalId = `jrn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const journalNumber = `JRN-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
  const entries: LedgerEntry[] = [];
  const now = new Date().toISOString();

  if (tx.transaction_type === 'EXPENSE') {
    // Debit Beban, Credit Aset (Kas/Bank berkurang)
    entries.push({
      id: `ent-${Date.now()}-1`,
      journal_id: journalId,
      account_id: `exp-${tx.category_id || 'general'}`,
      account_name: `Beban: ${categoryName}`,
      side: 'DEBIT',
      amount: tx.amount,
      created_at: now,
    });
    entries.push({
      id: `ent-${Date.now()}-2`,
      journal_id: journalId,
      account_id: tx.account_id,
      account_name: accountName,
      side: 'CREDIT',
      amount: tx.amount,
      created_at: now,
    });
  } else if (tx.transaction_type === 'INCOME') {
    // Debit Aset (Kas/Bank bertambah), Credit Pendapatan
    entries.push({
      id: `ent-${Date.now()}-1`,
      journal_id: journalId,
      account_id: tx.account_id,
      account_name: accountName,
      side: 'DEBIT',
      amount: tx.amount,
      created_at: now,
    });
    entries.push({
      id: `ent-${Date.now()}-2`,
      journal_id: journalId,
      account_id: `inc-${tx.category_id || 'general'}`,
      account_name: `Pendapatan: ${categoryName}`,
      side: 'CREDIT',
      amount: tx.amount,
      created_at: now,
    });
  } else if (tx.transaction_type === 'TRANSFER' && tx.destination_account_id) {
    // Debit Aset Tujuan, Credit Aset Asal
    const destAccount = accounts.find((a) => a.id === tx.destination_account_id);
    const destAccountName = destAccount ? destAccount.name : 'Akun Tujuan';

    entries.push({
      id: `ent-${Date.now()}-1`,
      journal_id: journalId,
      account_id: tx.destination_account_id,
      account_name: destAccountName,
      side: 'DEBIT',
      amount: tx.amount,
      created_at: now,
    });
    entries.push({
      id: `ent-${Date.now()}-2`,
      journal_id: journalId,
      account_id: tx.account_id,
      account_name: accountName,
      side: 'CREDIT',
      amount: tx.amount,
      created_at: now,
    });
  } else if (tx.transaction_type === 'DEBT_PAYMENT') {
    // Debit Liabilitas / Hutang (Pengurangan Pokok), Credit Aset
    entries.push({
      id: `ent-${Date.now()}-1`,
      journal_id: journalId,
      account_id: `liab-${tx.category_id || 'debt'}`,
      account_name: `Liabilitas: ${tx.description || 'Pembayaran Hutang'}`,
      side: 'DEBIT',
      amount: tx.amount,
      created_at: now,
    });
    entries.push({
      id: `ent-${Date.now()}-2`,
      journal_id: journalId,
      account_id: tx.account_id,
      account_name: accountName,
      side: 'CREDIT',
      amount: tx.amount,
      created_at: now,
    });
  } else {
    // Fallback adjustment
    entries.push({
      id: `ent-${Date.now()}-1`,
      journal_id: journalId,
      account_id: tx.account_id,
      account_name: accountName,
      side: 'DEBIT',
      amount: tx.amount,
      created_at: now,
    });
    entries.push({
      id: `ent-${Date.now()}-2`,
      journal_id: journalId,
      account_id: 'equity-adjustment',
      account_name: 'Ekuitas Penyesuaian Saldo',
      side: 'CREDIT',
      amount: tx.amount,
      created_at: now,
    });
  }

  const journal: LedgerJournal = {
    id: journalId,
    household_id: tx.household_id,
    transaction_id: tx.id,
    journal_number: journalNumber,
    description: tx.description || `Transaksi ${tx.transaction_type}`,
    posted_at: now,
    is_reversal: false,
    entries,
  };

  const validation = validateLedgerJournal(journal);
  if (!validation.isValid) {
    throw new Error(`Gagal memposting jurnal buku besar: ${validation.error}`);
  }

  return journal;
}

/**
 * Maker-Checker Policy Validation:
 * PRD Rule: The creator of a transaction cannot approve that same transaction.
 */
export function validateMakerChecker(
  transaction: Transaction,
  approverUserId: string
): { allowed: boolean; error?: string } {
  if (transaction.created_by === approverUserId) {
    return {
      allowed: false,
      error: 'Prinsip Maker-Checker: Pembuat transaksi tidak boleh menyetujui transaksinya sendiri. Pasangan harus menyetujui.',
    };
  }
  return { allowed: true };
}

/**
 * Format Currency in Indonesian Rupiah (IDR)
 */
export function formatIDR(amount: number, hideBalance: boolean = false): string {
  if (hideBalance) {
    return 'Rp ••••••••';
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format relative / short date in Indonesian
 */
export function formatDateID(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}
