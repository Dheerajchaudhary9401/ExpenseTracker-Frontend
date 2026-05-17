// import { CommonModule } from '@angular/common';
// import { Component, OnInit, inject } from '@angular/core';
// import { FormsModule } from '@angular/forms';
// import { forkJoin } from 'rxjs';
// import { Category, CategoryRequest, Expense, Income } from '../../core/models/api.models';
// import { CategoriesApiService } from '../../core/services/categories-api.service';
// import { ExpensesApiService } from '../../core/services/expenses-api.service';
// import { IncomeApiService } from '../../core/services/income-api.service';
// import { SessionService } from '../../core/services/session.service';
// import { formatCurrency, parseDate } from '../../core/utils/formatters';
// import { ModalService } from '../../shared/modal.service';

// @Component({
//   selector: 'app-categories',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   templateUrl: './categories.html',
//   styleUrl: './categories.css'
// })
// export class CategoriesComponent implements OnInit {
//   modal = inject(ModalService);
//   private readonly categoriesApi = inject(CategoriesApiService);
//   private readonly expensesApi = inject(ExpensesApiService);
//   private readonly incomeApi = inject(IncomeApiService);
//   private readonly session = inject(SessionService);

//   categories: Category[] = [];
//   expenses: Expense[] = [];
//   incomes: Income[] = [];
//   loading = true;
//   saving = false;
//   errorMessage = '';
//   editingCategoryId: number | null = null;
//   form = this.emptyForm();

//   ngOnInit(): void {
//     this.loadData();
//   }

//   loadData(): void {
//     const userId = this.session.userId();
//     if (!userId) {
//       return;
//     }

//     this.loading = true;
//     forkJoin({
//       categories: this.categoriesApi.listByUser(userId),
//       expenses: this.expensesApi.listByUser(userId),
//       incomes: this.incomeApi.listByUser(userId)
//     }).subscribe({
//       next: ({ categories, expenses, incomes }) => {
//         this.categories = categories;
//         this.expenses = expenses;
//         this.incomes = incomes;
//       },
//       error: () => {
//         this.errorMessage = 'Unable to load categories.';
//       },
//       complete: () => {
//         this.loading = false;
//       }
//     });
//   }

//   get expenseCategories(): Category[] {
//     return this.categories.filter(category => category.type === 'EXPENSE');
//   }

//   get incomeCategories(): Category[] {
//     return this.categories.filter(category => category.type === 'INCOME');
//   }

//   transactionCount(category: Category): number {
//     return this.transactionsFor(category).length;
//   }

//   currentMonthTotal(category: Category): number {
//     const currentMonth = new Date();
//     return this.transactionsFor(category)
//       .filter(item => {
//         const date = parseDate(item.date);
//         return date.getMonth() === currentMonth.getMonth() && date.getFullYear() === currentMonth.getFullYear();
//       })
//       .reduce((sum, item) => sum + item.amount, 0);
//   }

//   transactionsFor(category: Category): Array<Expense | Income> {
//     const source = category.type === 'EXPENSE' ? this.expenses : this.incomes;
//     return source.filter(item => item.categoryId === category.categoryId);
//   }

//   openCreate(): void {
//     this.editingCategoryId = null;
//     this.form = this.emptyForm();
//     this.modal.open('addCategory');
//   }

//   openEdit(category: Category): void {
//     this.editingCategoryId = category.categoryId;
//     this.form = {
//       name: category.name,
//       type: category.type,
//       icon: category.icon ?? '',
//       colorCode: category.colorCode ?? '#1D9E75',
//       budgetLimit: category.budgetLimit || 0
//     };
//     this.modal.open('addCategory');
//   }

//   saveCategory(): void {
//     const userId = this.session.userId();
//     if (!userId || !this.form.name) {
//       return;
//     }

//     this.saving = true;
//     const payload: CategoryRequest = {
//       userId,
//       name: this.form.name,
//       type: this.form.type,
//       icon: this.form.icon,
//       colorCode: this.form.colorCode,
//       budgetLimit: this.form.budgetLimit || 0,
//       isDefault: false,
//       'default': false
//     } as CategoryRequest & { default: boolean };

//     const request = this.editingCategoryId
//       ? this.categoriesApi.update(this.editingCategoryId, payload)
//       : this.categoriesApi.create(payload);

//     request.subscribe({
//       next: category => {
//         if (payload.type === 'EXPENSE') {
//           this.categoriesApi.updateBudget(category.categoryId, payload.budgetLimit).subscribe({ next: () => this.loadData(), error: () => this.loadData() });
//         } else {
//           this.loadData();
//         }
//         this.modal.close();
//       },
//       error: () => {
//         this.errorMessage = 'Unable to save category.';
//       },
//       complete: () => {
//         this.saving = false;
//       }
//     });
//   }

//   removeCategory(category: Category): void {
//     this.categoriesApi.remove(category.categoryId).subscribe({
//       next: () => this.loadData(),
//       error: () => {
//         this.errorMessage = `Unable to delete ${category.name}.`;
//       }
//     });
//   }

//   formatAmount(amount: number): string {
//     return formatCurrency(amount, this.session.profile()?.currency ?? 'INR');
//   }

//   private emptyForm() {
//     return {
//       name: '',
//       type: 'EXPENSE',
//       icon: '',
//       colorCode: '#1D9E75',
//       budgetLimit: 0
//     };
//   }
// }
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Budget, BudgetRequest, Category, CategoryRequest, Expense, Income } from '../../core/models/api.models';
import { BudgetsApiService } from '../../core/services/budgets-api.service';
import { CategoriesApiService } from '../../core/services/categories-api.service';
import { ExpensesApiService } from '../../core/services/expenses-api.service';
import { IncomeApiService } from '../../core/services/income-api.service';
import { SessionService } from '../../core/services/session.service';
import { formatCurrency, parseDate } from '../../core/utils/formatters';
import { ModalService } from '../../shared/modal.service';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categories.html',
  styleUrl: './categories.css'
})
export class CategoriesComponent implements OnInit {
  modal = inject(ModalService);
  private readonly categoriesApi = inject(CategoriesApiService);
  private readonly expensesApi = inject(ExpensesApiService);
  private readonly incomeApi = inject(IncomeApiService);
  private readonly budgetsApi = inject(BudgetsApiService);
  private readonly session = inject(SessionService);

  categories: Category[] = [];
  expenses: Expense[] = [];
  incomes: Income[] = [];
  loading = true;
  saving = false;
  savingBudget = false;
  errorMessage = '';
  editingCategoryId: number | null = null;
  form = this.emptyForm();

  // Budget prompt state
  showBudgetPrompt = false;
  newlyCreatedCategory: Category | null = null;
  budgetForm = this.emptyBudgetForm();

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    const userId = this.session.userId();
    if (!userId) return;

    this.loading = true;
    forkJoin({
      categories: this.categoriesApi.listByUser(userId),
      expenses: this.expensesApi.listByUser(userId),
      incomes: this.incomeApi.listByUser(userId)
    }).subscribe({
      next: ({ categories, expenses, incomes }) => {
        this.categories = categories;
        this.expenses = expenses;
        this.incomes = incomes;
      },
      error: () => { this.errorMessage = 'Unable to load categories.'; },
      complete: () => { this.loading = false; }
    });
  }

  get expenseCategories(): Category[] {
    return this.categories.filter(c => c.type === 'EXPENSE');
  }

  get incomeCategories(): Category[] {
    return this.categories.filter(c => c.type === 'INCOME');
  }

  transactionCount(category: Category): number {
    return this.transactionsFor(category).length;
  }

  currentMonthTotal(category: Category): number {
    const now = new Date();
    return this.transactionsFor(category)
      .filter(item => {
        const date = parseDate(item.date);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      })
      .reduce((sum, item) => sum + item.amount, 0);
  }

  transactionsFor(category: Category): Array<Expense | Income> {
    const source = category.type === 'EXPENSE' ? this.expenses : this.incomes;
    return source.filter(item => item.categoryId === category.categoryId);
  }

  openCreate(): void {
    this.editingCategoryId = null;
    this.form = this.emptyForm();
    this.modal.open('addCategory');
  }

  openEdit(category: Category): void {
    this.editingCategoryId = category.categoryId;
    this.form = {
      name: category.name,
      type: category.type,
      icon: category.icon ?? '',
      colorCode: category.colorCode ?? '#1D9E75',
      budgetLimit: category.budgetLimit || 0
    };
    this.modal.open('addCategory');
  }

  saveCategory(): void {
    const userId = this.session.userId();
    if (!userId || !this.form.name) return;

    this.saving = true;
    const payload: CategoryRequest = {
      userId,
      name: this.form.name,
      type: this.form.type,
      icon: this.form.icon,
      colorCode: this.form.colorCode,
      budgetLimit: this.form.budgetLimit || 0,
      isDefault: false,
      'default': false
    } as CategoryRequest & { default: boolean };

    const isNew = !this.editingCategoryId;
    const request = this.editingCategoryId
      ? this.categoriesApi.update(this.editingCategoryId, payload)
      : this.categoriesApi.create(payload);

    request.subscribe({
      next: category => {
        if (payload.type === 'EXPENSE') {
          this.categoriesApi.updateBudget(category.categoryId, payload.budgetLimit).subscribe({
            next: () => {
              this.loadData();
              // Only show budget prompt for NEW expense categories
              if (isNew) {
                this.newlyCreatedCategory = category;
                this.budgetForm = this.emptyBudgetForm();
                this.showBudgetPrompt = true;
              }
            },
            error: () => this.loadData()
          });
        } else {
          this.loadData();
        }
        this.modal.close();
      },
      error: () => { this.errorMessage = 'Unable to save category.'; },
      complete: () => { this.saving = false; }
    });
  }

  // User clicked "Yes, set a budget"
  confirmBudget(): void {
    const userId = this.session.userId();
    if (!userId || !this.newlyCreatedCategory) return;

    if (!this.budgetForm.limitAmount || this.budgetForm.limitAmount <= 0) {
      this.errorMessage = 'Please enter a valid budget limit.';
      return;
    }

    this.savingBudget = true;
    const payload: BudgetRequest = {
      userId,
      categoryId: this.newlyCreatedCategory.categoryId,
      name: this.newlyCreatedCategory.name,
      limitAmount: this.budgetForm.limitAmount,
      currency: this.session.profile()?.currency ?? 'INR',
      period: this.budgetForm.period,
      startDate: this.budgetForm.startDate,
      endDate: this.budgetForm.endDate,
      spentAmount: 0,
      alertThreshold: this.budgetForm.alertThreshold,
      isActive: true,
      active: true
    } as BudgetRequest & { active: boolean };

    this.budgetsApi.create(userId, payload).subscribe({
      next: (budget: Budget) => {
        // Sync existing expenses for this category
        const total = this.expenses
          .filter(e => e.categoryId === this.newlyCreatedCategory!.categoryId)
          .reduce((sum, e) => sum + e.amount, 0);
        if (total > 0) {
          this.budgetsApi.updateSpent(budget.budgetId, total).subscribe();
        }
        this.showBudgetPrompt = false;
        this.newlyCreatedCategory = null;
        this.savingBudget = false;
      },
      error: () => {
        this.errorMessage = 'Unable to create budget.';
        this.savingBudget = false;
      }
    });
  }

  // User clicked "No thanks"
  skipBudget(): void {
    this.showBudgetPrompt = false;
    this.newlyCreatedCategory = null;
  }

  removeCategory(category: Category): void {
    this.categoriesApi.remove(category.categoryId).subscribe({
      next: () => this.loadData(),
      error: () => { this.errorMessage = `Unable to delete ${category.name}.`; }
    });
  }

  formatAmount(amount: number): string {
    return formatCurrency(amount, this.session.profile()?.currency ?? 'INR');
  }

  private emptyForm() {
    return { name: '', type: 'EXPENSE', icon: '', colorCode: '#1D9E75', budgetLimit: 0 };
  }

  private emptyBudgetForm() {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);
    return { limitAmount: 0, period: 'MONTHLY', alertThreshold: 80, startDate, endDate };
  }
}