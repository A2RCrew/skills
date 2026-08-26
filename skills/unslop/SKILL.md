---
name: unslop
description: >
  Revisa y reescribe prosa editable en castellano de España para reducir clichés, relleno,
  calcos y tics recurrentes de textos generados por IA sin cambiar hechos, postura,
  incertidumbre, voz ni terminología. Úsala en documentación, actas, informes, mensajes de
  commit, comentarios de código y respuestas al usuario. No la apliques a contenido que deba
  conservarse literalmente, como citas, transcripciones, código, datos o nombres.
---

# Unslop (castellano de España)

Quita los patrones mecánicos de la prosa sin sustituirlos por otra voz artificial ni alterar el
contenido.

## Orden de prioridad

Cuando dos indicaciones entren en conflicto, sigue este orden:

1. Instrucciones expresas del usuario.
2. Fidelidad a los hechos, la intención, la postura, la voz, el grado de certeza y la terminología.
3. Convenciones del repositorio, del medio y del tipo de documento.
4. Corrección gramatical y ortotipográfica.
5. Claridad y concisión.
6. Preferencias de estilo de esta guía.

No inventes datos, fuentes, opiniones, contradicciones ni ejemplos para dar voz al texto. No
modifiques citas, transcripciones, código, comandos, identificadores, nombres de productos,
formatos de intercambio ni datos literales. En textos legales, regulados o sujetos a una guía de
estilo, conserva las fórmulas y convenciones exigidas. No neutralices una postura ni borres una voz
deliberada solo para que el texto suene más sobrio.

## Proceso

1. Identifica el género, el tono, las convenciones aplicables y los fragmentos que no se pueden
   modificar.
2. Busca problemas reales en su contexto. Las expresiones de esta guía son señales para revisar,
   no una lista negra.
3. Haz el cambio mínimo que mejore el texto. Conserva toda distinción semántica relevante.
4. Comprueba que la revisión no haya añadido contenido, eliminado reservas necesarias ni cambiado
   el grado de certeza.
5. Lee el resultado seguido. Corrige monotonía, rigidez o fórmulas repetidas solo si perjudican al
   texto.

## Entrega

Si el usuario pide reescribir, devuelve por defecto el texto revisado sin un inventario exhaustivo
de cambios. Si pide revisar, diagnosticar o comparar, separa la propuesta de las observaciones y
explica solo los cambios que ayuden a decidir. Conserva el formato de entrada salvo que el usuario
pida otro o que el formato actual sea parte del problema.

## Voz y ritmo

Adapta la voz al género. Un acta debe ser fiel y sobria; una explicación puede ser cercana; un
mensaje de commit debe ser directo. No introduzcas primera persona, opiniones o contradicciones si
no estaban en el original o el usuario no las ha pedido.

Varía la longitud de las frases cuando mejore la lectura, no para simular espontaneidad. Mantén una
estructura clara. La precisión suele dar más voz que el desorden: cambia una valoración genérica
por el hecho, el mecanismo o el ejemplo que la justifica cuando esa información esté disponible.

## Patrones que conviene revisar

### Contenido

1. **Grandilocuencia y publicidad.** Expresiones como «punto de inflexión», «hito histórico»,
   «vibrante», «revolucionario» o «de visita obligada» suelen necesitar una prueba o una
   descripción concreta. Rebájalas cuando exageren; consérvalas si expresan una valoración
   atribuida o deliberada.
2. **Nombres sin aportación.** No acumules medios, empresas o autoridades como argumento de
   autoridad. Explica qué aporta cada referencia y conserva las que sean relevantes.
3. **Atribuciones vagas.** En afirmaciones como «los expertos coinciden» o «según diversos
   estudios», identifica una fuente verificable. Si no existe, elimina la afirmación sin respaldo,
   no el aviso de incertidumbre.
4. **Concesiones automáticas.** Revisa fórmulas como «a pesar de los desafíos» cuando solo simulen
   equilibrio. Sustitúyelas por el obstáculo concreto o suprímelas si no añaden información.
5. **Conclusiones vacías.** «El futuro se presenta prometedor» o «solo el tiempo lo dirá» no
   sustituyen un dato, una decisión o un siguiente paso.

### Sintaxis y léxico

6. **Gerundios ambiguos.** Reescribe el gerundio cuando presente como simultánea una acción
   claramente posterior o cuando oculte una relación de consecuencia o conclusión. No señales una
   forma solo porque termine en *-ando* o *-iendo*: el gerundio de modo o de simultaneidad puede ser
   correcto. «Lo que permite» no es un gerundio.
7. **Pasiva innecesaria.** Prefiere la activa cuando interesa saber quién actúa: «el compilador
   valida las consultas». La pasiva perifrástica y la refleja son construcciones válidas; mantenlas
   cuando el agente sea desconocido, irrelevante o menos importante que el objeto del que se habla.
8. **Vocabulario formulario.** Revisa, entre otras, «cabe destacar», «crucial», «fundamental»,
   «panorama», «sinergia», «poner de relieve», «potenciar», «impulsar», «holístico» y
   «disruptivo». Cámbialas solo cuando funcionen como comodines; un término exacto del dominio se
   conserva.
9. **Verbos hinchados.** «Se erige como», «se alza como» o «desempeña un papel» suelen admitir un
   verbo que nombre la acción. No conviertas automáticamente «constituye», «representa»,
   «facilita» o «visualiza» en «es», «ayuda» o «ve»: pueden significar cosas distintas.
10. **Estructuras de plantilla.** Revisa «no solo..., sino también», las series de tres y los
    rangos «desde... hasta...» cuando la forma haya impuesto una relación que las ideas no tienen.
    Consérvalos cuando expresen una coordinación, una enumeración o una escala reales.
11. **Ciclo de sinónimos.** No cambies un término técnico por varios sinónimos para evitar
    repetirlo. Usa el mismo nombre para el mismo concepto.

### Puntuación y presentación

12. **Raya como conector inglés.** Evita la raya aislada usada únicamente para imitar una pausa
    enfática, como en «el sistema falla — y falla pronto». La raya sí puede funcionar como signo
    doble en incisos y como signo simple en diálogos o enumeraciones.
13. **Dos puntos gratuitos.** Úsalos cuando exista una relación anunciativa clara: enumeración,
    ejemplo, explicación, causa, consecuencia o conclusión. No los insertes solo para dar énfasis.
    Después se escribe minúscula por regla general, con las excepciones ortográficas aplicables,
    como ciertas citas y fórmulas epistolares.
14. **Formato mecánico.** Reduce la negrita, los emojis y las listas etiquetadas cuando sean
    decorativos o redundantes. Consérvalos cuando aporten jerarquía, navegación o legibilidad.
15. **Mayúsculas en títulos.** En castellano, escribe con mayúscula la primera palabra y los nombres
    propios, salvo que una convención externa exija otra cosa. Meses, días, idiomas y gentilicios
    van normalmente en minúscula.
16. **Convenciones ortotipográficas.** Sigue primero la guía del proyecto y el formato de destino.
    En prosa española son habituales las comillas angulares, el espacio ante el símbolo de
    porcentaje y los signos de apertura. No añadas una coma de Oxford por sistema, pero conserva la
    coma ante «y» cuando la sintaxis la requiera. No localices números, fechas, comillas o
    separadores dentro de código, datos o formatos interoperables.

### Calcos y variante lingüística

17. **Calcos de construcción.** Revisa «en base a», «a nivel de», «previo a», «el mismo» usado
    como pronombre, «asumir» por «suponer» y «eventualmente» por «finalmente». Elige alternativas
    como «según», «con base en», «en», «antes de» o la repetición del sustantivo cuando expresen
    el mismo significado.
18. **Falsos amigos.** En español, un billón es un millón de millones. Comprueba siempre la escala
    y el contexto de la fuente.
19. **Castellano de España.** Prefiere, cuando encajen con la audiencia, «ordenador», «móvil»,
    «comprobar», «monitorizar», «cifrar», «ejecutar un script», «iniciar sesión», «personalizar»
    y «hacer clic» o «pulsar». Respeta la terminología del repositorio y no sustituyas términos con
    significado técnico propio, como «administrar».

### Conversación y relleno

20. **Fórmulas de chatbot.** Quita aperturas, cierres y muestras de entusiasmo que no cumplan una
    función: «¡Claro!», «¡Perfecto!», «Aquí tienes» o «No dudes en preguntar». Una confirmación
    breve sí es útil cuando aclara qué se hará o qué se ha entendido.
21. **Adulación automática.** No uses «buena pregunta» o «tienes toda la razón» como reflejo. Si
    el usuario ha detectado un error, reconoce el hecho concreto.
22. **Límites y dudas.** No ocultes incertidumbre ni falta de acceso. Verifica la afirmación cuando
    sea posible; si no, explica de forma precisa qué dato falta, reduce el alcance de la afirmación
    o elimina la afirmación no sustentada.
23. **Muletillas.** Acorta «con el fin de», «debido al hecho de que», «en el caso de que» o «a día
    de hoy» cuando «para», «porque», «si» u «hoy» conserven el sentido. No borres conectores que
    expresen una relación necesaria.
24. **Hipótesis acumuladas.** Simplifica cadenas como «podría llegar a ser posible que quizá» sin
    eliminar el grado de duda que la fuente necesita.

### Precisión y claridad

25. **Metáforas abstractas.** Revisa «palanca», «vector», «prisma», «andamiaje», «estrella polar»
    u «hoja de ruta» cuando oculten el mecanismo real. Consérvalas si son términos del dominio o
    si la metáfora aporta una comparación deliberada.
26. **Valoraciones sin soporte.** En documentación técnica, cambia sensaciones genéricas por un
    comportamiento observable cuando dispongas de él. No elimines contexto, razones, restricciones,
    definiciones o advertencias por no poder convertirlos en un número.
27. **Frases densas.** Divide una frase cuando sus subordinadas dificulten seguir la idea. No
    impongas una idea por oración si la relación entre ellas se entiende mejor junta.
28. **Adverbios vagos.** Revisa adverbios como «significativamente» o «rápidamente» cuando eviten
    precisar una medida disponible. Los adverbios en *-mente* no son incorrectos por sí mismos.
29. **Palabra llana.** Prefiere la opción más clara que conserve el matiz. «Usar» puede ser mejor
    que «utilizar» y «hacer» mejor que «realizar», pero ninguna sustitución es automática.

## Comprobación final

Antes de entregar el texto, confirma que:

- conserva todos los hechos, reservas, decisiones y relaciones causales del original;
- respeta la voz, las citas, los términos técnicos y las convenciones del proyecto;
- no ha adquirido opiniones, contradicciones, desorden o familiaridad que nadie pidió;
- no repite fórmulas vacías ni fuerza variedad por miedo a repetir un término preciso;
- suena adecuado para su género y su audiencia, aunque no parezca deliberadamente «humano».
