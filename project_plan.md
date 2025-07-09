# PromptEval-Lite – Zero-Storage Prompt Tester & Enhancer  
*(FastAPI · LangChain · Gemini 2.5 Flash)*

PromptEval-Lite is a **stateless micro-service** that lets any LLM practitioner

1. **Test** a single prompt against 5-10 synthetic cases generated on-the-fly.
2. **Enhance** that prompt with best-practice instructions & few-shot examples.
3. (Optionally) **Re-test** the improved prompt and show the delta score.

Nothing is persisted: all data lives solely in memory for the lifetime of the
HTTP request.

---

## ✨ Features

| Action | What happens under the hood | Latency (≈) |
|--------|-----------------------------|-------------|
| **POST `/test`** | ① Gemini 2.5 Flash writes 5 synthetic `{input,expected}` pairs → ② The user prompt is run on each input → ③ Exact-Match (or GPT-Judge) scores are tallied. | 5-8 s |
| **POST `/enhance`** | Gemini rewrites the prompt (role, step-by-step, examples). If `auto_retest=true`, step 1 is repeated with the new prompt. | 3-10 s |

---

## Architecture
Client ─▶ FastAPI │/test│/enhance│
│ (in-memory only)
└───┬────────────┘
│ LangChain (Python)
▼
Gemini 2.5 Flash

* **FastAPI** serves two JSON endpoints.  
* **LangChain** wraps prompt templates, streaming and token accounting.  
* **Gemini 2.5 Flash** does all LLM heavy-lifting: dataset generation, inference
  and prompt optimisation.

---