# richardbt.com

Personal portfolio site built with [Astro](https://astro.build/).

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:4321](http://localhost:4321) in your browser.

## Commands

| Command           | Action                              |
| :---------------- | :---------------------------------- |
| `npm run dev`     | Start dev server at localhost:4321  |
| `npm run build`   | Build static site to `./dist/`      |
| `npm run preview` | Preview production build locally    |

## Project Structure

```
src/
  content/projects/   # Project write-ups (MDX + images)
  components/         # Astro components
  layouts/            # Page layouts
  pages/              # Routes
public/               # Static assets (bio, resume, etc.)
```

Interactive demos (3D viewers, simulations, generators) can be added later as React islands via `@astrojs/react`.

## Deploy

Deploy the `dist/` folder to [Vercel](https://vercel.com/) or any static host.
