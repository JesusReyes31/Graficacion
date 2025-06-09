# 📊 Sistema de Diagramación UML

Este proyecto permite la generación de proyectos de manera automática (Frontend y Backend), a partir de la creaci+on y edición de diagramas UML

---
## 📁 Repositorios

- 🌐 Frontend: [Graficacion](https://github.com/JesusReyes31/Graficacion)
- 🔧 Backend: [grafbackend](https://github.com/ValdezErnes/grafbackend)

----
## 🚀 Cómo usar este sistema

### 1. **Clona los repositorios:**

```bash
git clone https://github.com/JesusReyes31/Graficacion
git clone https://github.com/ValdezErnes/grafbackend

```

### 2. **Accede a la carpeta del proyecto e instala dependencias:**
#### 2.1 Frontend
```bash
cd Graficacion
npm install --force
```
#### 2.2 Backend
```bash
cd ../grafbackend
npm install --force
```

### 3. **Configura Variables de entorno (en grafbackend):**
Dentro del proyecto grafbackend, crea un archivo .env y agrega lo siguiente:

```bash 
PORT=Puerto_Backend
DB_HOST=Host_DB
DB_USER=Usuario_DB
DB_PASSWORD=Contraseña_DB
DB_NAME=NombreBD
DB_PORT=Puerto_DB
```
Sustituye los valores por los datos reales de tu base de datos y servidor.

### 4. **Ejecuta ambos proyectos:**
#### 4.1 Graficacion:
```bash
cd Graficacion
ng serve -o
```

#### 4.2 Backend (grafbackend):
```bash
cd grafbackend
npm run dev
```

### 🧪 Ejemplo de uso

1. **Crear proyecto** (si no existe ninguno).
2. **Seleccionar el proyecto**. Se mostrarán los diagramas UML que se pueden hacer, al dar clic en cada uno se creará una versión automáticamente en la BD. Puedes crear nuevas versiones con el botón **"Nueva Versión"**.
3. **Editar los diagramas UML**. Entra a cada uno, edítalo, y haz clic en **Guardar** cuando termines:
    - **3.1 Diagrama de Casos de Uso**: Arrastra actores y casos de uso (dentro del área de sistema).
   - **3.2 Diagrama de Secuencias**: Añade líneas y acciones (pueden conectarse).
   - **3.3 Diagrama de Paquetes**: Añade paquetes y nodos.
   - **3.4 Diagrama de Componentes**: Añade componentes e interfaces (Requerida y Ofrecida).
   - **3.5 Diagrama de Clases**: Añade clases, relaciones, atributos y métodos. Usa el ícono de lápiz para editar atributos/métodos.
        - **Relaciones entre clases**: Se deben seleccionar las 2 clases que se quieren unir (primero la Clase padre y luego la clase hija).
            - Generan un nuevo espacio en la edición de la clase llamado Relaciones donde podrás vincular campos.
            - En el espacio que se agrega, selecciona un campo de la clase padre en el select, luego:
                - Si el campo de la clase hija **no existe**, se te pedirá nombrarlo.
                - Si **ya existe** en la clase hija, selecciónalo en el desplegable.
                - Haz clic en **"Mapear campo"** para completar la relación.
4. Una vez editados todos los diagramas, haz clic en **Generar Código** (parte superior derecha).
5. Selecciona las versiones de los diagramas y da clic en **Siguiente**.
6. **Agregar credenciales de conexión** para el proyecto (Host, Usuario, Contraseña, Nombre de la BD, Puerto).
   - Si se crea una nueva, al guardar aparecerá seleccionada automáticamente.
7. Haz clic en **Generar** y espera a que se instale todo.
8. Una vez finalizado y con éxito, encontrarás el proyecto generado en:

   ```
   C:\Users\[TuNombreDeUsuario]\Proyectos\Nombre_Proyecto
   ```
      
