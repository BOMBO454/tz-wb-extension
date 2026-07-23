# WB Media Downloader

React-приложение для скачивания фото и видео с карточки Wildberries по артикулу.

## Стек

- **React 19 + TypeScript (strict)**
- **Vite**
- **FSD** (Feature-Sliced Design)
- **TanStack Query** — server state (карточка, CDN route maps)
- **Ant Design** — UI-kit
- **Tailwind CSS v4** — layout/утилиты
- **JSZip + file-saver** — ZIP с фото
- **mux.js** — remux HLS (MPEG-TS) → MP4

## Запуск

```bash
npm install
npm run dev
```

Откройте http://localhost:5173, введите артикул (пример: `604174866`) → «Скачать фото».

```bash
npm run build   # production build
npm run preview # локальный preview (нужен proxy, см. ниже)
```

## Как устроено получение медиа

### 1. Карточка товара

Запрос к публичному detail-API:

`GET /cards/v4/detail?nm={article}&…`  
(в dev проксируется через Vite: `/api/wb/card` → `https://card.wb.ru`)

Из ответа берём:

- `id`, `name`, `brand`
- `pics` — количество фото

Почему не `__internal/card/...` с wildberries.ru: endpoint закрыт/отдаёт 403 без полноценной сессии браузера; `card.wb.ru` отдаёт те же `products` и стабильнее для клиентского приложения. Для продакшена всё равно нужен **свой backend-proxy** (CORS + возможный anti-bot).

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
- скачивание: `big` (максимальный доступный размер без watermark-логики)

### 4. URL видео

```
vol  = nm % 144
part = floor(nm / 1e4)
https://{host}/vol{vol}/part{part}/{nm}/hls/{quality}/index.m3u8
```

Качества пробуем по убыванию: **1440p → 1080p → 720p** (HEAD).  
Прямого progressive MP4 у CDN часто нет — только HLS (`.ts` сегменты).

Скачивание видео:

1. читаем `index.m3u8`
2. параллельно качаем сегменты (ограниченная concurrency)
3. склеиваем MPEG-TS
4. remux в fMP4 через **mux.js**
5. сохраняем как `.mp4`

## Архитектура (FSD)

```
src/
  app/          # providers (Query, Ant Design), App
  pages/        # HomePage
  widgets/      # ArticleForm, MediaDownloadModal
  features/     # download-photos, download-video, select-photos
  entities/     # product (+ TanStack Query)
  shared/       # api, config, lib (media URLs, zip, remux)
```

## Что бы доделали для продакшена

### Видео

- серверный remux через **ffmpeg** (стабильнее mux.js на edge-кейсах, audio/video sync, non-fMP4);
- очередь/прогресс-бар по сегментам и общий %;
- resume при обрыве сети;
- выбор качества пользователем;
- проверка codec (H.264/AAC) перед отдачей файла.

### Инфра

- backend BFF: прокси card API, rate limit, кэш карточек/upstreams;
- обход/обработка **x-pow** и прочих anti-bot заголовков WB при ужесточении;
- CORS только на свой origin;
- e2e (Playwright) на эталонный артикул с фото+видео;
- Sentry + метрики ошибок скачивания;
- code-splitting Ant Design / mux.js.

### UX

- drag-select фото, превью full-size, оценка размера ZIP до скачивания;
- история артикулов в `localStorage`.

## Ограничения

1. **CORS card API** — браузерный запрос к `card.wb.ru` без ACAO; в dev обязателен Vite proxy. В static hosting без backend карточка не загрузится.
2. **Непубличное API** — контракт `cards/v4/detail` и route maps могут измениться без notice.
3. **Видео только HLS** — нет официального «скачать mp4»; remux client-side, на части карточек/кодеков mux.js может отдать fallback (сырой TS в `.mp4`, играет VLC).
4. **Видео не у всех карточек** — если playlist 404 на всех quality, кнопка «Скачать видео» disabled.
5. **Размер** — ZIP/видео собираются в памяти браузера; очень тяжёлые ролики могут упираться в RAM.
6. **PoW / anti-bot** — сейчас detail отвечает без решения challenge; при усилении защиты клиентского пути не хватит.

## Демо

Запись 20–40 сек: вставьте gif/mp4 в репозиторий (`docs/demo.gif`) после записи экрана с артикулом `604174866`.

## Скрипты исследования

```bash
node scripts/probe-media.mjs   # проверка URL фото/видео
```
