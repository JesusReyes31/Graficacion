import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const rutasGuard: CanActivateFn = (route, state) => {
  const router = inject(Router)
  const token = sessionStorage.getItem('proyecto');
  console.log(token);
  if (!token) {
    router.navigate(['/']);
    return false;
  }
    
  return true;
};
