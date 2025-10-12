import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { SubscriptionComponent } from './subscription/subscription.component';

@NgModule({
  declarations: [SubscriptionComponent],
  imports: [CommonModule,
    FormsModule,
    CommonModule,
    MatTabsModule],
  exports: [SubscriptionComponent],
})
export class PaymentModule {}
