import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { SpinnerService } from '../../services/spinner/spinner.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const spinnerService = inject(SpinnerService);
  
  // Mostrar el spinner al iniciar la petición
  spinnerService.show();
  
  return next(req).pipe(
    finalize(() => {
      // Ocultar el spinner cuando termine la petición (éxito o error)
      setTimeout(() => {
        spinnerService.hide();
      }, 200);
    })
  );
};
