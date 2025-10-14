import { Component } from '@angular/core';
import { SubscriptionService } from '../subscription.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-subscription',
  standalone: false,
  templateUrl: './subscription.component.html',
  styleUrl: './subscription.component.scss'
})
export class SubscriptionComponent {
  showCreditExhaustedPopup = false;
  isYearly = false; // Tracks the state of the billing toggle

  // Properties for the premium plan to make them dynamic
  premiumPrice = 100;
  premiumBillingCycle = '/month';
  premiumCredits = 20;

  constructor(private subscriptionService: SubscriptionService, public route: Router) {
    this.subscriptionService.creditExhaustedPopup$.subscribe(
      show => this.showCreditExhaustedPopup = show
    );
  }

  // Handles the logic when the toggle is clicked
  onBillingToggle() {
    this.isYearly = !this.isYearly;

    if (this.isYearly) {
      this.premiumPrice = 1000;
      this.premiumBillingCycle = '/year';
      this.premiumCredits = 25;
    } else {
      this.premiumPrice = 100;
      this.premiumBillingCycle = '/month';
      this.premiumCredits = 20;
    }
  }

  closePopup() {
    this.subscriptionService.closeCreditExhaustedPopup();
  }
}