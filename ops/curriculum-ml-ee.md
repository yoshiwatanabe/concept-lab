# Curriculum expansion: LLM-centric ML + Electronics (2026-07-04)

Authored (not migrated) concepts. Pages ship with viz + intuition-first scaffolding and explicit
`TODO(あなたの言葉で)` blocks; user fills narrative after exploring → then status draft → polished.

## ML / LLM track
| status | concept-id | prereqs | viz |
|---|---|---|---|
| draft | ml/vectors-embeddings | vectors-and-matrices | 2D embedding playground, cosine similarity |
| draft | ml/gradient-descent (fill stub) | calculus-applications | loss-surface descent, learning-rate slider |
| draft | ml/linear-regression (fill stub) | least-squares-method, gradient-descent | live GD fit vs closed-form |
| draft | ml/softmax-temperature | exponential-logarithmic | logits→probability bars, temperature slider |
| draft | ml/attention-mechanism | softmax-temperature, vectors-embeddings | Q·K→softmax→ΣV heatmap + Manim flow |
| draft | ml/next-token-prediction | softmax-temperature, attention-mechanism | next-char probability bars, sampling |
| stub (user TODO) | ml/backpropagation | gradient-descent, activation-functions | — |
| stub (user TODO) | ml/transformer-architecture | attention-mechanism, next-token-prediction | — |
| stub (user TODO) | ml/fine-tuning-vs-rag | transformer-architecture | — |

## Electricity / electronics track
| status | concept-id | prereqs | viz |
|---|---|---|---|
| draft | electricity/resistors-series-parallel | ohms-law | interactive 2-resistor circuit, live I/V |
| draft | electricity/capacitors | ohms-law, eulers-number | RC charge/discharge curve, τ=RC |
| draft | electricity/diodes | ohms-law | I-V curve + half-wave rectification |
| stub (user TODO) | electricity/inductors | capacitors | — |
| stub (user TODO) | electricity/transistors | diodes | — |
