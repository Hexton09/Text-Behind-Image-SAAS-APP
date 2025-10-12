import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private creditExhaustedPopupSubject = new BehaviorSubject<boolean>(false);
  creditExhaustedPopup$ = this.creditExhaustedPopupSubject.asObservable();

  showCreditExhaustedPopup() {
    this.creditExhaustedPopupSubject.next(true);
  }

  closeCreditExhaustedPopup() {
    this.creditExhaustedPopupSubject.next(false);
  }
}
