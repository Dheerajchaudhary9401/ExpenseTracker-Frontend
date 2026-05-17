// import { CommonModule } from '@angular/common';
// import { Component, OnInit, inject } from '@angular/core';
// import { FormsModule } from '@angular/forms';
// import { ActivatedRoute } from '@angular/router';
// import { forkJoin } from 'rxjs';
// import { Budget, Category, Expense, ExpenseRequest, RecurringRequest } from '../../core/models/api.models';
// import { BudgetsApiService } from '../../core/services/budgets-api.service';
// import { CategoriesApiService } from '../../core/services/categories-api.service';
// import { ExpensesApiService } from '../../core/services/expenses-api.service';
// import { RecurringApiService } from '../../core/services/recurring-api.service';
// import { SessionService } from '../../core/services/session.service';
// import { formatCurrency, parseDate } from '../../core/utils/formatters';
// import { ModalService } from '../../shared/modal.service';

// @Component({
//   selector: 'app-expenses',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   templateUrl: './expenses.html',
//   styleUrl: './expenses.css',
// })
// export class ExpensesComponent implements OnInit {
//   modal = inject(ModalService);
//   private readonly budgetsApi = inject(BudgetsApiService);
//   private readonly expensesApi = inject(ExpensesApiService);
//   private readonly categoriesApi = inject(CategoriesApiService);
//   private readonly recurringApi = inject(RecurringApiService);
//   private readonly session = inject(SessionService);
//   private readonly route = inject(ActivatedRoute);

//   expenses: Expense[] = [];
//   categories: Category[] = [];
//   loading = true;
//   saving = false;
//   errorMessage = '';
//   editingExpenseId: number | null = null;
//   private editingOriginalAmount: number | null = null;
//   private editingOriginalCategoryId: number | null = null;

//   searchTerm = '';
//   categoryFilter = 'ALL';
//   methodFilter = 'ALL';
//   timeFilter = 'THIS_MONTH';

//   readonly paymentMethods = ['CASH', 'CARD', 'UPI', 'BANK', 'WALLET'];

//   form: {
//     title: string;
//     amount: number | null;
//     date: string;
//     categoryId: number | null;
//     paymentMethod: string;
//     notes: string;
//     receiptUrl: string;
//     isRecurring: boolean;
//   } = this.emptyForm();

//   ngOnInit(): void {
//     this.loadData();
//     this.route.queryParamMap.subscribe((params) => {
//       if (params.get('openAdd') === '1') {
//         this.openCreate();
//       }
//     });
//   }

//   loadData(): void {
//     const userId = this.session.userId();
//     if (!userId) return;

//     this.loading = true;
//     forkJoin({
//       expenses: this.expensesApi.listByUser(userId),
//       categories: this.categoriesApi.listByType(userId, 'EXPENSE'),
//     }).subscribe({
//       next: ({ expenses, categories }) => {
//         this.expenses = expenses.sort(
//           (a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime()
//         );
//         this.categories = categories;
//       },
//       error: () => { this.errorMessage = 'Unable to load expenses right now.'; },
//       complete: () => { this.loading = false; }
//     });
//   }

//   get filteredExpenses(): Expense[] {
//     const now = new Date();
//     const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

//     return this.expenses.filter((expense) => {
//       const category = this.categoryName(expense.categoryId);
//       const matchesSearch =
//         !this.searchTerm ||
//         [expense.title, expense.notes ?? '', category]
//           .join(' ').toLowerCase()
//           .includes(this.searchTerm.toLowerCase());
//       const matchesCategory =
//         this.categoryFilter === 'ALL' || `${expense.categoryId}` === this.categoryFilter;
//       const matchesMethod =
//         this.methodFilter === 'ALL' || (expense.paymentMethod ?? 'UNKNOWN') === this.methodFilter;
//       const expenseDate = parseDate(expense.date);
//       const matchesTime =
//         this.timeFilter === 'ALL' ||
//         (this.timeFilter === 'THIS_MONTH' &&
//           expenseDate.getMonth() === now.getMonth() &&
//           expenseDate.getFullYear() === now.getFullYear()) ||
//         (this.timeFilter === 'LAST_MONTH' &&
//           expenseDate.getMonth() === lastMonth.getMonth() &&
//           expenseDate.getFullYear() === lastMonth.getFullYear());
//       return matchesSearch && matchesCategory && matchesMethod && matchesTime;
//     });
//   }

//   get totalAmount(): number {
//     return this.filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
//   }

//   openCreate(): void {
//     this.editingExpenseId = null;
//     this.editingOriginalAmount = null;
//     this.editingOriginalCategoryId = null;
//     this.form = this.emptyForm();
//     this.modal.open('addExpense');
//   }

//   openEdit(expense: Expense): void {
//     this.editingExpenseId = expense.expenseId;
//     this.editingOriginalAmount = expense.amount;
//     this.editingOriginalCategoryId = expense.categoryId ?? null;
//     this.form = {
//       title: expense.title,
//       amount: expense.amount,
//       date: expense.date,
//       categoryId: expense.categoryId ?? null,
//       paymentMethod: expense.paymentMethod ?? 'CARD',
//       notes: expense.notes ?? '',
//       receiptUrl: expense.receiptUrl ?? '',
//       isRecurring: expense.recurring,
//     };
//     this.modal.open('addExpense');
//   }

//   saveExpense(): void {
//     const userId = this.session.userId();
//     const profile = this.session.profile();
//     if (!userId || !this.form.title || !this.form.amount || !this.form.date) return;

//     if (!this.form.categoryId) {
//       this.errorMessage = 'Please select a category for this expense.';
//       return;
//     }

//     this.saving = true;
//     this.errorMessage = '';

//     const payload: ExpenseRequest = {
//       userId,
//       categoryId: this.form.categoryId,
//       title: this.form.title,
//       amount: this.form.amount,
//       currency: profile?.currency ?? 'INR',
//       type: 'EXPENSE',
//       paymentMethod: this.form.paymentMethod,
//       date: this.form.date,
//       notes: this.form.notes,
//       receiptUrl: this.form.receiptUrl,
//       isRecurring: this.form.isRecurring,
//       recurring: this.form.isRecurring,
//     } as ExpenseRequest & { recurring: boolean };

//     const isNew = !this.editingExpenseId;
//     const request = this.editingExpenseId
//       ? this.expensesApi.update(this.editingExpenseId, payload)
//       : this.expensesApi.create(payload);

//     request.subscribe({
//       next: () => {
//         this.modal.close();

//         // Update budget spent amount if category has a matching budget
//         if (this.form.categoryId) {
//           this.budgetsApi.listByUser(userId).subscribe({
//             next: (budgets: Budget[]) => {
//               if (isNew) {
//                 // New expense: add full amount to matching budget
//                 const matchingBudget = budgets.find((b: Budget) => b.categoryId === this.form.categoryId);
//                 if (matchingBudget) {
//                   this.budgetsApi.updateSpent(matchingBudget.budgetId, this.form.amount!).subscribe();
//                 }
//               } else {
//                 // Edit: reverse old amount from old category budget, add new amount to new category budget
//                 const oldCategoryId = this.editingOriginalCategoryId;
//                 const oldAmount = this.editingOriginalAmount ?? 0;
//                 const newCategoryId = this.form.categoryId;
//                 const newAmount = this.form.amount!;

//                 if (oldCategoryId !== null && oldCategoryId !== newCategoryId) {
//                   // Category changed — reverse old, add new separately
//                   const oldBudget = budgets.find((b: Budget) => b.categoryId === oldCategoryId);
//                   if (oldBudget) {
//                     this.budgetsApi.updateSpent(oldBudget.budgetId, -oldAmount).subscribe();
//                   }
//                   const newBudget = budgets.find((b: Budget) => b.categoryId === newCategoryId);
//                   if (newBudget) {
//                     this.budgetsApi.updateSpent(newBudget.budgetId, newAmount).subscribe();
//                   }
//                 } else {
//                   // Same category — just update the difference
//                   const diff = newAmount - oldAmount;
//                   if (diff !== 0) {
//                     const matchingBudget = budgets.find((b: Budget) => b.categoryId === newCategoryId);
//                     if (matchingBudget) {
//                       this.budgetsApi.updateSpent(matchingBudget.budgetId, diff).subscribe();
//                     }
//                   }
//                 }
//               }
//             }
//           });
//         }

//         // Auto-create recurring template if marked as recurring and it's a new expense
//         if (this.form.isRecurring && isNew) {
//           const recurringPayload: RecurringRequest = {
//             userId,
//             categoryId: this.form.categoryId,
//             title: this.form.title,
//             amount: this.form.amount!,
//             type: 'EXPENSE',
//             frequency: 'MONTHLY',
//             startDate: this.form.date,
//             endDate: null,
//             nextDueDate: this.form.date,
//             isActive: true,
//             description: this.form.notes || null,
//             paymentMethod: this.form.paymentMethod
//           };
//           this.recurringApi.create(recurringPayload).subscribe();
//         }

//         this.loadData();
//       },
//       error: () => { this.errorMessage = 'Unable to save expense.'; },
//       complete: () => { this.saving = false; }
//     });
//   }

//   deleteExpense(expense: Expense): void {
//     const userId = this.session.userId();
//     this.expensesApi.remove(expense.expenseId).subscribe({
//       next: () => {
//         // Reverse the expense amount from the matching budget
//         if (userId && expense.categoryId) {
//           this.budgetsApi.listByUser(userId).subscribe({
//             next: (budgets: Budget[]) => {
//               const matchingBudget = budgets.find((b: Budget) => b.categoryId === expense.categoryId);
//               if (matchingBudget) {
//                 this.budgetsApi.updateSpent(matchingBudget.budgetId, -expense.amount).subscribe();
//               }
//             }
//           });
//         }
//         this.loadData();
//       },
//       error: () => { this.errorMessage = `Unable to delete ${expense.title}.`; }
//     });
//   }

//   categoryName(categoryId?: number | null): string {
//     return this.categories.find(c => c.categoryId === categoryId)?.name ?? 'Uncategorized';
//   }

//   formatAmount(amount: number): string {
//     return formatCurrency(amount, this.session.profile()?.currency ?? 'INR');
//   }

//   private emptyForm() {
//     return {
//       title: '',
//       amount: null,
//       date: new Date().toISOString().slice(0, 10),
//       categoryId: null,
//       paymentMethod: 'CARD',
//       notes: '',
//       receiptUrl: '',
//       isRecurring: false,
//     };
//   }
// }

import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Budget, Category, Expense, ExpenseRequest, RecurringRequest } from '../../core/models/api.models';
import { BudgetsApiService } from '../../core/services/budgets-api.service';
import { CategoriesApiService } from '../../core/services/categories-api.service';
import { ExpensesApiService } from '../../core/services/expenses-api.service';
import { RecurringApiService } from '../../core/services/recurring-api.service';
import { SessionService } from '../../core/services/session.service';
import { formatCurrency, parseDate } from '../../core/utils/formatters';
import { ModalService } from '../../shared/modal.service';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './expenses.html',
  styleUrl: './expenses.css',
})
export class ExpensesComponent implements OnInit {
  modal = inject(ModalService);
  private readonly budgetsApi = inject(BudgetsApiService);
  private readonly expensesApi = inject(ExpensesApiService);
  private readonly categoriesApi = inject(CategoriesApiService);
  private readonly recurringApi = inject(RecurringApiService);
  private readonly session = inject(SessionService);
  private readonly route = inject(ActivatedRoute);

  expenses: Expense[] = [];
  categories: Category[] = [];
  loading = true;
  saving = false;
  errorMessage = '';
  editingExpenseId: number | null = null;
  private editingOriginalAmount: number | null = null;
  private editingOriginalCategoryId: number | null = null;

  searchTerm = '';
  categoryFilter = 'ALL';
  methodFilter = 'ALL';
  timeFilter = 'THIS_MONTH';
  minAmount: number | null = null;
  maxAmount: number | null = null;

  readonly paymentMethods = ['CASH', 'CARD', 'UPI', 'BANK', 'WALLET'];

  form: {
    title: string;
    amount: number | null;
    date: string;
    categoryId: number | null;
    paymentMethod: string;
    notes: string;
    receiptUrl: string;
    isRecurring: boolean;
  } = this.emptyForm();

  ngOnInit(): void {
    this.loadData();
    this.route.queryParamMap.subscribe((params) => {
      if (params.get('openAdd') === '1') {
        this.openCreate();
      }
    });
  }

  loadData(): void {
    const userId = this.session.userId();
    if (!userId) return;

    this.loading = true;
    forkJoin({
      expenses: this.expensesApi.listByUser(userId),
      categories: this.categoriesApi.listByType(userId, 'EXPENSE'),
    }).subscribe({
      next: ({ expenses, categories }) => {
        this.expenses = expenses.sort(
          (a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime()
        );
        this.categories = categories;
      },
      error: () => { this.errorMessage = 'Unable to load expenses right now.'; },
      complete: () => { this.loading = false; }
    });
  }

  get filteredExpenses(): Expense[] {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    return this.expenses.filter((expense) => {
      const category = this.categoryName(expense.categoryId);
      const matchesSearch =
        !this.searchTerm ||
        [expense.title, expense.notes ?? '', category]
          .join(' ').toLowerCase()
          .includes(this.searchTerm.toLowerCase());
      const matchesCategory =
        this.categoryFilter === 'ALL' || `${expense.categoryId}` === this.categoryFilter;
      const matchesMethod =
        this.methodFilter === 'ALL' || (expense.paymentMethod ?? 'UNKNOWN') === this.methodFilter;
      const expenseDate = parseDate(expense.date);
      const matchesTime =
        this.timeFilter === 'ALL' ||
        (this.timeFilter === 'THIS_MONTH' &&
          expenseDate.getMonth() === now.getMonth() &&
          expenseDate.getFullYear() === now.getFullYear()) ||
        (this.timeFilter === 'LAST_MONTH' &&
          expenseDate.getMonth() === lastMonth.getMonth() &&
          expenseDate.getFullYear() === lastMonth.getFullYear());
      const matchesMin = this.minAmount === null || expense.amount >= this.minAmount;
      const matchesMax = this.maxAmount === null || expense.amount <= this.maxAmount;
      return matchesSearch && matchesCategory && matchesMethod && matchesTime && matchesMin && matchesMax;
    });
  }

  get totalAmount(): number {
    return this.filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }

  openCreate(): void {
    this.editingExpenseId = null;
    this.editingOriginalAmount = null;
    this.editingOriginalCategoryId = null;
    this.form = this.emptyForm();
    this.modal.open('addExpense');
  }

  openEdit(expense: Expense): void {
    this.editingExpenseId = expense.expenseId;
    this.editingOriginalAmount = expense.amount;
    this.editingOriginalCategoryId = expense.categoryId ?? null;
    this.form = {
      title: expense.title,
      amount: expense.amount,
      date: expense.date,
      categoryId: expense.categoryId ?? null,
      paymentMethod: expense.paymentMethod ?? 'CARD',
      notes: expense.notes ?? '',
      receiptUrl: expense.receiptUrl ?? '',
      isRecurring: expense.recurring,
    };
    this.modal.open('addExpense');
  }

  saveExpense(): void {
    const userId = this.session.userId();
    const profile = this.session.profile();
    if (!userId || !this.form.title || !this.form.amount || !this.form.date) return;

    if (!this.form.categoryId) {
      this.errorMessage = 'Please select a category for this expense.';
      return;
    }

    this.saving = true;
    this.errorMessage = '';

    const payload: ExpenseRequest = {
      userId,
      categoryId: this.form.categoryId,
      title: this.form.title,
      amount: this.form.amount,
      currency: profile?.currency ?? 'INR',
      type: 'EXPENSE',
      paymentMethod: this.form.paymentMethod,
      date: this.form.date,
      notes: this.form.notes,
      receiptUrl: this.form.receiptUrl,
      isRecurring: this.form.isRecurring,
      recurring: this.form.isRecurring,
    } as ExpenseRequest & { recurring: boolean };

    const isNew = !this.editingExpenseId;
    const request = this.editingExpenseId
      ? this.expensesApi.update(this.editingExpenseId, payload)
      : this.expensesApi.create(payload);

    request.subscribe({
      next: () => {
        this.modal.close();

        // Update budget spent amount if category has a matching budget
        if (this.form.categoryId) {
          this.budgetsApi.listByUser(userId).subscribe({
            next: (budgets: Budget[]) => {
              if (isNew) {
                // New expense: add full amount to matching budget
                const matchingBudget = budgets.find((b: Budget) => b.categoryId === this.form.categoryId);
                if (matchingBudget) {
                  this.budgetsApi.updateSpent(matchingBudget.budgetId, this.form.amount!).subscribe();
                }
              } else {
                // Edit: reverse old amount from old category budget, add new amount to new category budget
                const oldCategoryId = this.editingOriginalCategoryId;
                const oldAmount = this.editingOriginalAmount ?? 0;
                const newCategoryId = this.form.categoryId;
                const newAmount = this.form.amount!;

                if (oldCategoryId !== null && oldCategoryId !== newCategoryId) {
                  // Category changed — reverse old, add new separately
                  const oldBudget = budgets.find((b: Budget) => b.categoryId === oldCategoryId);
                  if (oldBudget) {
                    this.budgetsApi.updateSpent(oldBudget.budgetId, -oldAmount).subscribe();
                  }
                  const newBudget = budgets.find((b: Budget) => b.categoryId === newCategoryId);
                  if (newBudget) {
                    this.budgetsApi.updateSpent(newBudget.budgetId, newAmount).subscribe();
                  }
                } else {
                  // Same category — just update the difference
                  const diff = newAmount - oldAmount;
                  if (diff !== 0) {
                    const matchingBudget = budgets.find((b: Budget) => b.categoryId === newCategoryId);
                    if (matchingBudget) {
                      this.budgetsApi.updateSpent(matchingBudget.budgetId, diff).subscribe();
                    }
                  }
                }
              }
            }
          });
        }

        // Auto-create recurring template if marked as recurring and it's a new expense
        if (this.form.isRecurring && isNew) {
          const recurringPayload: RecurringRequest = {
            userId,
            categoryId: this.form.categoryId,
            title: this.form.title,
            amount: this.form.amount!,
            type: 'EXPENSE',
            frequency: 'MONTHLY',
            startDate: this.form.date,
            endDate: null,
            nextDueDate: this.form.date,
            isActive: true,
            description: this.form.notes || null,
            paymentMethod: this.form.paymentMethod
          };
          this.recurringApi.create(recurringPayload).subscribe();
        }

        this.loadData();
        // Trigger budget alert check so notifications fire if threshold crossed
        this.budgetsApi.checkAlerts(userId).subscribe({ error: () => {} });
      },
      error: () => { this.errorMessage = 'Unable to save expense.'; },
      complete: () => { this.saving = false; }
    });
  }

  deleteExpense(expense: Expense): void {
    const userId = this.session.userId();
    this.expensesApi.remove(expense.expenseId).subscribe({
      next: () => {
        // Reverse the expense amount from the matching budget
        if (userId && expense.categoryId) {
          this.budgetsApi.listByUser(userId).subscribe({
            next: (budgets: Budget[]) => {
              const matchingBudget = budgets.find((b: Budget) => b.categoryId === expense.categoryId);
              if (matchingBudget) {
                this.budgetsApi.updateSpent(matchingBudget.budgetId, -expense.amount).subscribe();
              }
            }
          });
        }
        this.loadData();
      },
      error: () => { this.errorMessage = `Unable to delete ${expense.title}.`; }
    });
  }

  categoryName(categoryId?: number | null): string {
    return this.categories.find(c => c.categoryId === categoryId)?.name ?? 'Uncategorized';
  }

  formatAmount(amount: number): string {
    return formatCurrency(amount, this.session.profile()?.currency ?? 'INR');
  }

  private emptyForm() {
    return {
      title: '',
      amount: null,
      date: new Date().toISOString().slice(0, 10),
      categoryId: null,
      paymentMethod: 'CARD',
      notes: '',
      receiptUrl: '',
      isRecurring: false,
    };
  }
}