import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { AdminComponent } from './admin/admin.component';
import { ComponentsRoutingModule } from './components-routing.module';
import { ImageStorageComponent } from './image-storage/image-storage.component';
import { TbiComponent } from './tbi/tbi.component';
import { UserListComponent } from './user-list/user-list.component';
import { PaymentModule } from '../payment/payment.module';

@NgModule({
  declarations: [TbiComponent,ImageStorageComponent,UserListComponent,AdminComponent],
  imports: [CommonModule,
    FormsModule,
    CommonModule,
    ComponentsRoutingModule,
PaymentModule,
    MatTabsModule],
  exports: [TbiComponent, ImageStorageComponent,AdminComponent],
})
export class ComponentsModule {}
