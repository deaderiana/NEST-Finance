'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  Account,
  AccountScope,
  AccountType,
  ApprovalPolicy,
  Bill,
  Budget,
  Category,
  Debt,
  Household,
  HouseholdInvitation,
  HouseholdMember,
  InitialAccountInput,
  LedgerJournal,
  NotificationItem,
  RegisterHouseholdPayload,
  SavingsGoal,
  Transaction,
  UserProfile,
} from '@/types/finance';
import {
  INITIAL_ACCOUNTS,
  INITIAL_APPROVAL_POLICY,
  INITIAL_BILLS,
  INITIAL_BUDGETS,
  INITIAL_CATEGORIES,
  INITIAL_DEBTS,
  INITIAL_HOUSEHOLD,
  INITIAL_LEDGER_JOURNALS,
  INITIAL_MEMBERS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SAVINGS_GOALS,
  INITIAL_TRANSACTIONS,
  USERS,
} from '@/lib/storage';
import {
  createJournalForTransaction,
  validateLedgerJournal,
  validateMakerChecker,
} from '@/lib/ledgerEngine';

interface FinanceContextType {
  currentUser: UserProfile;
  users: UserProfile[];
  setCurrentUser: (userId: string) => void;
  household: Household;
  members: HouseholdMember[];
  invitations: HouseholdInvitation[];
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  journals: LedgerJournal[];
  budgets: Budget[];
  goals: SavingsGoal[];
  debts: Debt[];
  bills: Bill[];
  notifications: NotificationItem[];
  approvalPolicy: ApprovalPolicy;
  hideBalance: boolean;
  toggleHideBalance: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Actions
  createTransaction: (data: Partial<Transaction>) => { success: boolean; message: string; tx?: Transaction };
  approveTransaction: (txId: string) => { success: boolean; message: string };
  rejectTransaction: (txId: string, reason?: string) => { success: boolean; message: string };
  reverseTransaction: (txId: string) => { success: boolean; message: string };
  addSavingsContribution: (goalId: string, amount: number, accountId: string) => { success: boolean; message: string };
  payBill: (billId: string, accountId: string) => { success: boolean; message: string };
  updateApprovalPolicy: (threshold: number) => void;
  markNotificationRead: (notifId: string) => void;
  resetAllData: () => void;

  // Real Data & Registration Actions
  registerHousehold: (payload: RegisterHouseholdPayload) => { success: boolean; message: string };
  addNewAccount: (account: InitialAccountInput) => { success: boolean; message: string };
  createInvitation: (email: string) => { success: boolean; message: string; token?: string; inviteLink?: string };

  // Computed metrics
  totalLiquidBalance: number;
  totalIncome: number;
  totalExpense: number;
  netCashflow: number;
  pendingApprovalsCount: number;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const STORAGE_KEY = 'nest_finance_v1_1_state';

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<UserProfile[]>(USERS);
  const [currentUser, setCurrentUserState] = useState<UserProfile>(USERS[0]); // Default: Budi (Suami)
  const [hideBalance, setHideBalance] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const [household, setHousehold] = useState<Household>(INITIAL_HOUSEHOLD);
  const [members, setMembers] = useState<HouseholdMember[]>(INITIAL_MEMBERS);
  const [invitations, setInvitations] = useState<HouseholdInvitation[]>([]);
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [journals, setJournals] = useState<LedgerJournal[]>(INITIAL_LEDGER_JOURNALS);
  const [budgets, setBudgets] = useState<Budget[]>(INITIAL_BUDGETS);
  const [goals, setGoals] = useState<SavingsGoal[]>(INITIAL_SAVINGS_GOALS);
  const [debts, setDebts] = useState<Debt[]>(INITIAL_DEBTS);
  const [bills, setBills] = useState<Bill[]>(INITIAL_BILLS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [approvalPolicy, setApprovalPolicy] = useState<ApprovalPolicy>(INITIAL_APPROVAL_POLICY);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.users && parsed.users.length > 0) setUsers(parsed.users);
        if (parsed.household) setHousehold(parsed.household);
        if (parsed.members) setMembers(parsed.members);
        if (parsed.invitations) setInvitations(parsed.invitations);
        if (parsed.accounts) setAccounts(parsed.accounts);
        if (parsed.categories) setCategories(parsed.categories);
        if (parsed.transactions) setTransactions(parsed.transactions);
        if (parsed.journals) setJournals(parsed.journals);
        if (parsed.budgets) setBudgets(parsed.budgets);
        if (parsed.goals) setGoals(parsed.goals);
        if (parsed.debts) setDebts(parsed.debts);
        if (parsed.bills) setBills(parsed.bills);
        if (parsed.notifications) setNotifications(parsed.notifications);
        if (parsed.approvalPolicy) setApprovalPolicy(parsed.approvalPolicy);

        if (parsed.currentUserId) {
          const list = parsed.users && parsed.users.length > 0 ? parsed.users : USERS;
          const u = list.find((x: UserProfile) => x.id === parsed.currentUserId);
          if (u) setCurrentUserState(u);
        }
      }
    } catch (e) {
      console.error('Failed to load local storage state:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      const stateToSave = {
        users,
        household,
        members,
        invitations,
        accounts,
        categories,
        transactions,
        journals,
        budgets,
        goals,
        debts,
        bills,
        notifications,
        approvalPolicy,
        currentUserId: currentUser.id,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.error('Failed to save state to localStorage:', e);
    }
  }, [
    isLoaded,
    users,
    household,
    members,
    invitations,
    accounts,
    categories,
    transactions,
    journals,
    budgets,
    goals,
    debts,
    bills,
    notifications,
    approvalPolicy,
    currentUser,
  ]);

  const setCurrentUser = (userId: string) => {
    const found = users.find((u) => u.id === userId);
    if (found) setCurrentUserState(found);
  };

  const toggleHideBalance = () => {
    setHideBalance((prev) => !prev);
  };

  /**
   * Register New Real Household and Couple Accounts
   */
  const registerHousehold = (payload: RegisterHouseholdPayload): { success: boolean; message: string } => {
    const householdId = `hh-real-${Date.now()}`;
    const primaryUserId = `user-${Date.now()}-1`;
    const partnerUserId = `user-${Date.now()}-2`;

    const newPrimaryUser: UserProfile = {
      id: primaryUserId,
      display_name: payload.primaryUser.name.trim(),
      email: payload.primaryUser.email.trim(),
      role: 'OWNER',
      relationship: payload.primaryUser.relationship,
      locale: 'id-ID',
    };

    const partnerRel = payload.primaryUser.relationship === 'Suami' ? 'Istri' : 'Suami';
    const partnerName = payload.partnerUser?.name?.trim() || (partnerRel === 'Istri' ? 'Istri Tercinta' : 'Suami Tercinta');
    const partnerEmail = payload.partnerUser?.email?.trim() || '';

    const newPartnerUser: UserProfile = {
      id: partnerUserId,
      display_name: partnerName,
      email: partnerEmail,
      role: 'PARTNER',
      relationship: partnerRel,
      locale: 'id-ID',
    };

    const newHousehold: Household = {
      id: householdId,
      name: payload.householdName.trim() || `Keluarga ${payload.primaryUser.name}`,
      owner_user_id: primaryUserId,
      currency: 'IDR',
      timezone: 'Asia/Jakarta',
      budget_start_day: 1,
      couple_limit: 2,
    };

    const newMembers: HouseholdMember[] = [
      {
        id: `mem-${Date.now()}-1`,
        household_id: householdId,
        user_id: primaryUserId,
        role: 'OWNER',
        status: 'ACTIVE',
        display_name: newPrimaryUser.display_name,
        relationship: newPrimaryUser.relationship,
        email: newPrimaryUser.email,
      },
      {
        id: `mem-${Date.now()}-2`,
        household_id: householdId,
        user_id: partnerUserId,
        role: 'PARTNER',
        status: partnerEmail ? 'ACTIVE' : 'INVITED',
        display_name: newPartnerUser.display_name,
        relationship: newPartnerUser.relationship,
        email: partnerEmail,
      },
    ];

    // Build real accounts
    const newAccounts: Account[] = payload.accounts.map((accInput, idx) => {
      const accId = `acc-${Date.now()}-${idx}`;
      return {
        id: accId,
        household_id: householdId,
        name: accInput.name.trim(),
        account_type: accInput.account_type,
        scope: accInput.scope,
        owner_user_id: accInput.scope === 'PERSONAL' ? primaryUserId : null,
        opening_balance: accInput.opening_balance || 0,
        current_balance: accInput.opening_balance || 0,
        currency: 'IDR',
        is_active: true,
        account_number: accInput.account_number?.trim() || undefined,
        icon: accInput.account_type === 'CASH' ? 'Banknote' : accInput.account_type === 'E_WALLET' ? 'Smartphone' : 'Landmark',
      };
    });

    // Opening Balance Journals (PRD 7.2: Debit Asset, Credit Opening Equity)
    const openingJournals: LedgerJournal[] = newAccounts
      .filter((a) => a.opening_balance > 0)
      .map((acc, idx) => {
        const jId = `jrn-open-${Date.now()}-${idx}`;
        return {
          id: jId,
          household_id: householdId,
          transaction_id: `tx-open-${acc.id}`,
          journal_number: `JRN-OPEN-${idx + 1}`,
          description: `Saldo Awal Rekening: ${acc.name}`,
          posted_at: new Date().toISOString(),
          is_reversal: false,
          entries: [
            {
              id: `ent-open-${acc.id}-d`,
              journal_id: jId,
              account_id: acc.id,
              account_name: acc.name,
              side: 'DEBIT',
              amount: acc.opening_balance,
              created_at: new Date().toISOString(),
            },
            {
              id: `ent-open-${acc.id}-c`,
              journal_id: jId,
              account_id: 'equity-opening-balance',
              account_name: 'Ekuitas Saldo Awal',
              side: 'CREDIT',
              amount: acc.opening_balance,
              created_at: new Date().toISOString(),
            },
          ],
        };
      });

    // Apply states
    setUsers([newPrimaryUser, newPartnerUser]);
    setCurrentUserState(newPrimaryUser);
    setHousehold(newHousehold);
    setMembers(newMembers);
    setAccounts(newAccounts.length > 0 ? newAccounts : INITIAL_ACCOUNTS);
    setJournals(openingJournals);

    if (payload.wipeDemoData) {
      setTransactions([]);
      setDebts([]);
      setBills([]);
      setGoals([]);
      setBudgets([]);
      setNotifications([
        {
          id: `notif-${Date.now()}`,
          household_id: householdId,
          title: 'Selamat Datang di NEST Finance!',
          message: `Keluarga "${newHousehold.name}" berhasil didaftarkan dengan data riil bersih. Rekening awal telah diposting ke buku besar.`,
          type: 'TRANSACTION',
          created_at: new Date().toISOString(),
          read: false,
        },
      ]);
    } else {
      // Keep demo budgets and categories tied to new household
      setNotifications((prev) => [
        {
          id: `notif-${Date.now()}`,
          household_id: householdId,
          title: 'Pendaftaran Keluarga Berhasil',
          message: `Data riil untuk "${newHousehold.name}" telah aktif.`,
          type: 'TRANSACTION',
          created_at: new Date().toISOString(),
          read: false,
        },
        ...prev,
      ]);
    }

    // Save immediately to localStorage
    const savedState = {
      users: [newPrimaryUser, newPartnerUser],
      household: newHousehold,
      members: newMembers,
      invitations: [],
      accounts: newAccounts.length > 0 ? newAccounts : INITIAL_ACCOUNTS,
      categories: INITIAL_CATEGORIES,
      transactions: payload.wipeDemoData ? [] : transactions,
      journals: openingJournals,
      budgets: payload.wipeDemoData ? [] : budgets,
      goals: payload.wipeDemoData ? [] : goals,
      debts: payload.wipeDemoData ? [] : debts,
      bills: payload.wipeDemoData ? [] : bills,
      notifications: [
        {
          id: `notif-${Date.now()}`,
          household_id: householdId,
          title: 'Selamat Datang di NEST Finance!',
          message: `Keluarga "${newHousehold.name}" berhasil didaftarkan.`,
          type: 'TRANSACTION',
          created_at: new Date().toISOString(),
          read: false,
        },
      ],
      approvalPolicy: INITIAL_APPROVAL_POLICY,
      currentUserId: primaryUserId,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));

    return {
      success: true,
      message: `Pendaftaran berhasil! Rumah tangga "${newHousehold.name}" telah aktif dengan pengguna ${newPrimaryUser.display_name}.`,
    };
  };

  /**
   * Add New Account with Real Opening Balance
   */
  const addNewAccount = (accInput: InitialAccountInput): { success: boolean; message: string } => {
    if (!accInput.name.trim()) return { success: false, message: 'Nama rekening wajib diisi' };

    const newAccId = `acc-${Date.now()}`;
    const openBal = Number(accInput.opening_balance) || 0;

    const newAcc: Account = {
      id: newAccId,
      household_id: household.id,
      name: accInput.name.trim(),
      account_type: accInput.account_type,
      scope: accInput.scope,
      owner_user_id: accInput.scope === 'PERSONAL' ? currentUser.id : null,
      opening_balance: openBal,
      current_balance: openBal,
      currency: 'IDR',
      is_active: true,
      account_number: accInput.account_number?.trim() || undefined,
      icon: accInput.account_type === 'CASH' ? 'Banknote' : accInput.account_type === 'E_WALLET' ? 'Smartphone' : 'Landmark',
    };

    if (openBal > 0) {
      const jId = `jrn-open-${Date.now()}`;
      const journal: LedgerJournal = {
        id: jId,
        household_id: household.id,
        transaction_id: `tx-open-${newAccId}`,
        journal_number: `JRN-ACC-${Date.now().toString().slice(-4)}`,
        description: `Saldo Awal: ${newAcc.name}`,
        posted_at: new Date().toISOString(),
        is_reversal: false,
        entries: [
          {
            id: `ent-open-${newAccId}-d`,
            journal_id: jId,
            account_id: newAccId,
            account_name: newAcc.name,
            side: 'DEBIT',
            amount: openBal,
            created_at: new Date().toISOString(),
          },
          {
            id: `ent-open-${newAccId}-c`,
            journal_id: jId,
            account_id: 'equity-opening-balance',
            account_name: 'Ekuitas Saldo Awal',
            side: 'CREDIT',
            amount: openBal,
            created_at: new Date().toISOString(),
          },
        ],
      };
      setJournals((prev) => [journal, ...prev]);
    }

    setAccounts((prev) => [...prev, newAcc]);
    return { success: true, message: `Rekening "${newAcc.name}" berhasil ditambahkan ke daftar rekening riil!` };
  };

  /**
   * Create Partner Invitation (PRD 6.1: Single-use token hash, expires in 7 days)
   */
  const createInvitation = (email: string): { success: boolean; message: string; token?: string; inviteLink?: string } => {
    if (!email || !email.includes('@')) {
      return { success: false, message: 'Alamat email pasangan tidak valid' };
    }

    const token = `inv-${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    const newInv: HouseholdInvitation = {
      id: `inv-${Date.now()}`,
      household_id: household.id,
      invited_email: email.trim(),
      token_hash: token,
      invited_by: currentUser.id,
      status: 'PENDING',
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    };

    setInvitations((prev) => [newInv, ...prev]);

    // Update partner member email if invited
    setMembers((prev) =>
      prev.map((m) =>
        m.role === 'PARTNER' ? { ...m, email: email.trim(), status: 'INVITED' } : m
      )
    );

    const inviteLink = `${window.location.origin}?invite=${token}`;
    return {
      success: true,
      message: `Undangan berhasil dibuat untuk ${email}. Token berlaku selama 7 hari.`,
      token,
      inviteLink,
    };
  };

  /**
   * Create Transaction with Threshold Checking & Double Entry posting
   */
  const createTransaction = (
    data: Partial<Transaction>
  ): { success: boolean; message: string; tx?: Transaction } => {
    if (!data.amount || data.amount <= 0) {
      return { success: false, message: 'Nominal transaksi harus lebih besar dari 0' };
    }
    if (!data.account_id) {
      return { success: false, message: 'Pilih rekening atau sumber dana' };
    }

    const txType = data.transaction_type || 'EXPENSE';
    const amount = Number(data.amount);
    const requiresApproval = amount > approvalPolicy.threshold_amount;

    const newTxId = `tx-${Date.now()}`;
    const newTx: Transaction = {
      id: newTxId,
      household_id: household.id,
      transaction_type: txType,
      amount,
      currency: 'IDR',
      transaction_date: data.transaction_date || new Date().toISOString().split('T')[0],
      account_id: data.account_id,
      destination_account_id: data.destination_account_id || null,
      category_id: data.category_id || null,
      description: data.description || 'Transaksi baru',
      merchant: data.merchant || '',
      note: data.note || '',
      created_by: currentUser.id,
      status: requiresApproval ? 'PENDING_APPROVAL' : 'POSTED',
      created_at: new Date().toISOString(),
      requires_approval: requiresApproval,
      tags: data.tags || [],
    };

    if (requiresApproval) {
      // PRD Rule: Stays pending, does not affect balance, creates partner notification
      const partner = users.find((u) => u.id !== currentUser.id);
      const notif: NotificationItem = {
        id: `notif-${Date.now()}`,
        household_id: household.id,
        title: 'Menunggu Persetujuan Transaksi',
        message: `${currentUser.display_name} membuat transaksi ${newTx.description} sebesar Rp ${amount.toLocaleString('id-ID')} yang melebihi batas Rp ${approvalPolicy.threshold_amount.toLocaleString('id-ID')}.`,
        type: 'APPROVAL_REQUEST',
        created_at: new Date().toISOString(),
        read: false,
        transaction_id: newTxId,
      };

      setTransactions((prev) => [newTx, ...prev]);
      setNotifications((prev) => [notif, ...prev]);

      return {
        success: true,
        message: `Transaksi melebihi ambang persetujuan (Rp ${approvalPolicy.threshold_amount.toLocaleString('id-ID')}). Status: MENUNGGU PERSETUJUAN PASANGAN. Saldo belum terpotong.`,
        tx: newTx,
      };
    }

    // Direct post: Atomically post double-entry journal and update balances
    try {
      const journal = createJournalForTransaction(newTx, accounts, categories);

      // Update account balances
      const updatedAccounts = accounts.map((acc) => {
        let balance = acc.current_balance;
        if (txType === 'EXPENSE' || txType === 'DEBT_PAYMENT') {
          if (acc.id === newTx.account_id) balance -= amount;
        } else if (txType === 'INCOME') {
          if (acc.id === newTx.account_id) balance += amount;
        } else if (txType === 'TRANSFER') {
          if (acc.id === newTx.account_id) balance -= amount;
          if (acc.id === newTx.destination_account_id) balance += amount;
        }
        return { ...acc, current_balance: balance };
      });

      // Update budgets spent
      if (txType === 'EXPENSE' && newTx.category_id) {
        setBudgets((prevBudgets) =>
          prevBudgets.map((b) =>
            b.category_id === newTx.category_id
              ? { ...b, spent: b.spent + amount }
              : b
          )
        );
      }

      setAccounts(updatedAccounts);
      setJournals((prev) => [journal, ...prev]);
      setTransactions((prev) => [newTx, ...prev]);

      return {
        success: true,
        message: 'Transaksi berhasil dicatat dan diposting ke Buku Besar secara otomatis!',
        tx: newTx,
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Gagal memposting transaksi ke buku besar' };
    }
  };

  /**
   * Approve Transaction (Enforces Maker-Checker Invariant!)
   */
  const approveTransaction = (txId: string): { success: boolean; message: string } => {
    const tx = transactions.find((t) => t.id === txId);
    if (!tx) return { success: false, message: 'Transaksi tidak ditemukan' };

    // Maker-checker validation
    const check = validateMakerChecker(tx, currentUser.id);
    if (!check.allowed) {
      return { success: false, message: check.error || 'Maker-checker violation' };
    }

    if (tx.status !== 'PENDING_APPROVAL') {
      return { success: false, message: `Transaksi berstatus ${tx.status}, tidak dapat disetujui.` };
    }

    try {
      const journal = createJournalForTransaction(
        { ...tx, status: 'POSTED' },
        accounts,
        categories
      );

      // Update account balances atomically
      const updatedAccounts = accounts.map((acc) => {
        let balance = acc.current_balance;
        if (tx.transaction_type === 'EXPENSE' || tx.transaction_type === 'DEBT_PAYMENT') {
          if (acc.id === tx.account_id) balance -= tx.amount;
        } else if (tx.transaction_type === 'INCOME') {
          if (acc.id === tx.account_id) balance += tx.amount;
        } else if (tx.transaction_type === 'TRANSFER') {
          if (acc.id === tx.account_id) balance -= tx.amount;
          if (acc.id === tx.destination_account_id) balance += tx.amount;
        }
        return { ...acc, current_balance: balance };
      });

      // Update budgets
      if (tx.transaction_type === 'EXPENSE' && tx.category_id) {
        setBudgets((prevBudgets) =>
          prevBudgets.map((b) =>
            b.category_id === tx.category_id
              ? { ...b, spent: b.spent + tx.amount }
              : b
          )
        );
      }

      const updatedTx: Transaction = {
        ...tx,
        status: 'POSTED',
        approved_by: currentUser.id,
        approved_at: new Date().toISOString(),
      };

      setAccounts(updatedAccounts);
      setJournals((prev) => [journal, ...prev]);
      setTransactions((prev) => prev.map((t) => (t.id === txId ? updatedTx : t)));

      // Add decision notification
      const notif: NotificationItem = {
        id: `notif-${Date.now()}`,
        household_id: household.id,
        title: 'Transaksi Disetujui',
        message: `${currentUser.display_name} menyetujui transaksi ${tx.description} (Rp ${tx.amount.toLocaleString('id-ID')}). Jurnal buku besar telah diposting.`,
        type: 'APPROVAL_DECISION',
        created_at: new Date().toISOString(),
        read: false,
        transaction_id: txId,
      };
      setNotifications((prev) => [notif, ...prev]);

      return {
        success: true,
        message: `Transaksi berhasil disetujui oleh ${currentUser.display_name} dan diposting ke Buku Besar!`,
      };
    } catch (e: any) {
      return { success: false, message: e.message || 'Gagal memproses persetujuan' };
    }
  };

  /**
   * Reject Transaction
   */
  const rejectTransaction = (txId: string, reason?: string): { success: boolean; message: string } => {
    const tx = transactions.find((t) => t.id === txId);
    if (!tx) return { success: false, message: 'Transaksi tidak ditemukan' };

    const check = validateMakerChecker(tx, currentUser.id);
    if (!check.allowed) {
      return { success: false, message: check.error || 'Maker-checker violation' };
    }

    const updatedTx: Transaction = {
      ...tx,
      status: 'REJECTED',
      note: reason ? `${tx.note ? tx.note + ' | ' : ''}Ditolak oleh ${currentUser.display_name}: ${reason}` : tx.note,
    };

    setTransactions((prev) => prev.map((t) => (t.id === txId ? updatedTx : t)));

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      household_id: household.id,
      title: 'Transaksi Ditolak',
      message: `${currentUser.display_name} menolak transaksi ${tx.description} (Rp ${tx.amount.toLocaleString('id-ID')}).`,
      type: 'APPROVAL_DECISION',
      created_at: new Date().toISOString(),
      read: false,
      transaction_id: txId,
    };
    setNotifications((prev) => [notif, ...prev]);

    return { success: true, message: 'Transaksi berhasil ditolak dan tidak memengaruhi saldo rekening.' };
  };

  /**
   * Reversal Flow for Posted Transactions (PRD 7.3: Invariant - posted journals immutable)
   */
  const reverseTransaction = (txId: string): { success: boolean; message: string } => {
    const tx = transactions.find((t) => t.id === txId);
    if (!tx) return { success: false, message: 'Transaksi tidak ditemukan' };
    if (tx.status !== 'POSTED') {
      return { success: false, message: 'Hanya transaksi berstatus POSTED yang dapat dibalik (reversal).' };
    }

    // Find original journal
    const origJournal = journals.find((j) => j.transaction_id === txId);
    if (!origJournal) {
      return { success: false, message: 'Jurnal asli tidak ditemukan dalam buku besar' };
    }

    // Create opposite entries
    const reversalJournalId = `rev-${Date.now()}`;
    const reversalEntries = origJournal.entries.map((e, idx) => ({
      id: `rev-ent-${Date.now()}-${idx}` as string,
      journal_id: reversalJournalId,
      account_id: e.account_id,
      account_name: e.account_name,
      side: e.side === 'DEBIT' ? ('CREDIT' as const) : ('DEBIT' as const),
      amount: e.amount,
      created_at: new Date().toISOString(),
    }));

    const reversalJournal: LedgerJournal = {
      id: reversalJournalId,
      household_id: household.id,
      transaction_id: txId,
      journal_number: `REV-${origJournal.journal_number}`,
      description: `Reversal: ${origJournal.description}`,
      posted_at: new Date().toISOString(),
      is_reversal: true,
      reversal_of_journal_id: origJournal.id,
      entries: reversalEntries,
    };

    // Restore account balances
    const updatedAccounts = accounts.map((acc) => {
      let balance = acc.current_balance;
      if (tx.transaction_type === 'EXPENSE' || tx.transaction_type === 'DEBT_PAYMENT') {
        if (acc.id === tx.account_id) balance += tx.amount; // return money
      } else if (tx.transaction_type === 'INCOME') {
        if (acc.id === tx.account_id) balance -= tx.amount;
      } else if (tx.transaction_type === 'TRANSFER') {
        if (acc.id === tx.account_id) balance += tx.amount;
        if (acc.id === tx.destination_account_id) balance -= tx.amount;
      }
      return { ...acc, current_balance: balance };
    });

    setAccounts(updatedAccounts);
    setJournals((prev) => [reversalJournal, ...prev]);
    setTransactions((prev) =>
      prev.map((t) => (t.id === txId ? { ...t, status: 'REVERSED' } : t))
    );

    return {
      success: true,
      message: 'Transaksi berhasil dibalik (Reversal Journal diposting). Saldo dikembalikan sesuai posisi awal.',
    };
  };

  /**
   * Savings Allocation
   */
  const addSavingsContribution = (
    goalId: string,
    amount: number,
    accountId: string
  ): { success: boolean; message: string } => {
    const goal = goals.find((g) => g.id === goalId);
    const acc = accounts.find((a) => a.id === accountId);
    if (!goal || !acc) return { success: false, message: 'Target atau rekening tidak valid' };
    if (acc.current_balance < amount) return { success: false, message: 'Saldo rekening tidak mencukupi' };

    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId ? { ...g, current_amount: g.current_amount + amount } : g
      )
    );

    // Record internal transfer
    createTransaction({
      transaction_type: 'TRANSFER',
      amount,
      account_id: accountId,
      description: `Alokasi Tabungan: ${goal.name}`,
      tags: ['Tabungan', 'Target'],
    });

    return { success: true, message: `Alokasi Rp ${amount.toLocaleString('id-ID')} ke target "${goal.name}" berhasil!` };
  };

  /**
   * Pay Bill
   */
  const payBill = (billId: string, accountId: string): { success: boolean; message: string } => {
    const bill = bills.find((b) => b.id === billId);
    if (!bill) return { success: false, message: 'Tagihan tidak ditemukan' };

    const res = createTransaction({
      transaction_type: 'EXPENSE',
      amount: bill.amount,
      account_id: accountId,
      category_id: bill.category_id,
      description: `Pembayaran Tagihan: ${bill.title}`,
      tags: ['Tagihan', 'Rutin'],
    });

    if (res.success) {
      setBills((prev) =>
        prev.map((b) => (b.id === billId ? { ...b, is_paid: true } : b))
      );
      return { success: true, message: `Tagihan "${bill.title}" berhasil dibayar!` };
    }
    return res;
  };

  const updateApprovalPolicy = (threshold: number) => {
    setApprovalPolicy((prev) => ({ ...prev, threshold_amount: threshold }));
  };

  const markNotificationRead = (notifId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );
  };

  const resetAllData = () => {
    setUsers(USERS);
    setCurrentUserState(USERS[0]);
    setHousehold(INITIAL_HOUSEHOLD);
    setMembers(INITIAL_MEMBERS);
    setInvitations([]);
    setAccounts(INITIAL_ACCOUNTS);
    setCategories(INITIAL_CATEGORIES);
    setTransactions(INITIAL_TRANSACTIONS);
    setJournals(INITIAL_LEDGER_JOURNALS);
    setBudgets(INITIAL_BUDGETS);
    setGoals(INITIAL_SAVINGS_GOALS);
    setDebts(INITIAL_DEBTS);
    setBills(INITIAL_BILLS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setApprovalPolicy(INITIAL_APPROVAL_POLICY);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Computed metrics
  const totalLiquidBalance = accounts.reduce((acc, a) => acc + (a.is_active ? a.current_balance : 0), 0);

  const postedTxs = transactions.filter((t) => t.status === 'POSTED');
  const totalIncome = postedTxs
    .filter((t) => t.transaction_type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = postedTxs
    .filter((t) => t.transaction_type === 'EXPENSE' || t.transaction_type === 'DEBT_PAYMENT')
    .reduce((sum, t) => sum + t.amount, 0);
  const netCashflow = totalIncome - totalExpense;

  const pendingApprovalsCount = transactions.filter((t) => t.status === 'PENDING_APPROVAL').length;

  return (
    <FinanceContext.Provider
      value={{
        currentUser,
        users,
        setCurrentUser,
        household,
        members,
        invitations,
        accounts,
        categories,
        transactions,
        journals,
        budgets,
        goals,
        debts,
        bills,
        notifications,
        approvalPolicy,
        hideBalance,
        toggleHideBalance,
        activeTab,
        setActiveTab,
        createTransaction,
        approveTransaction,
        rejectTransaction,
        reverseTransaction,
        addSavingsContribution,
        payBill,
        updateApprovalPolicy,
        markNotificationRead,
        resetAllData,
        registerHousehold,
        addNewAccount,
        createInvitation,
        totalLiquidBalance,
        totalIncome,
        totalExpense,
        netCashflow,
        pendingApprovalsCount,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
