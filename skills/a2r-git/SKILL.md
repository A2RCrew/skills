---
name: a2r-git
description: Reglas de A2R para commitear, agrupar cambios y decidir si abrir una rama o una pull request. Usar al cerrar trabajo o al subirlo, cuando se pida "haz commit", "commitea", "sube esto", "cierra esto", "deja esto listo", "abre una rama", "branch", "abre una PR" o "pull request", y antes de hacer push en cualquier repositorio de A2R.
---

# Git en A2R

Lo comprobable lo comprueban los hooks del repositorio. Si uno rechaza, lee el
error y corrigelo; no lo esquives con `--no-verify`. Lo demas, que el commit
sea una unidad y que el mensaje explique por que, no lo puede mirar un hook.

Si al clonar no saltan, montalos con `/a2r-git:init`: ahi se eligen las ramas
protegidas, si el mensaje lleva referencia de Linear y si Claude puede pushear,
que no todos los repositorios trabajan igual. Todo queda en el `.git` de tu
clon, asi que va por persona y hay que ejecutarlo en cada uno. Lo que tiene que
valer para todos va en los rulesets de GitHub, no en un hook que se salta con
una bandera.

Donde el push es cosa de una persona, deja el commit hecho y dilo. No es un
obstaculo que rodear: subir es el momento de mirar lo que sube.

## Antes de empezar

`git status -sb`. Si la rama no es la que esperabas, o hay commits sin subir de
antes, resuelvelo antes de anadir nada encima.

## Que entra en un commit

Un commit es una unidad que vale por si sola: se puede desplegar, se puede
revertir entera y se entiende leyendo su mensaje.

Cuando has escrito mucho codigo de golpe, agrupa por unidad que aporta valor
completa, no por archivo ni por orden de escritura.

- El endpoint nuevo con su validacion, su tipo y su prueba: un commit.
- Un arreglo, un refactor y un cambio de formato: tres commits.
- Renombrar algo en cuarenta archivos: un commit, aunque sean cuarenta.

Si al escribir el mensaje aparece una conjuncion ("y", "ademas", "tambien"),
casi siempre son dos commits.

Un cambio de comportamiento y un reformateo automatico nunca van en el mismo
commit: el diff deja de ser legible.

Cada commit deja `develop` desplegable. Si el cambio necesita una migracion, la
migracion va en el mismo commit. Si el trabajo no cabe en una sesion, commitea
lo que ya funciona y deja lo demas sin commitear.

## El mensaje

    tipo(ambito): descripcion en minuscula y sin punto final (A2R-nnn)

Tipos: feat, fix, docs, style, refactor, perf, test, chore, ci, build, revert.
El ambito es el modulo o el paquete. Donde el repositorio exige referencia de
Linear va al final, y `(A2R-000)` cuando el cambio no tiene issue.

El asunto no pasa de 72 caracteres. Lo que no quepa va en el cuerpo, tras una
linea en blanco, y ahi se explica por que se hizo, no que se hizo: el que esta
en el diff.

## Antes de hacer push

`pnpm build` y las pruebas del area que has tocado. Los tipos y el lint ya los
ha comprobado el hook en cada commit. Si algo falla, no subas: arreglalo o deja
el commit en local y dilo.

Ordena lo que vas a subir. Si hay commits de "wip", "fix del fix" o "cambios",
refundelos con `git rebase -i`. Una vez en `develop` ya no se reescriben.

## Rama o directo a develop

Por defecto, directo a `develop`. La rama es la excepcion, y se abre por uno de
estos cuatro motivos, solo por uno de ellos.

1. Trabajo largo que no se puede desplegar a medias.
2. Vista previa que hay que ensenar, aprovechando la URL de la pull request.
3. Revision de otra persona antes de que el cambio entre.
4. Refactor amplio que conviene poder revertir de una vez.

Si no aplica ninguno, va directo a `develop`. Que el cambio sea grande, que
parezca importante o que en otro sitio se trabajara asi no son motivos. Ante la
duda, directo: un commit en `develop` se revierte en diez segundos, y una rama
que nadie fusiona envejece, se llena de conflictos y acaba costando mas que el
cambio que lleva dentro.

El nombre es `tipo/a2r-nnn-descripcion-corta` y la rama se borra al fusionar. Si
la abriste para que alguien la lea, no la fusiones tu.

## Actualizarse

Siempre con rebase: `git pull --rebase` o `git rebase origin/develop`. Un commit
ya publicado no se reescribe, se corrige hacia delante con `git revert`.

## Lo que no se hace

- `git commit --no-verify`.
- `git push --force` sin `--force-with-lease`.
- Commitear o pushear directo en una rama protegida del repositorio.
- Subir `.env`, credenciales, volcados de base de datos o `node_modules`.
