
## Git

- El trabajo del dia va directo a `develop`, sin rama ni pull request.
- Una rama se abre solo por aislamiento, vista previa, revision o refactor amplio.
- Mensaje: `tipo(ambito): descripcion (A2R-nnn)`.
- Antes de push: `pnpm build` y las pruebas del area que has tocado. Los tipos y
  el lint ya los comprueba el hook de cada commit.
- Nunca `commit --no-verify` ni `push --force` sin `--force-with-lease`.
- Actualizarse con rebase, nunca con merge.
