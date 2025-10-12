import { Component } from '@angular/core';
import { SubscriptionService } from '../subscription.service';

@Component({
  selector: 'app-subscription',
  standalone: false,
  templateUrl: './subscription.component.html',
  styleUrl: './subscription.component.scss'
})
export class SubscriptionComponent {
  showCreditExhaustedPopup = false;

  constructor(private subscriptionService: SubscriptionService) {
    this.subscriptionService.creditExhaustedPopup$.subscribe(
      show => this.showCreditExhaustedPopup = show
    );
  }

  closePopup() {
    this.subscriptionService.closeCreditExhaustedPopup();
  }
}
