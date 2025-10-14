import { Component, signal } from '@angular/core';

type ViewType = 'currentPlan' | 'paymentHistory' | 'plans';

@Component({
  selector: 'app-payment-management',
  standalone: false,
  templateUrl: './payment-management.component.html',
  styleUrl: './payment-management.component.scss'
})
export class PaymentManagementComponent {
  // Signal to manage the active view, defaulting to 'currentPlan'
  activeView = signal<ViewType>('currentPlan');

  // Hardcoded payment history data for display
  paymentHistory = [
    { id: 1, date: 'Oct 13, 2025', amount: '$25.00', status: 'Paid' },
    { id: 2, date: 'Sep 13, 2025', amount: '$25.00', status: 'Paid' },
    { id: 3, date: 'Aug 13, 2025', amount: '$25.00', status: 'Paid' },
    { id: 4, date: 'Jul 13, 2025', amount: '$25.00', status: 'Paid' },
  ];

  /**
   * Sets the current view based on user selection.
   * @param view The view to activate.
   */
  setView(view: ViewType) {
    this.activeView.set(view);
  }

  /**
   * Returns the appropriate CSS classes for a navigation link.
   * Highlights the link if it's the currently active view.
   * @param view The view associated with the navigation link.
   * @returns A string of CSS classes.
   */
  getNavClasses(view: ViewType) {
    if (this.activeView() === view) {
      return 'bg-[#155dfc]/10 text-[#155dfc]'; // Active link styles
    }
    return 'text-[#666] hover:bg-[#999]/10 hover:text-[#444]'; // Inactive link styles
  }
}
