# Промпты для генерации ассетов (Nano Banana Pro / `gemini-3-pro-image`)

Промпты привязаны к реальным данным из `src/js/config.js` — имена, редкости и
HEX-цвета взяты оттуда. Если правишь баланс и цвета, правь и здесь.

---

## 0. Технические требования (из кода, не из головы)

Это не пожелания, а то, как движок реально рисует картинки.

| Ассет | Куда идёт | Что требует код |
|---|---|---|
| Спрайт дрона | `DRONE_ART[id]` → `drawDroneArt()` (`render.js:581`) | **Прозрачный фон обязателен.** Рисуется поверх планеты, высота `R*3`, ширина по пропорции картинки. Референсная пропорция — **4:5** (как у существующего `celestia`, 256×320) |
| Полоса планеты | `_drawStrip()` через `this.surface` | **2.2:1, бесшовная по горизонтали.** Прокручивается циклически — стык слева/справа виден сразу |
| Лицо планеты | `PLANET_ART[tier]` (`render.js:204`) | 1:1, обрезается в круг. ⚠️ **Отключает вращение и облака** — см. предупреждение ниже |
| Иконка руды | `drawOreGem()` | Прозрачный фон, 1:1, мелкий размер |

> ⚠️ **Про `PLANET_ART`.** В `render.js:204` ветка `if (custom)` пропускает
> `_drawStrip` и слой облаков. Подставишь картинку планеты — планета
> **перестанет вращаться**. Поэтому для планет генерируй **полосу-развёртку**,
> а не круглое лицо. Под полосу нужна маленькая правка в `render.js`
> (скормить `Image` вместо офскрин-канваса в `this.surface`) — скажи, сделаю.

---

## 1. Базовый стилевой блок

Вставляй **в каждый** промпт. Он держит все 27 дронов в одном стиле — это
главная проблема генерации сетов, а не качество отдельной картинки.

```
STYLE: flat vector game art, clean bold shapes, soft cel shading with two tone
steps, thin bright rim light, subtle inner glow on emissive parts. Mobile game
UI sprite quality. Crisp readable silhouette that survives being scaled down to
64 pixels. No gradients banding, no photorealism, no 3D render, no clay, no
pixel art, no outline sketch, no watercolor.
```

## 2. Блок прозрачности

```
BACKGROUND: fully transparent alpha channel. Subject only, cut out like a
sticker. No ground plane, no cast shadow, no drop shadow, no scene, no frame,
no border, no card, no background color, no checkerboard pattern, no text,
no watermark, no signature.
```

**План Б, если альфы не будет.** Модели часто отдают непрозрачный фон, что бы
ты ни просил. Тогда замени блок выше на:

```
BACKGROUND: perfectly flat uniform solid magenta #FF00FF, no gradient, no
texture, no shading on the background. The subject must not contain any magenta
or pink hue anywhere.
```

и скажи мне — напишу скрипт хромакея в `tools/`, который вырежет фон и положит
PNG с альфой прямо в `assets/drones/`.

⚠️ Оговорка про магенту: у редкостей **mythic** (`#fb7185`) и **ancient**
(`#ff8a3d`) цвета розово-оранжевые. Для них бери зелёный хромакей `#00FF00`.

---

## 3. Дроны — шаблон

```
Game asset sprite of a mining robot drone named "{NAME}".

SUBJECT: {DESCRIPTOR}
Front view, orthographic, perfectly centered, full body, vertical composition:
chassis on top, drill pointing straight down at the bottom. Aspect ratio 4:5.

COLOR: primary accent {RARITY_HEX} with emissive glow {GLOW_HEX}. Chassis in
desaturated space-grey metal. The accent color must appear on the eye visor,
the rim light and the drill highlights so the rarity reads at a glance.

{STYLE BLOCK}
{BACKGROUND BLOCK}
```

### Дескрипторы по всем 27 дронам

Тир редкости задаёт не только цвет, но и «сложность» силуэта: от одного
ржавого бура до многосоставной небесной конструкции.

**Common — `#9fb3c8` / glow `#c4d3e0`** — мусорное железо, заклёпки, вмятины, одна лампа

| id | Имя | DESCRIPTOR |
|---|---|---|
| `scout` | Скаут | tiny boxy scout bot, single round lens eye, stubby short drill, two small side thrusters, dented plating |
| `pebble` | Галечник | squat pebble-shaped bot with a rounded river-stone hull, wide flat chisel bit, chunky rubber feet |
| `rustbit` | Ржавый Бит | heavily rusted scrap bot, mismatched welded plates, exposed rivets, crooked worn drill bit, one flickering lamp |
| `chipper` | Чиппер | small chipper bot with a wide jaw of blunt teeth, short vibrating chisel, dusty scratched hull |

**Uncommon — `#4ade80` / glow `#86efac`** — аккуратнее, парные детали, зелёные индикаторы

| id | Имя | DESCRIPTOR |
|---|---|---|
| `twin` | Твин-Авгер | twin parallel auger screws side by side, symmetrical shoulder pods, green status lights |
| `copperjaw` | Медный Клык | copper-plated bot with a heavy hinged jaw clamp, brass trim, single fang-like drill tooth |
| `buzz` | Баззсоу | compact bot with a large circular saw blade instead of a drill, guard housing, spinning motion blur hint |
| `sander` | Шлифовщик | wide flat grinding drum on the underside, dust vents along the hull, protective side skirts |

**Rare — `#38bdf8` / glow `#7dd3fc`** — техника, панели, голубое свечение

| id | Имя | DESCRIPTOR |
|---|---|---|
| `quad` | Квад-Дрилл | four small drills arranged in a square cluster, geometric panelled chassis, cyan seams |
| `ionlance` | Ион-Ланс | slender bot with a long ionised lance instead of a drill, glowing energy tip, ring emitter collar |
| `ripper` | Риппер | aggressive bot with three curved ripper claws, angular armour, sharp cyan edge lighting |
| `corebit` | Кор-Бит | hollow cylindrical core-sampling bit, tube housing, sample canister on the back |

**Epic — `#c084fc` / glow `#e9d5ff`** — энергия, парящие элементы, фиолетовое свечение

| id | Имя | DESCRIPTOR |
|---|---|---|
| `magma` | Магма-Бур | drill glowing molten hot, heat vents leaking light, blackened heat-shield plating |
| `plasmator` | Плазматор | plasma containment sphere in the chest, arcing electricity, magnetic coil rings |
| `hexa` | Гекса-Корер | hexagonal chassis, six-sided drill shaft, honeycomb panel detailing, floating hex plates |
| `voidsaw` | Войд-Пила | dark bot with a saw blade of pure void energy, edges dissolving into particles |

**Legendary — `#fbbf24` / glow `#fde68a`** — золото, корона, парящие кольца

| id | Имя | DESCRIPTOR |
|---|---|---|
| `nova` | Нова-Авгер | radiant auger wrapped in a spiral of golden light, burst flare at the tip, floating orbital ring |
| `singular` | Сингулярность | a tiny black singularity held in a golden containment cage, matter spiralling inward |
| `titan` | Титан-Бур | massive heavy-armoured titan drill, thick gold-trimmed pauldrons, industrial pistons |
| `eclipse` | Эклипс | dark disc eclipsing a golden corona behind it, crescent light rim, elegant thin frame |

**Mythic — `#fb7185` / glow `#fecdd3`** — органика + машина, тревожная красота

| id | Имя | DESCRIPTOR |
|---|---|---|
| `quantum` | Квант-Жнец | reaper silhouette with a scythe-drill, body phasing into duplicated after-images |
| `devourer` | Пожиратель | maw-like intake ringed with teeth, ore being sucked in, ribbed organic-metal hull |
| `omega` | Омега-Корер | omega-shaped horseshoe frame, central beam corer, floating detached arc segments |

**Ancient — `#ff8a3d` / glow `#ffd0a0`** — камень, руны, парящие обломки

| id | Имя | DESCRIPTOR |
|---|---|---|
| `progenitor` | Прародитель | ancient stone-and-bronze construct, glowing carved runes, weathered ceremonial plating |
| `monolith` | Монолит | floating black monolith slab with a burning glyph seam down its face, no visible limbs |

**Celestial — `#7df9ff` / glow `#e2ffff`** — свет, короны, кристалл

| id | Имя | DESCRIPTOR |
|---|---|---|
| `starforge` | Звёздный Горн | forge-anvil chassis containing a captive star, sparks of starlight, radiant halo |
| `celestia` | Селестия | serene angelic drone with a crystalline crown of three spires, twin glowing eyes behind a dark visor, luminous halo ring, elegant tapered drill *(уже есть как SVG — эталон стиля)* |

> 💡 **Приём для консистентности.** Генерируй **весь тир одной картинкой**:
> сетка 2×2, четыре дрона в ряд на общем прозрачном фоне. Модель держит единый
> стиль внутри одного изображения гораздо лучше, чем между четырьмя отдельными
> запросами. Потом нарежешь. И дешевле — 8 картинок вместо 27.
>
> Добавь в промпт: `Four distinct drones arranged in a 2x2 grid, evenly spaced,
> identical art style, identical lighting, identical scale, generous even
> padding between them.`

---

## 4. Планеты — полоса-развёртка (рекомендуется)

```
Seamless horizontally tileable equirectangular planet surface texture map.
Aspect ratio 2.2:1.

PLANET: "{NAME}" — {DESCRIPTOR}
COLOR: deep base {CORE}, landmass {LAND}, highlight accent {ACCENT}.

Top-down orbital view of terrain, flat stylised game-map look, soft cel shading,
gentle terrain variation, no harsh contrast. The left and right edges MUST match
seamlessly for looping. No planet sphere, no globe, no curvature, no horizon,
no stars, no atmosphere, no clouds, no lighting hotspot, no vignette, no text.
```

| # | Планета | core / land / accent | DESCRIPTOR |
|---|---|---|---|
| 0 | Пустошь | `#5b6472` `#7c8797` `#9aa6b6` | barren grey rock, dust plains, shallow craters |
| 1 | Рудник | `#6b5644` `#8a6f52` `#b98c5a` | strip-mined ochre earth, terraced quarry steps, ore veins |
| 2 | Тундра | `#3f5b63` `#5b8894` `#8fd0d8` | frozen teal tundra, cracked ice sheets, frost ridges |
| 3 | Джунгли | `#2f5233` `#3f7a45` `#6fce68` | dense jungle canopy, winding rivers, bright green clearings |
| 4 | Лазурит | `#243a6b` `#3556a8` `#5f8fff` | deep blue lapis oceans, cobalt mineral islands |
| 5 | Магма | `#5b1e1e` `#a83535` `#ff6b3d` | cracked volcanic crust, glowing lava rivers, ash fields |
| 6 | Кристалл | `#4a2f6b` `#7b4fb0` `#c98fff` | violet crystal spires, geode fields, faceted plains |
| 7 | Пепел | `#2b2b30` `#4a4a52` `#8a8a96` | grey ash dunes, burnt-out craters, dead soot plains |
| 8 | Неон | `#0f3b3b` `#0f8a7a` `#2affd5` | bioluminescent teal flora, glowing neon rivers, dark canopy |
| 9 | Пустота | `#1a0f2e` `#3d1f6b` `#a855f7` | void-torn terrain, reality fractures, purple energy rifts |

**Проверка бесшовности:** открой картинку рядом с её же копией — стык не должен
читаться. Если шов виден, добавь в промпт `The rightmost column of pixels must
continue directly into the leftmost column.` и перегенерируй.

---

## 5. Руда — иконки

```
Game icon of a single mineral ore gem: "{NAME}".
{DESCRIPTOR}, faceted crystal, floating, three-quarter view, centered, 1:1.
COLOR: body {COLOR}, bright facet highlights {SHINE}, inner glow.
{STYLE BLOCK}
{BACKGROUND BLOCK}
```

| id | Имя | color / shine | DESCRIPTOR |
|---|---|---|---|
| `dust` | Пыль | `#8a8f9c` `#c3c8d4` | a small heap of fine grey dust with a few coarse grains |
| `copper` | Медь | `#d98a4b` `#f4b184` | raw copper nugget, rough orange-brown metal |
| `iron` | Железо | `#a7b0bd` `#dfe6ef` | rough iron ore chunk, dull metallic grey |
| `silver` | Серебро | `#c8d4e0` `#ffffff` | polished silver ingot shard, mirror highlights |
| `gold` | Золото | `#f4c542` `#fff3b0` | gold nugget, warm yellow metal, soft shine |
| `amethyst` | Аметист | `#a855f7` `#e9d5ff` | purple amethyst crystal cluster, sharp points |
| `emerald` | Изумруд | `#22c55e` `#bbf7d0` | emerald green gem, rectangular step cut |
| `sapphire` | Сапфир | `#3b82f6` `#bfdbfe` | deep blue sapphire, brilliant round cut |
| `ruby` | Рубин | `#ef4444` `#fecaca` | blood red ruby, sharp facets, inner fire |
| `diamond` | Алмаз | `#67e8f9` `#ffffff` | clear brilliant diamond, prismatic sparkle |
| `plasma` | Плазма | `#e879f9` `#fbcfe8` | contained magenta plasma orb, swirling energy |
| `voidstone` | Пустокамень | `#7c3aed` `#c4b5fd` | dark violet void crystal, absorbing light, faint rift |

---

## 6. Промо-арт для Яндекс Игр

Вот здесь растр выигрывает безоговорочно — векторить обложку смысла нет.

```
Key art for a mobile idle mining game called "Mine a Planet".
A cute chunky robot drone with a glowing cyan visor drilling into a colourful
stylised planet, ore gems and coins flying out of the impact point, deep space
background with a purple-violet nebula and scattered stars.
Vibrant saturated palette: violet #7c5cff, gold #ffd54a, cyan #38bdf8 on a very
dark #08060f background. Playful polished mobile game art, dynamic diagonal
composition, strong focal point, bright rim lighting.
No text, no logo, no UI elements, no watermark, no border.
```

Форматы под портал: `1:1` (иконка), `16:9` (обложка), `9:16` (баннер).

---

## 7. Чек-лист приёмки

Прогоняй каждую картинку прежде, чем класть в `assets/`:

1. **Альфа реальна?** Открой на тёмном и на светлом фоне. Белый ореол по краю =
   фон был запечён, нужен хромакей.
2. **Читается в 64px?** Уменьши. Дрон рисуется мелким поверх планеты — если
   силуэт превратился в кашу, промпт нужно упрощать, а не детализировать.
3. **Цвет редкости на месте?** Игрок различает тиры по цвету. Если акцент
   потерялся — верни его явным указанием на визор и кромку.
4. **Тир согласован?** Разложи четырёх дронов одного тира рядом. Если видно, что
   рисовали в разные заходы — перегенерируй сеткой 2×2.
5. **Вес.** Прогоняй через `pngquant` или `oxipng`. 27 ретиновых PNG — заметная
   прибавка к весу сборки, а на Яндекс Играх время загрузки считают.

## 8. Как подключить результат

```js
// src/js/config.js
var DRONE_ART = {
  celestia: "data:image/svg+xml;base64,…",   // существующий
  rustbit:  "assets/drones/rustbit.png",     // новый
};
```

Всё остальное уже работает: `preloadArt()` в `main.js:151` подхватит,
`getArt()` закэширует, `drawDroneArt()` отрисует. Чего нет в списке — рисуется
процедурно, как и раньше.
