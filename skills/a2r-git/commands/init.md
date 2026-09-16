---
description: Monta este repositorio con los hooks de git y la configuracion del estandar de A2R.
allowed-tools: Bash
---

Cinco cosas cambian de un repositorio a otro. Antes de instalar, mira el
repositorio y pregunta por las cinco, proponiendo lo que encaje:

1. **Que ramas se protegen** de commit y push directo. Si hay `develop`, lo
   normal es proteger `main` y `releases`. Si el trabajo del dia va a `main`
   porque no hay `develop`, protegerla dejaria el repositorio sin sitio donde
   commitear: ahi seguramente no se protege ninguna.
2. **Si el mensaje lleva referencia de Linear** `(A2R-123)`. En los repos de
   producto si; en uno interno sin issues, exigirla solo produce `(A2R-000)`.
3. **Si Claude puede hacer `git push`**. Decir que no anade un hook a
   `.claude/settings.local.json`: el agente commitea y para, y sube una persona
   que mira antes lo que sube. Es lo razonable donde el push despliega.
4. **Con que correo se commitea**. En un repositorio de trabajo, solo cuentas
   de `a2r.com` y `binpar.com`: el hook mira el `user.email` del clon antes de
   cada commit. En uno personal se deja vacio. Si dicen que si, mira
   `git log --format=%ae -20` por si algun correo habitual se queda fuera.
5. **Si el `pre-push` pasa `pnpm build`**. El `pre-commit` ya pasa tsc y lint,
   y con las reglas que llevan nuestros repos eso adelanta casi todo lo que
   rompe el build, pero el lint no compila. Di que si donde el push despliega o
   el build tarde poco; que no donde compilar entero sea lento y se prefiera
   lanzarlo a mano.

Luego ejecuta `${CLAUDE_PLUGIN_ROOT}/instalar.sh` con las respuestas y ensena su
salida:

    instalar.sh --ramas "main releases" --issue si --claude-push no --correo "a2r.com binpar.com" --build si
    instalar.sh --ramas "" --issue no --claude-push si --correo "" --build no

Si el script dice que algun hook ya existia y es distinto, abrelo, comparalo con
el de `${CLAUDE_PLUGIN_ROOT}/githooks/` y anade lo que falte sin quitar lo que
hubiera: puede ser de husky o del propio proyecto.

Nada de esto se commitea: vive en el `.git` de ese clon. Al terminar, recuerda
que cada persona lo ejecuta en el suyo, y que proteger `main` de verdad son los
rulesets de GitHub.
