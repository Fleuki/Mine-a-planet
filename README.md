# Mine a Planet

Idle-игра про добычу руды: расставляй дронов вокруг планеты, продавай руду,
качай апгрейды, крути рулетку, сливай дубликаты в звёзды и открывай следующую
планету.

**Играть: https://fleuki.github.io/Mine-a-planet/**

Игра целится в Yandex Games (SDK, реклама, облачные сохранения), но полностью
работает и сама по себе — без SDK прогресс хранится в `localStorage`.

## Что внутри

Ванильный HTML/CSS/JS, один `<canvas>` и DOM-HUD поверх него. Никакого
фреймворка, никаких зависимостей, никакой сборки.

- 10 планет, 12 видов руды, 27 дронов в 8 редкостях
- 9 веток апгрейдов, слияние дронов и звёзды, космические события
- 24 достижения, ежедневные награды, оффлайн-доход
- вся графика рисуется процедурно на канвасе — PNG-ассеты опциональны

## Запуск локально

```bash
git clone https://github.com/Fleuki/Mine-a-planet.git
cd Mine-a-planet
python3 -m http.server 8123
# открой http://localhost:8123/
```

## Структура

```
index.html          разметка и порядок загрузки скриптов
src/css/            стили
src/js/             sdk, config, state, render, sprites, audio, ui, main …
tools/smoke.mjs     headless-проверка, что игра стартует
```

Подробности архитектуры, правила про порядок скриптов и конвенции —
в [CLAUDE.md](CLAUDE.md).

## Проверка

```bash
npm i -D playwright && npx playwright install chromium
python3 -m http.server 8123 &
node tools/smoke.mjs
```

## Деплой

Пуш в `main` → GitHub Actions собирает статику и публикует её на GitHub Pages
(`.github/workflows/deploy.yml`). Один раз нужно включить в настройках
репозитория **Settings → Pages → Source: GitHub Actions**.
