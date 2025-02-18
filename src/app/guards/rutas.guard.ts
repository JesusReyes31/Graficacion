import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const rutasGuard: CanActivateFn = (route, state) => {
  const router = inject(Router)
  const token = localStorage.getItem('proyecto');

    if (!token) {
      router.navigate(['/']);
      return false;
    }
    
    return true;
};
