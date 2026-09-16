
## Git

- Por defecto, directo a la rama de trabajo, sin rama aparte ni pull request.
  Ante la duda, directo.
- Una rama se abre solo por aislamiento, vista previa o refactor amplio. La
  revision va antes de subir, asi que no abras una pull request para que alguien
  la lea si esa persona no lo ha pedido expresamente.
- Mensaje: `tipo(ambito): descripcion`, con la referencia de Linear `(A2R-nnn)` si
  el repositorio la exige. Lo que comprueba cada hook esta en `.git/a2r.conf`.
- Antes de push: `pnpm build` y las pruebas del area que has tocado. Los tipos y
  el lint ya los comprueba el hook de cada commit.
- Nunca `commit --no-verify` ni `push --force` sin `--force-with-lease`.
- Si `.git/a2r.conf` dice que Claude no pushea, el agente commitea y para.
- Si `.git/a2r.conf` fija `DOMINIOS_CORREO`, el commit va firmado con una cuenta
  de esos dominios; se ajusta con `git config user.email`, nunca con `--no-verify`.
- Actualizarse con rebase, nunca con merge.
