export type MemberRole = 'OWNER' | 'PARTNER';
export type MemberStatus = 'ACTIVE' | 'INVITED' | 'SUSPENDED' | 'LEFT';
export type AccountScope = 'SHARED' | 'PERSONAL';
export type AccountType = 'CASH' | 'BANK' | 'E_WALLET' | 'SAVINGS' | 'OTHER';
export type CategoryType = 'INCOME' | 'EXPENSE';
export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'REFUND' | 'ADJUSTMENT' | 'DEBT_PAYMENT';
export type TransactionStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'POSTED'
  | 'CANCELLED'
  | 'REVERSED'
  | 'EXPIRED';
export type BudgetScope = 'HOUSEHOLD' | 'PERSONAL';
export type PeriodType = 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';
export type LedgerSide = 'DEBIT' | 'CREDIT';
export type GoalStatus = 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'CANCELLED';
export type DebtStatus = 'ACTIVE' | 'PAID' | 'CLOSED' | 'DEFAULTED';

export interface UserProfile {
  id: string;
  display_name: string;
  email?: string;
  avatar_path?: string;
  role: MemberRole;
  relationship: 'Suami' | 'Istri';
  locale: string;
}

export interface Household {
  id: string;
  name: string;
  owner_user_id: string;
  currency: 'IDR';
  timezone: string;
  budget_start_day: number;
  couple_limit: number;
}

export interface HouseholdMember {
  id: string;
  household_id: string;
  user_id: string;
  role: MemberRole;
  status: MemberStatus;
  display_name: string;
  relationship: 'Suami' | 'Istri';
  email?: string;
}

export interface HouseholdInvitation {
  id: string;
  household_id: string;
  invited_email: string;
  token_hash: string;
  invited_by: string;
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';
  expires_at: string;
  created_at: string;
}

export interface Account {
  id: string;
  household_id: string;
  name: string;
  account_type: AccountType;
  scope: AccountScope;
  owner_user_id?: string | null;
  opening_balance: number;
  current_balance: number;
  currency: 'IDR';
  is_active: boolean;
  account_number?: string;
  icon?: string;
}

export interface Category {
  id: string;
  household_id: string;
  name: string;
  category_type: CategoryType;
  parent_id?: string | null;
  icon: string;
  color: string;
  is_system: boolean;
  is_active: boolean;
}

export interface Transaction {
  id: string;
  household_id: string;
  transaction_type: TransactionType;
  amount: number;
  currency: 'IDR';
  transaction_date: string; // YYYY-MM-DD
  account_id: string;
  destination_account_id?: string | null; // For transfers
  category_id?: string | null;
  description?: string;
  merchant?: string;
  note?: string;
  created_by: string;
  status: TransactionStatus;
  reversal_of_id?: string | null;
  idempotency_key?: string;
  created_at: string;
  requires_approval: boolean;
  approved_by?: string | null;
  approved_at?: string | null;
  receipt_url?: string;
  tags?: string[];
}

export interface LedgerEntry {
  id: string;
  journal_id: string;
  account_id: string; // Internal ledger chart account / real account
  account_name: string;
  side: LedgerSide;
  amount: number;
  created_at: string;
}

export interface LedgerJournal {
  id: string;
  household_id: string;
  transaction_id: string;
  journal_number: string;
  description: string;
  posted_at: string;
  is_reversal: boolean;
  reversal_of_journal_id?: string | null;
  entries: LedgerEntry[];
}

export interface Budget {
  id: string;
  household_id: string;
  category_id?: string | null; // null means total household cap
  scope: BudgetScope;
  owner_user_id?: string | null;
  amount_limit: number;
  warning_threshold_pct: number; // e.g. 80%
  spent: number;
  period_type: PeriodType;
}

export interface SavingsGoal {
  id: string;
  household_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  category_icon: string;
  status: GoalStatus;
  linked_account_id?: string;
}

export interface Debt {
  id: string;
  household_id: string;
  name: string;
  creditor: string; // e.g. Bank Mandiri KPR, BCA Finance
  initial_principal: number;
  remaining_principal: number;
  interest_rate_pct: number;
  monthly_installment: number;
  due_date_day: number;
  status: DebtStatus;
}

export interface Bill {
  id: string;
  household_id: string;
  title: string;
  amount: number;
  due_date: string;
  category_id: string;
  is_paid: boolean;
  recurring_period: 'MONTHLY' | 'YEARLY';
}

export interface ApprovalPolicy {
  household_id: string;
  threshold_amount: number; // default Rp 1.000.000
  require_for_transfers: boolean;
  require_for_refunds: boolean;
  expiry_days: number;
}

export interface NotificationItem {
  id: string;
  household_id: string;
  user_id?: string;
  title: string;
  message: string;
  related_entity_id?: string;
  type: 'APPROVAL_REQUEST' | 'APPROVAL_DECISION' | 'BUDGET_WARNING' | 'BILL_REMINDER' | 'TRANSACTION' | 'SYSTEM';
  created_at: string;
  read: boolean;
  action_link?: string;
  transaction_id?: string;
}

export interface InitialAccountInput {
  name: string;
  account_type: AccountType;
  scope: AccountScope;
  opening_balance: number;
  account_number?: string;
}

export interface RegisterHouseholdPayload {
  householdName: string;
  primaryUser: {
    name: string;
    email: string;
    relationship: 'Suami' | 'Istri';
  };
  partnerUser?: {
    name: string;
    email: string;
    relationship: 'Suami' | 'Istri';
  };
  accounts: InitialAccountInput[];
  wipeDemoData: boolean;
  securityPassword?: string;
}
