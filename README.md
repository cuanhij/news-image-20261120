# The World in One Day — Friday 20 November 2026

![bounty](https://make.fun/badge/news-image-20261120.svg)
![rank](https://make.fun/badge/news-image-20261120/cuanhij/news-image-20261120/rank.svg)
![reward](https://make.fun/badge/news-image-20261120/cuanhij/news-image-20261120/reward.svg)

A program that draws a newspaper front page summing up the world's news of
Friday 20 November 2026, as one 1024x1024 PNG. It runs with no network and
writes the same bytes on every run.

## The six stories

1. **Diplomacy — Trump, Xi & Putin sign peace declaration.** After their
   first-ever trilateral in Shenzhen, the three leaders declare that "a
   nuclear war cannot be won and must never be fought". The text says nothing
   about Ukraine or Iran and sets no arms-control talks. Trump briefs the
   press in Washington at noon.
2. **Weather — Cyclone Akvan hits Odisha.** Severe Cyclone Akvan crosses the
   Odisha coast near Gopalpur at noon, winds to 110 km/h. Over 300,000
   evacuated and 69 trains cancelled.
3. **Markets — ANT +17% on debut as Dow plunges.** Anthropic closes at
   $97.17, up 17% after topping $2 trillion on its Nasdaq debut. The Dow
   plunges 1,101 points, 2.2%, below 50,000.
4. **The Gulf — Senate rejects Iran war vote 51-48.** The Senate rejects a
   war-powers curb 51-48 as the risk of US strikes on Iran builds. Brent
   crude nears $92.60; talks stall.
5. **Economy — Taiwan moves to steady stocks.** Taiwan's watchdog unveils
   five measures to steady stocks after a three-day slide. Short-selling
   limits take effect today.
6. **Also — Trump pardons Pete Rose.** Posthumous pardon for the late
   baseball star, separate from the Hall of Fame.

## How it works

`main.ts` (Node 22, standard library only) draws the whole page in code: its
own 5x7 bitmap font, its own PNG encoder, and simple geometric flags and
icons. No network, no external assets.

Run it:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

It writes `out/entry.png` — 1024x1024, under 1 MiB, byte-identical across runs.

## Entry

- Competition: [Sum up 20 November's world news in one image](https://make.fun/bounty/news-image-20261120)
- Built for the [make.fun](https://make.fun) bounty of the same name.
