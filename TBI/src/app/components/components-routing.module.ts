import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ImageStorageComponent } from './image-storage/image-storage.component';
import { TbiComponent } from './tbi/tbi.component';
import { UserListComponent } from './user-list/user-list.component';

const routes: Routes = [
  {
    path: '', 
    component: TbiComponent,
  },
  {
    path: 'image-storage',
    component: ImageStorageComponent,
  },{
    path: 'user-list',
component: UserListComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ComponentsRoutingModule {}
