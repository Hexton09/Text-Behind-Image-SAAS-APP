import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PaymentManagementComponent } from './payment-management/payment-management.component';

const routes: Routes = [
  {
    path: '', 
    component: PaymentManagementComponent,
  },
  
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PaymentRoutingModule {}
