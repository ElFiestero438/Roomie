## Prototipo visual

El prototipo visual de Roomie representa las principales pantallas de la aplicación y el flujo de navegación entre sus diferentes funcionalidades.

### 1. Inicio de sesión

**Descripción:**  
Permite al usuario ingresar a Roomie utilizando su correo electrónico y contraseña. También permite acceder al registro de una nueva cuenta o a la recuperación de contraseña.

**Funciones principales:**
- Inicio de sesión.
- Acceso al registro.
- Recuperación de contraseña.

![Pantalla de inicio de sesión](./prototipo/01-login.png)

---

### 2. Registro

**Descripción:**  
Permite crear una nueva cuenta ingresando los datos personales del usuario.

**Funciones principales:**
- Registro de usuario.
- Ingreso de nombre y correo.
- Creación y confirmación de contraseña.
- Regreso al inicio de sesión.

![Pantalla de registro](C:\Users\USER\Roomie\prototipo\registro.png)

---

### 3. Recuperación de contraseña

**Descripción:**  
Permite solicitar la recuperación de la contraseña mediante el correo electrónico registrado.

**Funciones principales:**
- Ingreso del correo electrónico.
- Solicitud de recuperación.
- Regreso al inicio de sesión.

![Pantalla de recuperación](./prototipo/03-recuperacion.png)

---

### 4. Home / Inicio

**Descripción:**  
Es la pantalla principal de Roomie. Presenta un resumen de la vivienda y permite acceder rápidamente a las principales funciones de la aplicación.

**Funciones principales:**
- Resumen de gastos.
- Resumen de tareas.
- Información de los integrantes.
- Acceso a gastos, tareas, compras y roomies.
- Acceso a notificaciones.

![Pantalla principal](./prototipo/04-home.png)

---

### 5. Gastos

**Descripción:**  
Permite administrar los gastos realizados dentro de la vivienda y consultar los saldos entre los integrantes.

**Funciones principales:**
- Registrar gastos.
- Consultar gastos.
- Consultar deudas y saldos.
- Filtrar gastos pendientes y pagados.
- Consultar detalles de los gastos.

![Pantalla de gastos](./prototipo/05-gastos.png)

---

### 6. Tareas

**Descripción:**  
Permite organizar las responsabilidades y tareas de la vivienda.

**Funciones principales:**
- Crear tareas.
- Asignar responsables.
- Establecer prioridades.
- Definir fechas.
- Marcar tareas como completadas.
- Filtrar tareas pendientes y completadas.

![Pantalla de tareas](./prototipo/06-tareas.png)

---

### 7. Lista de compras

**Descripción:**  
Permite administrar los productos que deben comprarse para la vivienda.

**Funciones principales:**
- Agregar productos.
- Definir cantidades.
- Clasificar productos por categorías.
- Marcar productos como comprados.
- Eliminar productos.
- Filtrar productos.

![Pantalla de lista de compras](./prototipo/07-compras.png)

---

### 8. Roomies

**Descripción:**  
Permite consultar y administrar los integrantes de la vivienda compartida.

**Funciones principales:**
- Consultar integrantes.
- Visualizar roles.
- Consultar balances.
- Invitar nuevos roomies.
- Administrar integrantes.

![Pantalla de roomies](./prototipo/08-roomies.png)

---

### 9. Notificaciones

**Descripción:**  
Centraliza los avisos relacionados con las actividades de la vivienda.

**Funciones principales:**
- Consultar notificaciones.
- Marcar notificaciones como leídas.
- Acceder a la sección relacionada con cada notificación.
- Eliminar notificaciones.

![Pantalla de notificaciones](./prototipo/09-notificaciones.png)

---

### 10. Perfil

**Descripción:**  
Permite administrar la información personal y algunas configuraciones de la cuenta.

**Funciones principales:**
- Consultar información personal.
- Editar datos.
- Configurar notificaciones.
- Acceder a opciones de cuenta.
- Cerrar sesión.

![Pantalla de perfil](./prototipo/10-perfil.png)

---

## Colorimetría

La interfaz de Roomie utiliza una combinación de rojo, negro, blanco y tonos grises para mantener una apariencia moderna, sencilla y consistente.

| Color | Código HEX | Uso |
|---|---|---|
| Rojo principal | `#E21B2D` | Botones, acciones principales y elementos destacados |
| Negro | `#111111` | Títulos y textos principales |
| Gris | `#6B7280` | Textos secundarios |
| Gris claro | `#F3F4F6` | Fondos y tarjetas |
| Blanco | `#FFFFFF` | Fondo principal y contraste |

## Flujo de navegación

El flujo principal de Roomie comienza en el **Inicio de sesión**. Desde allí, el usuario puede registrarse o recuperar su contraseña. Una vez autenticado, accede al **Home**, desde donde puede navegar hacia **Gastos, Tareas, Lista de compras, Roomies y Notificaciones**. La sección **Perfil** permite modificar información personal y cerrar sesión, regresando nuevamente al inicio de sesión.
