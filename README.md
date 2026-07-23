# WB Media Downloader

React-приложение для скачивания фото и видео с карточки Wildberries по артикулу.

## Стек

- **React 19 + TypeScript (strict)**
- **Vite**
- **FSD** (Feature-Sliced Design)
- **TanStack Query** — server state (карточка, CDN route maps, media)
- **Ant Design** — UI-kit
- **Tailwind CSS v4** — layout/утилиты
- **JSZip + file-saver** — ZIP с фото
- **mux.js** — клиентский remux HLS (MPEG-TS) → MP4
- **oxlint** — строгий lint (см. ниже)
- **husky + lint-staged** — pre-commit lint staged files

## Запуск

```bash
npm install
npm run dev
```

Откройте http://localhost:5173, введите артикул (пример: `604174866`) → «Скачать фото».

```bash
npm run build     # production build
npm run preview   # локальный preview (нужен proxy, см. ниже)
npm run lint      # oxlint, warnings = fail
npm run typecheck # tsc project references
```

## Линтинг и git hooks

Конфиг: `.oxlintrc.json`.

**Что включено как error (оправданно для прод):**

| Блок | Зачем |
|------|--------|
| `correctness` + `suspicious` + `perf` | баги, почти-баги, лишние аллокации |
| React hooks / exhaustive-deps / jsx-key | классика production React |
| no-explicit-any / no-non-null-assertion | держим strict TS |
| type-only imports | tree-shake + читаемость |
| import/no-cycle | FSD/границы модулей |
| promise/param-names, no-nesting | предсказуемые async-ошибки |
| no-console (кроме warn/error) | не тащим debug в прод |
| unicorn (выборочно) | современный JS без педантичного шума |

**Что сознательно выключено:**

- `pedantic` / `restriction` целиком — шум (magic numbers, no-ternary, jsx-max-depth)
- `no-await-in-loop` — sequential probe качества / worker pool
- `unicorn/prefer-spread` — ломает корректное копирование `Uint8Array`
- `import/no-named-export` / `prefer-default-export` — конфликт с FSD public API
- `react/react-in-jsx-scope` — React 17+ JSX transform

**Hook:** `.husky/pre-commit` → `lint-staged` → `oxlint --deny-warnings` только на staged `*.{ts,tsx,js,jsx,mjs,cjs}`.

После `npm install` husky ставится через `prepare`.

## Как устроено получение медиа

### 1. Карточка товара

Запрос к публичному detail-API:

`GET /cards/v4/detail?nm={article}&…`  
(в dev проксируется через Vite: `/api/wb/card` → `https://card.wb.ru`)

Из ответа берём:

- `id`, `name`, `brand`
- `pics` — количество фото

Почему не `__internal/card/...` с wildberries.ru: endpoint закрыт/отдаёт 403 без полноценной сессии браузера; `card.wb.ru` отдаёт те же `products` и стабильнее для клиентского приложения. Vite proxy — только обход CORS в dev, бизнес-логики на сервере нет.

### 2. CDN route maps (корзины)

`GET https://cdn.wbbasket.ru/api/v3/upstreams`

Используем `origin.mediabasket_route_map` (фото) и `origin.videonme_route_map` (видео): диапазоны `vol` → host. Это актуальная замена хардкода basket-01…N.

### 3. URL фото

По [gist media helpers](https://gist.github.com/sheldhur/50420d0b85b2c80bc02cf96550b50625):

```
vol  = floor(nm / 1e5)
part = floor(nm / 1e3)
https://{host}/vol{vol}/part{part}/{nm}/images/{size}/{index}.webp
```

- превью в UI: `c246x328`
- скачивание: `big`

### 4. URL видео и скачивание (только клиент)

```
vol  = nm % 144
part = floor(nm / 1e4)
https://{host}/vol{vol}/part{part}/{nm}/hls/{quality}/index.m3u8
```

Качества пробуем по убыванию: **1440p → 1080p → 720p** (HEAD).  
Прямого progressive MP4 у CDN часто нет — только HLS (`.ts` сегменты).

Пайплайн в браузере:

1. читаем `index.m3u8`
2. параллельно качаем сегменты (ограниченная concurrency)
3. склеиваем MPEG-TS
4. remux в fMP4 через **mux.js** (клиент)
5. сохраняем как `.mp4` через file-saver

Перекодирования/remux на сервере **нет** — всё в приложении.

## Архитектура (FSD)

```
src/
  app/          # providers (Query, Ant Design), App
  pages/        # HomePage
  widgets/      # ArticleForm, MediaDownloadModal
  features/     # download-photos, download-video, select-photos
  entities/     # product (TanStack Query + media assembly)
  shared/       # api, config, lib (media URLs, zip helpers, remux)
```

Server state:

- `useProductMediaQuery` — `ensureQueryData` для upstreams + card, затем `buildProductMedia`
- mutations — zip фото / video remux + progress в UI

## Что бы доделали для продакшена

### Видео / клиент

- очередь и resume при обрыве сети;
- выбор качества пользователем;
- проверка codec (H.264/AAC) до сохранения;
- при очень тяжёлых роликах — стриминговая сборка вместо полного буфера в RAM;
- опционально (не обязательно): вынести remux в WebWorker / WASM-ffmpeg на клиенте.

### Инфра

- backend BFF только как CORS/rate-limit proxy к card API (не для remux);
- обход/обработка **x-pow** и anti-bot при ужесточении;
- e2e (Playwright) на эталонный артикул;
- Sentry + метрики ошибок скачивания;
- code-splitting Ant Design / mux.js.

### UX

- drag-select фото, превью full-size, оценка размера ZIP;
- история артикулов в `localStorage`.

## Ограничения

1. **CORS card API** — браузерный запрос к `card.wb.ru` без ACAO; в dev обязателен Vite proxy. В static hosting без proxy карточка не загрузится.
2. **Непубличное API** — контракт `cards/v4/detail` и route maps могут измениться без notice.
3. **Видео только HLS** — нет официального «скачать mp4»; remux client-side (mux.js), на части кодеков remux может упасть с ошибкой в UI.
4. **Видео не у всех карточек** — если playlist 404 на всех quality, кнопка «Скачать видео» disabled.
5. **Размер** — ZIP/видео собираются в памяти браузера; очень тяжёлые ролики могут упираться в RAM.
6. **PoW / anti-bot** — сейчас detail отвечает без challenge; при усилении защиты клиентского пути не хватит.

## Демо

Запись 20–40 сек: вставьте gif/mp4 в репозиторий (`docs/demo.gif`) после записи экрана с артикулом `604174866`.

## Скрипты исследования

```bash
node scripts/probe-media.mjs   # проверка URL фото/видео
```
