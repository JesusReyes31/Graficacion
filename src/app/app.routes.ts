import { Routes } from '@angular/router';
import { CUComponent } from './cu/cu.component';
import { AppComponent } from './app.component';
import { ComponentesComponent } from './componentes/componentes.component';
import { PaquetesComponent } from './paquetes/paquetes.component';
import { ClasesComponent } from './clases/clases.component';
import { SecuenciaComponent } from './secuencia/secuencia.component';
import { rutasGuard } from './guards/rutas.guard';

export const routes: Routes = [
    {path:"cu",component:CUComponent,canActivate:[rutasGuard]},
    {path:"componentes",component:ComponentesComponent},
    {path:"paquetes",component:PaquetesComponent},
    {path:"clases",component:ClasesComponent},
    {path:"secuencia",component:SecuenciaComponent},
    {path:"*",redirectTo:""}
];
