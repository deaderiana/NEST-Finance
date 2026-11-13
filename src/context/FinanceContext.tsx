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
  addSavingsGoal: (goal: { name: string; target_amount: number; target_date: string; category_icon?: string }) => { success: boolean; message: string };
  addDebt: (debt: { name: string; creditor: string; initial_principal: number; remaining_principal?: number; interest_rate_pct: number; monthly_installment: number; due_date_day: number }) => { success: boolean; message: string };
  addBill: (bill: { title: string; amount: number; due_date: string; recurring_period?: 'MONTHLY' | 'YEARLY' }) => { success: boolean; message: string };
  payBill: (billId: string, accountId: string) => { success: boolean; message: string };
  updateApprovalPolicy: (threshold: number) => void;
  markNotificationRead: (notifId: string) => void;
  resetAllData: () => void;

  // Real Data & Registration Actions
  login: (email: string, password?: string) => { success: boolean; message: string; user?: UserProfile; canAutoProvision?: boolean; email?: string };
  importSyncPackage: (syncDataOrUrl: string) => { success: boolean; message: string };
  quickProvisionAccount: (email: string, password?: string, displayName?: string) => { success: boolean; message: string; user?: UserProfile };
  generateSyncUrl: () => string;
  logout: () => void;
  registerHousehold: (payload: RegisterHouseholdPayload) => { success: boolean; message: string };
  addNewAccount: (account: InitialAccountInput) => { success: boolean; message: string };
  createInvitation: (email: string) => { success: boolean; message: string; token?: string; inviteLink?: string; shareText?: string };

  // App Password / Security Lock
  appPassword: string;
  isPasswordSet: boolean;
  isLocked: boolean;
  setAppPassword: (newPassword: string) => { success: boolean; message: string };
  removeAppPassword: (currentPassword: string) => { success: boolean; message: string };
  unlockApp: (attempt: string) => { success: boolean; message: string };
  lockApp: () => void;

  // Partner Welcome Toast / Notice
  welcomeNotice: { householdName: string; partnerName: string } | null;
  dismissWelcomeNotice: () => void;

  // Computed metrics
  totalLiquidBalance: number;
  totalIncome: number;
  totalExpense: number;
  netCashflow: number;
  pendingApprovalsCount: number;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const STORAGE_KEY = 'nest_finance_v1_1_state';
const REGISTRY_STORAGE_KEY = 'nest_multi_household_registry_v1';

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

  const [welcomeNotice, setWelcomeNotice] = useState<{
    householdName: string;
    partnerName: string;
  } | null>(null);

  const dismissWelcomeNotice = () => {
    setWelcomeNotice(null);
  };

  // App Security / Password Lock state
  const [appPassword, setAppPasswordState] = useState<string>('');
  const [isLocked, setIsLocked] = useState<boolean>(false);

  // Load from invitation link (if present) OR local storage
  useEffect(() => {
    // 1. Check if the user opened an invitation URL with sync package
    if (typeof window !== 'undefined') {
      try {
        const search = window.location.search;
        if (search) {
          const params = new URLSearchParams(search);
          const joinParam = params.get('join') || params.get('data');
          if (joinParam) {
            const raw = decodeURIComponent(joinParam);
            const jsonStr = decodeURIComponent(atob(raw));
            const pkg = JSON.parse(jsonStr);

            if (pkg && pkg.household && pkg.users && pkg.users.length > 0) {
              const partnerUser =
                pkg.activeUserRole === 'OWNER'
                  ? pkg.users.find((u: UserProfile) => u.role === 'OWNER') || pkg.users[0]
                  : pkg.users.find((u: UserProfile) => u.role === 'PARTNER') || pkg.users[1] || pkg.users[0];

              const updatedMembers = (pkg.members || []).map((m: HouseholdMember) =>
                m.role === 'PARTNER' ? { ...m, status: 'ACTIVE' as const } : m
              );

              setHousehold(pkg.household);
              setUsers(pkg.users);
              setMembers(updatedMembers);
              if (pkg.accounts) setAccounts(pkg.accounts);
              if (pkg.categories) setCategories(pkg.categories);
              if (pkg.transactions) setTransactions(pkg.transactions);
              if (pkg.journals) setJournals(pkg.journals);
              if (pkg.budgets) setBudgets(pkg.budgets);
              if (pkg.goals) setGoals(pkg.goals);
              if (pkg.debts) setDebts(pkg.debts);
              if (pkg.bills) setBills(pkg.bills);
              if (pkg.approvalPolicy) setApprovalPolicy(pkg.approvalPolicy);
              if (pkg.appPassword) {
                setAppPasswordState(pkg.appPassword);
                setIsLocked(false);
              }

              // Crucial: Login the recipient as Partner (Istri)
              setCurrentUserState(partnerUser);

              const welcomeNotif: NotificationItem = {
                id: `notif-welcome-${Date.now()}`,
                household_id: pkg.household.id,
                type: 'SYSTEM',
                title: '🎉 Undangan Pasangan Diterima!',
                message: `Selamat datang, ${partnerUser.display_name}! Anda telah terhubung ke pembukuan ${pkg.household.name}. Seluruh data rekening dan pengeluaran bersama kini aktif.`,
                created_at: new Date().toISOString(),
                read: false,
              };
              setNotifications((prev) => [welcomeNotif, ...prev]);

              setWelcomeNotice({
                householdName: pkg.household.name,
                partnerName: partnerUser.display_name,
              });

              // Save directly into the recipient device's localStorage
              const stateToSave = {
                users: pkg.users,
                household: pkg.household,
                members: updatedMembers,
                invitations: pkg.invitations || [],
                accounts: pkg.accounts || [],
                categories: pkg.categories || INITIAL_CATEGORIES,
                transactions: pkg.transactions || [],
                journals: pkg.journals || [],
                budgets: pkg.budgets || INITIAL_BUDGETS,
                goals: pkg.goals || INITIAL_SAVINGS_GOALS,
                debts: pkg.debts || INITIAL_DEBTS,
                bills: pkg.bills || INITIAL_BILLS,
                notifications: [welcomeNotif],
                approvalPolicy: pkg.approvalPolicy || INITIAL_APPROVAL_POLICY,
                currentUserId: partnerUser.id,
                appPassword: pkg.appPassword || '',
              };
              localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));

              // Clean address bar so the query string is removed cleanly
              window.history.replaceState({}, document.title, window.location.pathname);
              setIsLoaded(true);
              return;
            }
          }
        }
      } catch (err) {
        console.error('Failed to parse invitation link query param:', err);
      }
    }

    // 2. Otherwise load existing localStorage state
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
        if (parsed.appPassword) {
          setAppPasswordState(parsed.appPassword);
          setIsLocked(true);
        }

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
        appPassword,
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
    appPassword,
  ]);

  const setCurrentUser = (userId: string) => {
    const found = users.find((u) => u.id === userId);
    if (found) setCurrentUserState(found);
  };

  const toggleHideBalance = () => {
    setHideBalance((prev) => !prev);
  };

  const isPasswordSet = Boolean(appPassword && appPassword.length >= 4);

  const setAppPassword = (newPassword: string): { success: boolean; message: string } => {
    if (!newPassword || newPassword.trim().length < 4) {
      return { success: false, message: 'Password/PIN minimal terdiri dari 4 digit atau karakter.' };
    }
    const clean = newPassword.trim();
    setAppPasswordState(clean);
    setIsLocked(false);

    const notif: NotificationItem = {
      id: `notif-pwd-${Date.now()}`,
      household_id: household.id,
      type: 'SYSTEM',
      title: '🔐 Password Keamanan Aktif',
      message: 'Password keamanan aplikasi berhasil diaktifkan. Data keuangan keluarga Anda kini terlindungi.',
      created_at: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [notif, ...prev]);

    return { success: true, message: 'Password keamanan aplikasi berhasil disimpan!' };
  };

  const removeAppPassword = (currentPassword: string): { success: boolean; message: string } => {
    if (currentPassword.trim() !== appPassword.trim()) {
      return { success: false, message: 'Password lama salah. Gagal menonaktifkan keamanan.' };
    }
    setAppPasswordState('');
    setIsLocked(false);
    return { success: true, message: 'Password keamanan berhasil dinonaktifkan.' };
  };

  const unlockApp = (attempt: string): { success: boolean; message: string } => {
    if (!isPasswordSet) {
      setIsLocked(false);
      return { success: true, message: 'Aplikasi tidak dilindungi password.' };
    }
    if (attempt.trim() === appPassword.trim()) {
      setIsLocked(false);
      return { success: true, message: 'Kunci berhasil dibuka.' };
    }
    return { success: false, message: 'Password atau PIN salah. Silakan coba lagi.' };
  };

  const lockApp = () => {
    if (isPasswordSet) {
      setIsLocked(true);
    }
  };

  /**
   * Reset All Data to default demo state
   */
  const resetAllData = () => {
    localStorage.removeItem(STORAGE_KEY);
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
    setAppPasswordState('');
    setIsLocked(false);
  };

  /**
   * Helper: Save active household state to registry of multiple households
   */
  const saveStateToRegistry = (
    hh: Household,
    uList: UserProfile[],
    mList: HouseholdMember[],
    accList: Account[],
    txList: Transaction[],
    jrnList: LedgerJournal[],
    pwd?: string
  ) => {
    if (typeof window === 'undefined') return;
    try {
      const regRaw = localStorage.getItem(REGISTRY_STORAGE_KEY);
      let registry: any[] = regRaw ? JSON.parse(regRaw) : [];

      const primaryUser = uList.find((u) => u.role === 'OWNER') || uList[0];
      const partnerUser = uList.find((u) => u.role === 'PARTNER') || uList[1];

      const record = {
        householdId: hh.id,
        householdName: hh.name,
        primaryEmail: primaryUser?.email || '',
        partnerEmail: partnerUser?.email || '',
        appPassword: pwd !== undefined ? pwd : (appPassword || ''),
        updatedAt: new Date().toISOString(),
        state: {
          users: uList,
          household: hh,
          members: mList,
          accounts: accList,
          categories,
          transactions: txList,
          journals: jrnList,
          budgets,
          goals,
          debts,
          bills,
          notifications,
          approvalPolicy,
          appPassword: pwd !== undefined ? pwd : (appPassword || ''),
        },
      };

      const existingIdx = registry.findIndex(
        (r) =>
          r.householdId === hh.id ||
          (r.primaryEmail && r.primaryEmail.toLowerCase() === record.primaryEmail.toLowerCase())
      );

      if (existingIdx >= 0) {
        registry[existingIdx] = record;
      } else {
        registry.push(record);
      }

      localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(registry));
    } catch (e) {
      console.error('Failed to save household to registry:', e);
    }
  };

  /**
   * Login with Email and Password
   */
  const login = (
    email: string,
    password?: string
  ): { success: boolean; message: string; user?: UserProfile; canAutoProvision?: boolean; email?: string } => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    // 1. Check default demo accounts
    if (cleanEmail === 'budi@nest.local' || cleanEmail === 'budi@gmail.com' || cleanEmail === 'budi') {
      const budiUser = USERS[0];
      setUsers(USERS);
      setCurrentUserState(budiUser);
      setHousehold(INITIAL_HOUSEHOLD);
      setMembers(INITIAL_MEMBERS);
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
      setAppPasswordState('');
      setIsLocked(false);
      localStorage.setItem('nest_active_view', 'dashboard');
      return {
        success: true,
        message: 'Berhasil masuk ke akun demo Budi Pratama (Suami / Owner).',
        user: budiUser,
      };
    }

    if (cleanEmail === 'siti@nest.local' || cleanEmail === 'siti@gmail.com' || cleanEmail === 'siti') {
      const sitiUser = USERS[1];
      setUsers(USERS);
      setCurrentUserState(sitiUser);
      setHousehold(INITIAL_HOUSEHOLD);
      setMembers(INITIAL_MEMBERS);
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
      setAppPasswordState('');
      setIsLocked(false);
      localStorage.setItem('nest_active_view', 'dashboard');
      return {
        success: true,
        message: 'Berhasil masuk ke akun demo Siti Rahma (Istri / Partner).',
        user: sitiUser,
      };
    }

    // 2. Check registered accounts in registry
    if (typeof window !== 'undefined') {
      try {
        const regRaw = localStorage.getItem(REGISTRY_STORAGE_KEY);
        if (regRaw) {
          const registry: any[] = JSON.parse(regRaw);
          const matchedRecord = registry.find((r) => {
            const pMatch = r.primaryEmail && r.primaryEmail.toLowerCase() === cleanEmail;
            const sMatch = r.partnerEmail && r.partnerEmail.toLowerCase() === cleanEmail;
            return pMatch || sMatch;
          });

          if (matchedRecord) {
            // Check password security
            if (matchedRecord.appPassword && matchedRecord.appPassword.trim()) {
              if (matchedRecord.appPassword.trim() !== cleanPassword) {
                return {
                  success: false,
                  message: 'Password atau PIN keamanan yang Anda masukkan salah. Silakan coba lagi.',
                };
              }
            }

            // Restore state of this household
            const st = matchedRecord.state;
            if (st.users && st.users.length > 0) setUsers(st.users);
            if (st.household) setHousehold(st.household);
            if (st.members) setMembers(st.members);
            if (st.accounts) setAccounts(st.accounts);
            if (st.categories) setCategories(st.categories);
            if (st.transactions) setTransactions(st.transactions);
            if (st.journals) setJournals(st.journals);
            if (st.budgets) setBudgets(st.budgets);
            if (st.goals) setGoals(st.goals);
            if (st.debts) setDebts(st.debts);
            if (st.bills) setBills(st.bills);
            if (st.notifications) setNotifications(st.notifications);
            if (st.approvalPolicy) setApprovalPolicy(st.approvalPolicy);
            if (matchedRecord.appPassword) {
              setAppPasswordState(matchedRecord.appPassword);
              setIsLocked(false);
            }

            // Determine matching user (Owner or Partner)
            const isPartner =
              matchedRecord.partnerEmail &&
              matchedRecord.partnerEmail.toLowerCase() === cleanEmail;
            const targetUser = isPartner
              ? st.users.find((u: any) => u.role === 'PARTNER') || st.users[1] || st.users[0]
              : st.users.find((u: any) => u.role === 'OWNER') || st.users[0];

            setCurrentUserState(targetUser);
            setIsLocked(false);
            localStorage.setItem('nest_active_view', 'dashboard');

            return {
              success: true,
              message: `Selamat datang kembali, ${targetUser.display_name}! Pembukuan keluarga ${st.household.name} aktif.`,
              user: targetUser,
            };
          }
        }
      } catch (err) {
        console.error('Error during registry login check:', err);
      }
    }

    // 3. Fallback: Check currently loaded household state in localStorage
    const curPrimary = users.find((u) => u.role === 'OWNER');
    const curPartner = users.find((u) => u.role === 'PARTNER');
    const isCurrentPrimary = curPrimary?.email && curPrimary.email.toLowerCase() === cleanEmail;
    const isCurrentPartner = curPartner?.email && curPartner.email.toLowerCase() === cleanEmail;

    if (isCurrentPrimary || isCurrentPartner) {
      if (appPassword && appPassword.trim()) {
        if (appPassword.trim() !== cleanPassword) {
          return {
            success: false,
            message: 'Password atau PIN keamanan yang Anda masukkan salah.',
          };
        }
      }

      const activeUser = isCurrentPartner ? curPartner : curPrimary;
      setCurrentUserState(activeUser!);
      setIsLocked(false);
      localStorage.setItem('nest_active_view', 'dashboard');
      return {
        success: true,
        message: `Selamat datang kembali, ${activeUser!.display_name}!`,
        user: activeUser,
      };
    }

    // 4. Built-in Multi-Device Recognition for Byderiana (Instant Access on Phone)
    if (
      cleanEmail === 'byderiana@gmail.com' ||
      cleanEmail === 'byderiana' ||
      cleanEmail === 'dea.deriana@gmail.com'
    ) {
      return quickProvisionAccount(cleanEmail, cleanPassword, 'Byderiana');
    }

    return {
      success: false,
      message: 'Akun ' + cleanEmail + ' belum tersimpan di HP ini.',
      canAutoProvision: true,
      email: cleanEmail,
    };
  };

  /**
   * Quick Provision Account for Instant Multi-Device Onboarding
   */
  const quickProvisionAccount = (
    email: string,
    password?: string,
    displayName?: string
  ): { success: boolean; message: string; user?: UserProfile } => {
    const cleanEmail = email.trim().toLowerCase();
    const name = displayName?.trim() || cleanEmail.split('@')[0];
    const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);

    const householdId = 'hh-' + name.toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + Date.now().toString().slice(-4);
    const primaryUserId = 'usr-' + Date.now() + '-owner';
    const partnerUserId = 'usr-' + Date.now() + '-partner';

    const newPrimaryUser: UserProfile = {
      id: primaryUserId,
      display_name: capitalizedName,
      email: cleanEmail,
      role: 'OWNER',
      relationship: 'Suami',
      locale: 'id-ID',
    };

    const newPartnerUser: UserProfile = {
      id: partnerUserId,
      display_name: 'Pasangan (Istri)',
      email: '',
      role: 'PARTNER',
      relationship: 'Istri',
      locale: 'id-ID',
    };

    const newHousehold: Household = {
      id: householdId,
      name: 'Keluarga ' + capitalizedName,
      owner_user_id: primaryUserId,
      currency: 'IDR',
      timezone: 'Asia/Jakarta',
      budget_start_day: 1,
      couple_limit: 2,
    };

    const newMembers: HouseholdMember[] = [
      {
        id: 'mem-' + Date.now() + '-1',
        household_id: householdId,
        user_id: primaryUserId,
        role: 'OWNER',
        status: 'ACTIVE',
        display_name: newPrimaryUser.display_name,
        relationship: 'Suami',
        email: cleanEmail,
      },
      {
        id: 'mem-' + Date.now() + '-2',
        household_id: householdId,
        user_id: partnerUserId,
        role: 'PARTNER',
        status: 'INVITED',
        display_name: newPartnerUser.display_name,
        relationship: 'Istri',
      },
    ];

    const initialAccs: Account[] = [
      {
        id: 'acc-' + Date.now() + '-1',
        household_id: householdId,
        name: 'BCA Bersama (Operasional)',
        account_type: 'BANK',
        scope: 'SHARED',
        owner_user_id: null,
        opening_balance: 15000000,
        current_balance: 15000000,
        currency: 'IDR',
        is_active: true,
        account_number: '5271-889-012',
        icon: 'Landmark',
      },
      {
        id: 'acc-' + Date.now() + '-2',
        household_id: householdId,
        name: 'Mandiri Tabungan Bersama',
        account_type: 'BANK',
        scope: 'SHARED',
        owner_user_id: null,
        opening_balance: 10000000,
        current_balance: 10000000,
        currency: 'IDR',
        is_active: true,
        account_number: '137-00-1928374',
        icon: 'Building2',
      },
      {
        id: 'acc-' + Date.now() + '-3',
        household_id: householdId,
        name: 'Kas Tunai Dompet Rumah',
        account_type: 'CASH',
        scope: 'SHARED',
        owner_user_id: null,
        opening_balance: 2000000,
        current_balance: 2000000,
        currency: 'IDR',
        is_active: true,
        icon: 'Banknote',
      },
      {
        id: 'acc-' + Date.now() + '-4',
        household_id: householdId,
        name: 'BCA Pribadi (' + capitalizedName + ')',
        account_type: 'BANK',
        scope: 'PERSONAL',
        owner_user_id: primaryUserId,
        opening_balance: 5000000,
        current_balance: 5000000,
        currency: 'IDR',
        is_active: true,
        account_number: '6040-112-998',
        icon: 'Wallet',
      },
    ];

    setUsers([newPrimaryUser, newPartnerUser]);
    setCurrentUserState(newPrimaryUser);
    setHousehold(newHousehold);
    setMembers(newMembers);
    setAccounts(initialAccs);
    setCategories(INITIAL_CATEGORIES);
    setTransactions([]);
    setJournals([]);
    setBudgets(INITIAL_BUDGETS);
    setGoals(INITIAL_SAVINGS_GOALS);
    setDebts(INITIAL_DEBTS);
    setBills(INITIAL_BILLS);
    setInvitations([]);

    const cleanPwd = (password || '').trim();
    if (cleanPwd && cleanPwd.length >= 4) {
      setAppPasswordState(cleanPwd);
      setIsLocked(false);
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('nest_active_view', 'dashboard');
    }

    saveStateToRegistry(
      newHousehold,
      [newPrimaryUser, newPartnerUser],
      newMembers,
      initialAccs,
      [],
      [],
      cleanPwd
    );

    return {
      success: true,
      message: 'Selamat datang, ' + capitalizedName + '! Pembukuan keluarga ' + newHousehold.name + ' berhasil diaktifkan di perangkat ini.',
      user: newPrimaryUser,
    };
  };

  /**
   * Generate Multi-Device Synchronization URL
   */
  const generateSyncUrl = (): string => {
    if (typeof window === 'undefined') return '';
    try {
      const syncPackage = {
        household,
        users,
        members,
        accounts,
        categories,
        approvalPolicy,
        budgets,
        goals,
        debts,
        bills,
        transactions,
        journals,
        appPassword,
        activeUserRole: currentUser.role,
      };
      const encodedPackage = encodeURIComponent(btoa(encodeURIComponent(JSON.stringify(syncPackage))));
      return window.location.origin + '/?join=' + encodedPackage;
    } catch (e) {
      console.error('Failed to generate sync URL:', e);
      return window.location.origin;
    }
  };

  /**
   * Import Synchronized Package from Another Device (QR / Link / Code)
   */
  const importSyncPackage = (syncDataOrUrl: string): { success: boolean; message: string } => {
    if (!syncDataOrUrl || !syncDataOrUrl.trim()) {
      return { success: false, message: 'Masukkan data atau tautan sinkronisasi.' };
    }

    try {
      let rawStr = syncDataOrUrl.trim();
      if (rawStr.includes('join=') || rawStr.includes('data=')) {
        const urlObj = new URL(rawStr.startsWith('http') ? rawStr : 'https://dummy.local/' + rawStr);
        const param = urlObj.searchParams.get('join') || urlObj.searchParams.get('data');
        if (param) rawStr = param;
      }

      let pkg = null;
      try {
        const decodedParam = decodeURIComponent(rawStr);
        const jsonStr = decodeURIComponent(atob(decodedParam));
        pkg = JSON.parse(jsonStr);
      } catch {
        try {
          const jsonStr = atob(rawStr);
          pkg = JSON.parse(jsonStr);
        } catch {
          pkg = JSON.parse(rawStr);
        }
      }

      if (!pkg || !pkg.household || !pkg.users) {
        return { success: false, message: 'Format data sinkronisasi tidak valid atau korup.' };
      }

      setHousehold(pkg.household);
      setUsers(pkg.users);
      if (pkg.members) setMembers(pkg.members);
      if (pkg.accounts) setAccounts(pkg.accounts);
      if (pkg.categories) setCategories(pkg.categories);
      if (pkg.transactions) setTransactions(pkg.transactions);
      if (pkg.journals) setJournals(pkg.journals);
      if (pkg.budgets) setBudgets(pkg.budgets);
      if (pkg.goals) setGoals(pkg.goals);
      if (pkg.debts) setDebts(pkg.debts);
      if (pkg.bills) setBills(pkg.bills);
      if (pkg.approvalPolicy) setApprovalPolicy(pkg.approvalPolicy);

      if (pkg.appPassword) {
        setAppPasswordState(pkg.appPassword);
        setIsLocked(false);
      }

      const activeUser =
        pkg.activeUserRole === 'OWNER'
          ? pkg.users.find((u: any) => u.role === 'OWNER') || pkg.users[0]
          : pkg.users.find((u: any) => u.role === 'PARTNER') || pkg.users[1] || pkg.users[0];

      setCurrentUserState(activeUser);
      setIsLocked(false);

      if (typeof window !== 'undefined') {
        localStorage.setItem('nest_active_view', 'dashboard');
      }

      saveStateToRegistry(
        pkg.household,
        pkg.users,
        pkg.members || [],
        pkg.accounts || [],
        pkg.transactions || [],
        pkg.journals || [],
        pkg.appPassword || ''
      );

      return {
        success: true,
        message: 'Berhasil menyinkronkan data keluarga ' + pkg.household.name + '! Pembukuan siap digunakan di perangkat ini.',
      };
    } catch (err: any) {
      console.error('importSyncPackage failed:', err);
      return { success: false, message: 'Gagal memproses data sinkronisasi: ' + (err.message || 'Format tidak cocok') };
    }
  };

  /**
   * Logout from active session and return to Landing Page
   */
  const logout = () => {
    // Save latest state to registry before logout
    saveStateToRegistry(
      household,
      users,
      members,
      accounts,
      transactions,
      journals,
      appPassword
    );

    // Lock session
    if (isPasswordSet) {
      setIsLocked(true);
    }

    // Set view mode to landing
    if (typeof window !== 'undefined') {
      localStorage.setItem('nest_active_view', 'landing');
    }
  };

  /**
   * Register Real Household & Accounts (PRD Section 5.1 & 7.1)
   */
  const registerHousehold = (payload: RegisterHouseholdPayload): { success: boolean; message: string } => {
    const householdId = `hh-real-${Date.now()}`;
    const primaryUserId = `usr-real-${Date.now()}-1`;
    const partnerUserId = `usr-real-${Date.now()}-2`;

    const newPrimaryUser: UserProfile = {
      id: primaryUserId,
      display_name: payload.primaryUser.name.trim(),
      email: payload.primaryUser.email?.trim() || `${payload.primaryUser.name.toLowerCase().replace(/\s+/g, '')}@nest.local`,
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
              account_id: 'chart-equity-opening',
              account_name: 'Modal Awal Keluarga',
              side: 'CREDIT',
              amount: acc.opening_balance,
              created_at: new Date().toISOString(),
            },
          ],
        };
      });

    // Initial Registration Notification
    const registrationNotif: NotificationItem = {
      id: `notif-reg-${Date.now()}`,
      household_id: householdId,
      type: 'SYSTEM',
      title: 'Pendaftaran Rumah Tangga Berhasil',
      message: `Selamat datang di NEST Finance! Akun ${newHousehold.name} telah aktif dengan ${newAccounts.length} rekening terdaftar.`,
      created_at: new Date().toISOString(),
      read: false,
    };

    // Apply state
    setUsers([newPrimaryUser, newPartnerUser]);
    setCurrentUserState(newPrimaryUser);
    setHousehold(newHousehold);
    setMembers(newMembers);
    setAccounts(newAccounts);
    setJournals(openingJournals);
    setNotifications([registrationNotif]);

    if (payload.securityPassword && payload.securityPassword.trim().length >= 4) {
      setAppPasswordState(payload.securityPassword.trim());
      setIsLocked(false);
    }

    if (payload.wipeDemoData) {
      setTransactions([]);
      setBudgets([]);
      setGoals([]);
      setDebts([]);
      setBills([]);
      setInvitations([]);
    }

        // Also save into multi-household registry
    saveStateToRegistry(
      newHousehold,
      [newPrimaryUser, newPartnerUser],
      newMembers,
      newAccounts,
      payload.wipeDemoData ? [] : transactions,
      openingJournals,
      payload.securityPassword?.trim() || ''
    );

    return {
      success: true,
      message: `Rumah tangga "${newHousehold.name}" berhasil didaftarkan dengan ${newAccounts.length} rekening!`,
    };
  };

  /**
   * Add a single real account to active household
   */
  const addNewAccount = (account: InitialAccountInput): { success: boolean; message: string } => {
    if (!account.name.trim()) {
      return { success: false, message: 'Nama rekening wajib diisi' };
    }

    const newAccId = `acc-${Date.now()}`;
    const newAcc: Account = {
      id: newAccId,
      household_id: household.id,
      name: account.name.trim(),
      account_type: account.account_type,
      scope: account.scope,
      owner_user_id: account.scope === 'PERSONAL' ? currentUser.id : null,
      opening_balance: account.opening_balance || 0,
      current_balance: account.opening_balance || 0,
      currency: 'IDR',
      is_active: true,
      account_number: account.account_number?.trim() || undefined,
      icon: account.account_type === 'CASH' ? 'Banknote' : account.account_type === 'E_WALLET' ? 'Smartphone' : 'Landmark',
    };

    setAccounts((prev) => [...prev, newAcc]);

    // Record Opening balance journal if balance > 0
    if (newAcc.opening_balance > 0) {
      const jId = `jrn-open-${Date.now()}`;
      const newJournal: LedgerJournal = {
        id: jId,
        household_id: household.id,
        transaction_id: `tx-open-${newAcc.id}`,
        journal_number: `JRN-ADD-${Date.now().toString().slice(-4)}`,
        description: `Saldo Awal: ${newAcc.name}`,
        posted_at: new Date().toISOString(),
        is_reversal: false,
        entries: [
          {
            id: `ent-open-${newAcc.id}-d`,
            journal_id: jId,
            account_id: newAcc.id,
            account_name: newAcc.name,
            side: 'DEBIT',
            amount: newAcc.opening_balance,
            created_at: new Date().toISOString(),
          },
          {
            id: `ent-open-${newAcc.id}-c`,
            journal_id: jId,
            account_id: 'chart-equity-opening',
            account_name: 'Modal Awal Tambahan',
            side: 'CREDIT',
            amount: newAcc.opening_balance,
            created_at: new Date().toISOString(),
          },
        ],
      };
      setJournals((prev) => [newJournal, ...prev]);
    }

    return {
      success: true,
      message: `Rekening "${newAcc.name}" berhasil ditambahkan ke pembukuan!`,
    };
  };

  /**
   * Create Partner Invitation (PRD 6.1: Single-use token hash, expires in 7 days)
   * With full household state synchronization payload for seamless cross-device onboarding
   */
  const createInvitation = (
    email: string
  ): { success: boolean; message: string; token?: string; inviteLink?: string; shareText?: string } => {
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
    const updatedMembers: HouseholdMember[] = members.map((m) =>
      m.role === 'PARTNER' ? { ...m, email: email.trim(), status: 'ACTIVE' } : m
    );
    setMembers(updatedMembers);

    // Update partner user email as well
    const updatedUsers: UserProfile[] = users.map((u) =>
      u.role === 'PARTNER' ? { ...u, email: email.trim() } : u
    );
    setUsers(updatedUsers);

    // Build the synchronized package of the real household
    const syncPackage = {
      token,
      household,
      users: updatedUsers,
      members: updatedMembers,
      accounts,
      categories,
      approvalPolicy,
      budgets,
      goals,
      debts,
      bills,
      transactions,
      journals,
      invitedEmail: email.trim(),
      targetRole: 'PARTNER',
      appPassword,
    };

    let inviteLink = '';
    let shareText = '';
    try {
      const encodedPackage = encodeURIComponent(btoa(encodeURIComponent(JSON.stringify(syncPackage))));
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      inviteLink = `${origin}?invite=${token}&join=${encodedPackage}`;
      shareText = `Halo sayang, ini tautan undangan untuk bergabung ke pembukuan keuangan bersama kita (${household.name}) di NEST Finance: ${inviteLink}`;
    } catch (e) {
      console.error('Failed to encode sync package for invitation:', e);
      inviteLink = `${window.location.origin}?invite=${token}`;
    }

    return {
      success: true,
      message: `Undangan berhasil dibuat untuk ${email}. Saat pasangan membuka tautan ini, data bersama langsung aktif otomatis tanpa data demo.`,
      token,
      inviteLink,
      shareText,
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
      description: data.description || 'Transaksi Tanpa Keterangan',
      merchant: data.merchant || undefined,
      note: data.note || undefined,
      created_by: currentUser.id,
      status: requiresApproval ? 'PENDING_APPROVAL' : 'POSTED',
      reversal_of_id: null,
      created_at: new Date().toISOString(),
      requires_approval: requiresApproval,
      receipt_url: data.receipt_url,
      tags: data.tags,
    };

    if (requiresApproval) {
      setTransactions((prev) => [newTx, ...prev]);

      // Notify the partner (other user)
      const otherUser = users.find((u) => u.id !== currentUser.id);
      if (otherUser) {
        const notif: NotificationItem = {
          id: `notif-${Date.now()}`,
          household_id: household.id,
          user_id: otherUser.id,
          type: 'APPROVAL_REQUEST',
          title: 'Memerlukan Persetujuan Transaksi',
          message: `${currentUser.display_name} mengajukan ${newTx.description} sebesar Rp ${amount.toLocaleString('id-ID')}. Perlu persetujuan Anda.`,
          related_entity_id: newTx.id,
          created_at: new Date().toISOString(),
          read: false,
        };
        setNotifications((prev) => [notif, ...prev]);
      }

      return {
        success: true,
        message: `Transaksi Rp ${amount.toLocaleString('id-ID')} memerlukan persetujuan pasangan karena melebihi ambang batas.`,
        tx: newTx,
      };
    }

    // Direct posting to double entry ledger
    const sourceAcc = accounts.find((a) => a.id === data.account_id);
    const destAcc = data.destination_account_id ? accounts.find((a) => a.id === data.destination_account_id) : undefined;
    const cat = data.category_id ? categories.find((c) => c.id === data.category_id) : undefined;

    const sourceName = sourceAcc ? sourceAcc.name : 'Rekening';
    const destName = destAcc ? destAcc.name : undefined;
    const catName = cat ? cat.name : undefined;

    const journal = createJournalForTransaction(newTx, accounts, categories);
    const valResult = validateLedgerJournal(journal);

    if (!valResult.isValid) {
      return { success: false, message: `Gagal memposting buku besar: ${valResult.error}` };
    }

    // Update balances
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === newTx.account_id) {
          if (txType === 'EXPENSE' || txType === 'TRANSFER') {
            return { ...acc, current_balance: acc.current_balance - amount };
          } else if (txType === 'INCOME') {
            return { ...acc, current_balance: acc.current_balance + amount };
          }
        }
        if (txType === 'TRANSFER' && acc.id === newTx.destination_account_id) {
          return { ...acc, current_balance: acc.current_balance + amount };
        }
        return acc;
      })
    );

    setJournals((prev) => [journal, ...prev]);
    setTransactions((prev) => [newTx, ...prev]);

    return {
      success: true,
      message: 'Transaksi berhasil disimpan dan diposting ke buku besar.',
      tx: newTx,
    };
  };

  /**
   * Approve Transaction (Maker-Checker enforcement)
   */
  const approveTransaction = (txId: string): { success: boolean; message: string } => {
    const tx = transactions.find((t) => t.id === txId);
    if (!tx) return { success: false, message: 'Transaksi tidak ditemukan' };

    const check = validateMakerChecker(tx, currentUser.id);
    if (!check.allowed) {
      return { success: false, message: check.error || 'Anda tidak diizinkan menyetujui transaksi ini' };
    }

    const sourceAcc = accounts.find((a) => a.id === tx.account_id);
    const destAcc = tx.destination_account_id ? accounts.find((a) => a.id === tx.destination_account_id) : undefined;
    const cat = tx.category_id ? categories.find((c) => c.id === tx.category_id) : undefined;

    const sourceName = sourceAcc ? sourceAcc.name : 'Rekening';
    const destName = destAcc ? destAcc.name : undefined;
    const catName = cat ? cat.name : undefined;

    const approvedTx: Transaction = {
      ...tx,
      status: 'POSTED',
      approved_by: currentUser.id,
      approved_at: new Date().toISOString(),
    };

    const journal = createJournalForTransaction(approvedTx, accounts, categories);
    const valResult = validateLedgerJournal(journal);
    if (!valResult.isValid) {
      return { success: false, message: `Buku besar tidak seimbang: ${valResult.error}` };
    }

    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === tx.account_id) {
          if (tx.transaction_type === 'EXPENSE' || tx.transaction_type === 'TRANSFER') {
            return { ...acc, current_balance: acc.current_balance - tx.amount };
          } else if (tx.transaction_type === 'INCOME') {
            return { ...acc, current_balance: acc.current_balance + tx.amount };
          }
        }
        if (tx.transaction_type === 'TRANSFER' && acc.id === tx.destination_account_id) {
          return { ...acc, current_balance: acc.current_balance + tx.amount };
        }
        return acc;
      })
    );

    setJournals((prev) => [journal, ...prev]);
    setTransactions((prev) => prev.map((t) => (t.id === txId ? approvedTx : t)));

    return {
      success: true,
      message: 'Transaksi berhasil disetujui dan saldo telah diperbarui.',
    };
  };

  /**
   * Reject Transaction
   */
  const rejectTransaction = (txId: string, reason?: string): { success: boolean; message: string } => {
    const tx = transactions.find((t) => t.id === txId);
    if (!tx) return { success: false, message: 'Transaksi tidak ditemukan' };

    const check = validateMakerChecker(tx, currentUser.id);
    if (!check.allowed) {
      return { success: false, message: check.error || 'Anda tidak diizinkan menolak transaksi ini' };
    }

    setTransactions((prev) =>
      prev.map((t) =>
        t.id === txId
          ? {
              ...t,
              status: 'REJECTED',
              approved_by: currentUser.id,
              approved_at: new Date().toISOString(),
              note: reason ? `${t.note || ''} [Ditolak: ${reason}]`.trim() : t.note,
            }
          : t
      )
    );

    return {
      success: true,
      message: 'Transaksi telah ditolak.',
    };
  };

  /**
   * Reverse Transaction (PRD 8.3: Immutable Ledger Reversal)
   */
  const reverseTransaction = (txId: string): { success: boolean; message: string } => {
    const origTx = transactions.find((t) => t.id === txId);
    if (!origTx) return { success: false, message: 'Transaksi tidak ditemukan' };
    if (origTx.status !== 'POSTED') {
      return { success: false, message: 'Hanya transaksi yang sudah diposting yang dapat dibatalkan/dibalik' };
    }

    const origJournal = journals.find((j) => j.transaction_id === origTx.id && !j.is_reversal);
    if (!origJournal) {
      return { success: false, message: 'Jurnal asal tidak ditemukan di buku besar' };
    }

    const revJournalId = `jrn-rev-${Date.now()}`;
    const reversalJournal: LedgerJournal = {
      id: revJournalId,
      household_id: household.id,
      transaction_id: `tx-rev-${origTx.id}`,
      journal_number: `REV-${origJournal.journal_number}`,
      description: `Pembalikan (Reversal): ${origJournal.description}`,
      posted_at: new Date().toISOString(),
      is_reversal: true,
      reversal_of_journal_id: origJournal.id,
      entries: origJournal.entries.map((e, idx) => ({
        id: `ent-rev-${origTx.id}-${idx}`,
        journal_id: revJournalId,
        account_id: e.account_id,
        account_name: e.account_name,
        side: e.side === 'DEBIT' ? 'CREDIT' : 'DEBIT',
        amount: e.amount,
        created_at: new Date().toISOString(),
      })),
    };

    const valResult = validateLedgerJournal(reversalJournal);
    if (!valResult.isValid) {
      return { success: false, message: `Pembalikan buku besar tidak seimbang: ${valResult.error}` };
    }

    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === origTx.account_id) {
          if (origTx.transaction_type === 'EXPENSE' || origTx.transaction_type === 'TRANSFER') {
            return { ...acc, current_balance: acc.current_balance + origTx.amount };
          } else if (origTx.transaction_type === 'INCOME') {
            return { ...acc, current_balance: acc.current_balance - origTx.amount };
          }
        }
        if (origTx.transaction_type === 'TRANSFER' && acc.id === origTx.destination_account_id) {
          return { ...acc, current_balance: acc.current_balance - origTx.amount };
        }
        return acc;
      })
    );

    setJournals((prev) => [reversalJournal, ...prev]);
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === txId
          ? {
              ...t,
              status: 'REVERSED',
              reversal_of_id: origTx.id,
              note: `${t.note || ''} [Dibalik/Direverse pada ${new Date().toLocaleTimeString('id-ID')}]`.trim(),
            }
          : t
      )
    );

    return {
      success: true,
      message: 'Transaksi berhasil dibalik secara akuntansi (jurnal pembalik telah dibuat).',
    };
  };

  /**
   * Add contribution to Savings Goal
   */
  const addSavingsContribution = (goalId: string, amount: number, accountId: string) => {
    if (amount <= 0) return { success: false, message: 'Nominal tabungan harus > 0' };

    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return { success: false, message: 'Target tabungan tidak ditemukan' };

    const acc = accounts.find((a) => a.id === accountId);
    if (!acc || acc.current_balance < amount) {
      return { success: false, message: 'Saldo rekening sumber tidak mencukupi' };
    }

    const txRes = createTransaction({
      transaction_type: 'EXPENSE',
      amount,
      account_id: accountId,
      description: `Setoran Tabungan: ${goal.name}`,
      note: `Terkait target tabungan ${goal.name}`,
    });

    if (!txRes.success) return txRes;

    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          const newCurrent = g.current_amount + amount;
          return {
            ...g,
            current_amount: newCurrent,
            status: newCurrent >= g.target_amount ? 'COMPLETED' : g.status,
          };
        }
        return g;
      })
    );

    return {
      success: true,
      message: `Berhasil menabung Rp ${amount.toLocaleString('id-ID')} ke target "${goal.name}".`,
    };
  };

  /**
   * Pay a recurring bill
   */
  const payBill = (billId: string, accountId: string) => {
    const bill = bills.find((b) => b.id === billId);
    if (!bill) return { success: false, message: 'Tagihan tidak ditemukan' };

    const txRes = createTransaction({
      transaction_type: 'EXPENSE',
      amount: bill.amount,
      account_id: accountId,
      category_id: bill.category_id || undefined,
      description: `Pembayaran Tagihan: ${bill.title}`,
    });

    if (!txRes.success) return txRes;

    setBills((prev) =>
      prev.map((b) =>
        b.id === billId
          ? {
              ...b,
              is_paid_this_period: true,
              last_paid_at: new Date().toISOString(),
            }
          : b
      )
    );

    return {
      success: true,
      message: `Tagihan "${bill.title}" berhasil dibayar.`,
    };
  };

  const addSavingsGoal = (data: {
    name: string;
    target_amount: number;
    target_date: string;
    category_icon?: string;
  }) => {
    if (!data.name || !data.target_amount || data.target_amount <= 0) {
      return { success: false, message: 'Harap isi nama target dan nominal sasaran.' };
    }
    const newGoal: SavingsGoal = {
      id: `goal_${Date.now()}`,
      household_id: household.id,
      name: data.name,
      target_amount: data.target_amount,
      current_amount: 0,
      target_date: data.target_date || new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString().split('T')[0],
      category_icon: data.category_icon || 'Target',
      status: 'ACTIVE',
    };
    setGoals((prev) => [newGoal, ...prev]);
    return { success: true, message: `Target tabungan "${data.name}" berhasil dibuat.` };
  };

  const addDebt = (data: {
    name: string;
    creditor: string;
    initial_principal: number;
    remaining_principal?: number;
    interest_rate_pct: number;
    monthly_installment: number;
    due_date_day: number;
  }) => {
    if (!data.name || !data.initial_principal || data.initial_principal <= 0) {
      return { success: false, message: 'Harap isi nama cicilan dan pokok pinjaman.' };
    }
    const newDebt: Debt = {
      id: `debt_${Date.now()}`,
      household_id: household.id,
      name: data.name,
      creditor: data.creditor || 'Bank / Lembaga Pembiayaan',
      initial_principal: data.initial_principal,
      remaining_principal: data.remaining_principal !== undefined ? data.remaining_principal : data.initial_principal,
      interest_rate_pct: data.interest_rate_pct || 0,
      monthly_installment: data.monthly_installment || 0,
      due_date_day: data.due_date_day || 10,
      status: 'ACTIVE',
    };
    setDebts((prev) => [newDebt, ...prev]);
    return { success: true, message: `Cicilan / hutang "${data.name}" berhasil dicatat.` };
  };

  const addBill = (data: {
    title: string;
    amount: number;
    due_date: string;
    recurring_period?: 'MONTHLY' | 'YEARLY';
  }) => {
    if (!data.title || !data.amount || data.amount <= 0) {
      return { success: false, message: 'Harap isi nama tagihan dan nominal dengan benar.' };
    }
    const newBill: Bill = {
      id: `bill_${Date.now()}`,
      household_id: household.id,
      title: data.title,
      amount: data.amount,
      due_date: data.due_date || new Date().toISOString().split('T')[0],
      category_id: categories[0]?.id || 'cat_utilitas',
      is_paid: false,
      recurring_period: data.recurring_period || 'MONTHLY',
    };
    setBills((prev) => [newBill, ...prev]);
    return { success: true, message: `Tagihan rutin "${data.title}" berhasil ditambahkan.` };
  };

  const updateApprovalPolicy = (threshold: number) => {
    setApprovalPolicy((prev) => ({
      ...prev,
      threshold_amount: threshold,
    }));
  };

  const markNotificationRead = (notifId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );
  };

  // Computed metrics
  const totalLiquidBalance = accounts
    .filter((a) => a.is_active)
    .reduce((sum, a) => sum + (a.current_balance || 0), 0);

  const totalIncome = transactions
    .filter((t) => t.status === 'POSTED' && t.transaction_type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.status === 'POSTED' && t.transaction_type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const netCashflow = totalIncome - totalExpense;

  const pendingApprovalsCount = transactions.filter(
    (t) => t.status === 'PENDING_APPROVAL'
  ).length;

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
        addSavingsGoal,
        addDebt,
        addBill,
        payBill,
        updateApprovalPolicy,
        markNotificationRead,
        resetAllData,
        login,
        logout,
        registerHousehold,
        addNewAccount,
        createInvitation,
        appPassword,
        isPasswordSet,
        isLocked,
        setAppPassword,
        removeAppPassword,
        unlockApp,
        lockApp,
        welcomeNotice,
        dismissWelcomeNotice,
        importSyncPackage,
        quickProvisionAccount,
        generateSyncUrl,
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
