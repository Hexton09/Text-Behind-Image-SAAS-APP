import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { SubscriptionComponent } from './subscription/subscription.component';
import { PaymentManagementComponent } from './payment-management/payment-management.component';
import { PaymentRoutingModule } from './payment-routing.module';

@NgModule({
  declarations: [SubscriptionComponent , PaymentManagementComponent],
  imports: [CommonModule,
    PaymentRoutingModule,
    FormsModule,
    CommonModule,
    MatTabsModule],
  exports: [SubscriptionComponent],
})
export class PaymentModule {}
