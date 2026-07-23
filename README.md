# WB Media Downloader

## Какой подход к получению медиа выбрали и почему

### Карточка товара

Запрос к публичному detail-API `card.wb.ru`:

`GET /cards/v4/detail?nm={article}&…`

В dev/preview путь проксируется Vite: `/api/wb/card` → `https://card.wb.ru` (обход CORS). Из ответа берём `id`, `name`, `brand`, `pics`.

**Почему не** `wildberries.ru/__internal/card/...`: endpoint отдаёт 403 без полноценной сессии браузера. `card.wb.ru` даёт те же `products` и стабильнее для клиентского SPA. Proxy — только CORS, без бизнес-логики на сервере.

### CDN route maps

`GET https://cdn.wbbasket.ru/api/v3/upstreams` — `origin.mediabasket_route_map` (фото) и `origin.videonme_route_map` (видео), с fallback на `recommend.*`.

**Почему не хардкод basket-01…N:** хосты и диапазоны `vol` меняются; route map — актуальный источник маршрутизации.

### Фото

По [gist media helpers](https://gist.github.com/sheldhur/50420d0b85b2c80bc02cf96550b50625):

```
vol  = floor(nm / 1e5)
part = floor(nm / 1e3)
https://{host}/vol{vol}/part{part}/{nm}/images/{size}/{index}.webp
```

Превью: `c246x328`, скачивание: `big`. Выбранные URL собираются в ZIP (JSZip) на клиенте.

### Видео

```
vol  = nm % 144          // не floor(nm / 1e5), как у фото
part = floor(nm / 1e4)
https://{host}/vol{vol}/part{part}/{nm}/hls/{quality}/index.m3u8
```

Качества сверху вниз: **1440p → 1080p → 720p**. Проба: HEAD, при сбое — GET/Range только playlist.

Прямого progressive MP4 у CDN часто нет — только HLS (`.ts`). Пайплайн **только в браузере**:

1. читаем `index.m3u8`
2. качаем сегменты (ограниченная concurrency)
3. склеиваем MPEG-TS
4. remux в fMP4 через **mux.js**
5. сохраняем `.mp4` через file-saver

**Почему без серверного remux:** для клиентского тестового приложения достаточно; не нужен BFF/ffmpeg. Цена — память вкладки и ограничения mux.js по кодекам.

---

## Что бы доделали для продакшена (особенно по видео)

### Видео / клиент

- очередь и **resume** при обрыве сети (по сегментам);
- выбор качества пользователем (сейчас всегда best available);
- проверка codec (H.264/AAC) до сохранения;
- стриминговая сборка / backpressure вместо полного буфера TS+MP4 в RAM;
- remux в **WebWorker** или WASM-ffmpeg (не блокировать main thread);
- оценка размера и soft-limit по памяти.

### Инфра

- backend **BFF** как CORS/rate-limit proxy к card API (не обязательно для remux);
- обработка **x-pow** / anti-bot при ужесточении защиты;
- e2e (Playwright) на эталонный артикул;
- Sentry + метрики ошибок скачивания;
- code-splitting Ant Design / mux.js.

### UX

- drag-select фото, full-size превью, оценка размера ZIP;
- история артикулов в `localStorage`.

---

## Ограничения, с которыми столкнулись

1. **CORS card API** — без ACAO к `card.wb.ru` прямой браузерный запрос невозможен; в dev/preview нужен Vite proxy. На static hosting без proxy карточка не загрузится.
2. **Непубличное API** — контракт `cards/v4/detail` и route maps могут измениться без notice.
3. **Видео только HLS** — нет официального «скачать mp4»; remux client-side (mux.js), на части кодеков remux может упасть.
4. **Видео не у всех карточек** — если playlist недоступен на всех quality, скачивание видео недоступно.
5. **Память** — ZIP и видео собираются в RAM браузера; тяжёлые ролики упираются в лимит вкладки.
6. **PoW / anti-bot** — сейчас detail отвечает без challenge; при усилении защиты одного клиентского пути не хватит.
7. **`__internal` endpoint** — закрыт/403 без сессии, поэтому выбран `card.wb.ru`.
