# Despliegue en GitHub

## 1. Subir el proyecto

```bash
cd sena-flipbook-studio
git init
git add .
git commit -m "SENA Flipbook Studio v1.0.0"
git branch -M main
git remote add origin https://github.com/<usuario>/<repositorio>.git
git push -u origin main
```

`node_modules/` y `dist/` están en `.gitignore`.

## 2. Activar GitHub Pages

1. En el repositorio: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Cada `push` a `main` ejecuta `.github/workflows/ci.yml`: tipos, lint, pruebas, auditoría,
   build con `BASE_PATH=/<repositorio>/` y despliegue.
3. Los *pull requests* ejecutan las verificaciones sin desplegar.

## 3. Otros hosting estáticos

`npm run build` genera `dist/` con rutas relativas (`base: './'`), así que funciona en Netlify,
Vercel, un servidor Apache/Nginx o una subcarpeta. Si se publica en una ruta fija, compile con
`BASE_PATH=/ruta/ npm run build`.

## 4. Local con XAMPP (Apache)

1. Compile: `npm run build`.
2. Copie el **contenido** de `dist/` (incluido `.htaccess`) en `C:\xampp\htdocs\sena-flipbook-studio\`.
3. Inicie Apache en el panel de XAMPP y abra `http://localhost/sena-flipbook-studio/`.

No necesita PHP ni MySQL: es un sitio estático. Las rutas son relativas y la navegación usa `#`,
así que funciona en cualquier subcarpeta sin reglas de reescritura. Cada vez que cambie el código,
vuelva a compilar y reemplace la carpeta.

## Nota sobre los datos

El contenido editado se guarda en el navegador de cada persona. Para que todos vean la misma
publicación, exporte el JSON y reemplace `src/content/book.default.json` antes de compilar
(ver [CONTENIDO.md](CONTENIDO.md)), o implemente un `StorageAdapter` contra un servicio propio.
