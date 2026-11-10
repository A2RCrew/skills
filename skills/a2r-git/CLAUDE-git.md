
## Git

- Por defecto, directo a la rama de trabajo, sin rama aparte ni pull request.
  Ante la duda, directo.
- Una rama se abre solo por aislamiento, vista previa o refactor amplio. La
  revision va antes de subir, asi que no abras una pull request para que alguien
  la lea si esa persona no lo ha pedido expresamente.
- Una tarea, un commit: los menos commits posibles. Lo que aun no se ha subido
  se refunde antes del push.
- Mensaje: `tipo(ambito): descripcion`, con la referencia de Linear `(A2R-nnn)` si
  el repositorio la exige. Lo que comprueba cada hook esta en `.git/a2r.conf`.
- Si la tarea no tiene issue y no esta claro si la merece, pregunta antes de
  commitear: crear la issue o salir con `(A2R-000)`.
- Antes de push: los tipos y el lint ya los comprueba el hook de cada commit.
  El `pnpm test` y el `pnpm build` los pasa el hook de pre-push si
  `.git/a2r.conf` lo pide, y si no, lanzalos a mano cuando el cambio toque
  tipos, configuracion o dependencias.
- Nunca `commit --no-verify` ni `push --force` sin `--force-with-lease`.
- Si `.git/a2r.conf` dice que Claude no pushea, el agente commitea y para.
- Si `.git/a2r.conf` fija `DOMINIOS_CORREO`, el commit va firmado con una cuenta
  de esos dominios; se ajusta con `git config user.email`, nunca con `--no-verify`.
- Actualizarse con rebase, nunca con merge.
