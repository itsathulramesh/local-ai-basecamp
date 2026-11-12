# Local AI Basecamp

A free, plain-English course that takes you from "I only use ChatGPT" to running, understanding, training and customising open-weight AI models on your own Windows PC with an NVIDIA graphics card.

**52 lessons in 11 modules, an 8-week plan, interactive calculators, working Python scripts and a quiz in every lesson.** It is a plain static website (HTML, CSS and JavaScript, no framework), so it runs anywhere: GitHub Pages, any web host, or straight from your disk.

## What you will learn

| Module | Topic |
|---|---|
| 1 | AI in plain English: models, tokens, context, cloud vs local |
| 2 | Your PC: GPU, VRAM, drivers, Python, what your hardware can run |
| 3 | Model files and memory math: quantization, GGUF, VRAM + RAM calculator, speed |
| 4 | Run your first models: LM Studio, Ollama, Hugging Face, settings, troubleshooting |
| 5 | Aligned vs uncensored models: alignment, abliteration, safe use |
| 6 | Use it for real: prompting, the local API, RAG, structured output and tool calling |
| 7 | How models really work: gradient descent, the transformer, chat templates, generation |
| 8 | Customize without training: the customization ladder, Modelfiles, adapters |
| 9 | Fine-tune your own model: LoRA, datasets, Unsloth, evaluation, GGUF export, DPO |
| 10 | Uncensor and edit models: steering, direction ablation and abliteration, merging |
| 11 | Capstone: build your own custom model end to end |

Four milestones keep the path finishable: running a model locally (week 2), using it from Python with RAG and tools (week 4), your first fine-tune (week 7), and your own customised model (week 8). Lessons marked *Optional* can be skipped on a first pass.

## Run it locally

Open `index.html` in your browser. That's it.

If your browser blocks anything when opening files directly, serve the folder instead:

```bash
python -m http.server 8000
# then open http://localhost:8000
```

## Publish on GitHub Pages

1. Create a new repository on GitHub, for example `local-ai-basecamp`.
2. Upload the contents of this folder (so `index.html` is at the top level of the repository). With Git:
   ```bash
   git init
   git add .
   git commit -m "Local AI Basecamp"
   git branch -M main
   git remote add origin https://github.com/YOUR-USER/local-ai-basecamp.git
   git push -u origin main
   ```
   Or use **Add file → Upload files** on github.com and drag everything in.
3. In the repository, go to **Settings → Pages**. Under **Build and deployment**, choose **Deploy from a branch**, branch `main`, folder `/ (root)`, and save.
4. After a minute the site is live at `https://YOUR-USER.github.io/local-ai-basecamp/`.

The empty `.nojekyll` file tells GitHub Pages to serve the files as they are. Netlify, Vercel or Cloudflare Pages also work: deploy the folder with no build command and the folder itself as the output directory.

## Project structure

```text
index.html               start page (generated)
lessons/                 one page per lesson (generated)
404.html                 page-not-found page (generated)
assets/css/style.css     all styles, light and dark theme
assets/js/app.js         navigation, progress, quizzes, search, copy buttons
assets/js/widgets.js     calculators, demos and glossary data
assets/js/course-data.js lesson list and search index (generated)
assets/favicon.svg
content/                 the lesson sources: edit these
content/modules.json     module names and descriptions
tools/build.py           regenerates the pages from content/
```

## Editing lessons

Lessons live in `content/`, one HTML file each. The first line is a small JSON header:

```html
<!-- {"id": "what-is-ai", "module": "1", "title": "What AI, machine learning and LLMs actually are", "minutes": 10, "optional": false} -->
<p class="lede">The first paragraph…</p>
```

- The file name prefix (`02-`, `03-`…) sets the order.
- Link to another lesson with `href="#lesson-id"`. The build turns it into a real page link.
- Useful building blocks: `<div class="box concept">`, `tip`, `warn`, `danger`, `win` callouts; `<div class="widget" data-widget="fit">` for calculators; quizzes as `<div class="q" data-correct="2">` with an `<ol>` of answers and a `<p class="why">` explanation; checklists as `<label class="ck"><input type="checkbox" data-k="unique-key">…</label>`.

After editing, rebuild (Python 3, standard library only):

```bash
python tools/build.py
```

Then commit the changed files. GitHub Pages serves the generated pages directly, so no build runs on the server.

## Progress and privacy

Lesson progress, checklists and the theme choice are stored in your browser (localStorage). Nothing is sent anywhere. The only external request is for the Google Fonts stylesheet; the site falls back to system fonts without it.

## Responsible use

Modules 5 and 10 explain how uncensored and abliterated models are made and how to build your own. Removing a model's refusals moves all judgement to you. Laws apply to what you create and do with the output. Keep unrestricted models local, and never use any model to harm people.

## Credits

Parts of this course, especially the material on how models work, fine-tuning and weight editing, are adapted from Sethu's [Local AI Lab](https://whxitte.github.io/ai-mastery/) and rewritten for Windows and NVIDIA GPUs. Facts and figures are cited in the Resources lesson. Model names, versions and tools reflect November 2026.

## Licence

No licence has been chosen yet. Add a `LICENSE` file before inviting contributions. Because parts are adapted from another course, check with its author before relicensing that material.
