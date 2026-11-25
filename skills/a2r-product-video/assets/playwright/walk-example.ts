// Ejemplo de guion de grabación con walk-lib.ts.
// Copia los dos ficheros a e2e/ del repo nimrod-multitenant (importan ./lib/directus), graba y
// bórralos al acabar: no se commitean.
//
// Uso: AW=<id-del-trabajo-DEMO> UNIT=<ruta-del-PDF> npx tsx e2e/walk-example.ts <toma[,toma]|all> <dir-clips>
//
// Cada toma deja en <dir-clips>:
//   <toma>.webm         la grabación entera, a 1600×900
//   <toma>.json         { start, end, url }: start es el segundo en que empieza la acción,
//                       y es el 0 de los tramos `seg` de plan.json
//   <toma>-final.png    el último estado, para revisar
// Si en pantalla queda algo que casa con LEAK_RE, lo avisa por consola.
import { type Page } from '@playwright/test';
import { record, sleep, hover, click, soft, scrollBy, at, type Clip } from './walk-lib';

const [which = 'all', OUT = '/tmp/rec'] = process.argv.slice(2);
const AW = process.env.AW ?? ''; // id del trabajo DEMO creado para el vídeo
const UNIT = process.env.UNIT ?? ''; // PDF de la unidad que se sube en la toma de contexto

// Lo que en PRE sale con nombres reales y no se puede limpiar se reescribe en el navegador.
// [texto real, texto que se ve]. Pon aquí compañeros («Creado por»), plantillas de cliente, etc.
// Ojo: el renombre no llega a los ficheros exportados; para eso, exporta con una marca DEMO.
const RENAMES: [string, string][] = [
  ['Nombre Apellido', 'Marta Gil'],
  ['Editorial Real', 'Editorial DEMO'],
];
// [expresión, sustitución, flags]
const REGEXES: [string, string, string][] = [
  ['LOCAL · prueba A2R-\\d+[^«»"]*', 'DEMO · Repaso de Ciencias', 'g'],
  ['\\s*\\(A2R-\\d+\\)', '', 'g'],
];

const w = (p: string) => `/activity-generation/${AW}${p}`;

const CLIPS: Record<string, Clip> = {
  // Toma real del walkthrough de Actividades: subir el material de contexto.
  t_contexto: {
    url: w('/context'),
    ready: (p: Page) => p.getByText('Elegir de la biblioteca'),
    run: async (page) => {
      // T(s) espera hasta el segundo s de la acción: así el ritmo no depende de lo que tarde la app.
      const T = at(Date.now());
      await T(0.6);
      await soft('subir', () => hover(page, page.getByText(/Arrastra/).first(), 800));
      await page.locator('input[type=file]').first().setInputFiles(UNIT);
      await T(2.0);
      await soft('botón', () => click(page, page.getByRole('button', { name: /^Subir/ }).first()));
      // No cierres la toma con una subida a medias: cerrar el contexto la corta.
      for (let i = 0; i < 120 && (await page.getByText(/Subiendo/).count()) > 0; i++) await sleep(500);
      await T(4.5);
      await soft('biblioteca', () => hover(page, page.getByText('Elegir de la biblioteca').first(), 800));
      await T(8.0);
    },
  },

  // Plantilla de toma de listado. Explora el DOM antes (references/recording.md) y ajusta los
  // selectores: estos son orientativos.
  t_listado: {
    url: '/activity-generation',
    ready: (p: Page) => p.getByRole('table'),
    // prep corre antes de que empiece la acción: filtra aquí por DEMO, para que el listado sin
    // filtrar no llegue a verse.
    prep: async (page) => {
      void page;
    },
    run: async (page) => {
      const T = at(Date.now());
      await T(0.8);
      await soft('fila', () => hover(page, page.getByRole('row').nth(1), 900));
      await T(3.0);
      await scrollBy(page, 400, 1200);
      await T(5.0);
    },
  },
};

record(CLIPS, which, OUT, RENAMES, REGEXES).catch((e) => {
  console.error(e);
  process.exit(1);
});
