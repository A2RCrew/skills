
## Git

- Por defecto, directo a la rama de trabajo, sin rama aparte ni pull request.
  Ante la duda, directo.
- Una rama se abre solo por aislamiento, vista previa, revision o refactor amplio.
- Mensaje: `tipo(ambito): descripcion`, con la referencia de Linear `(A2R-nnn)` si
  el repositorio la exige. Lo que comprueba cada hook esta en `.git/a2r.conf`.
- Antes de push: `pnpm build` y las pruebas del area que has tocado. Los tipos y
  el lint ya los comprueba el hook de cada commit.
- Nunca `commit --no-verify` ni `push --force` sin `--force-with-lease`.
- Si `.git/a2r.conf` dice que Claude no pushea, el agente commitea y para.
- Actualizarse con rebase, nunca con merge.
