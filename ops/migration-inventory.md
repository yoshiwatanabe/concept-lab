# Migration inventory (V1 → concept-lab)

Source repo: C:\Users\tsuyo\Repos\python-test. Status: ☐ pending / ◐ pilot / ☑ migrated.
Prerequisite/related edges are orchestrator best-guesses; refined at review time.

## math
| ☐ | source notebook | concept-id | prerequisites |
|---|---|---|---|
| ☐ | math/symbols.ipynb | math-symbols | — |
| ☐ | math/addition_subtraction.ipynb | addition-subtraction | — |
| ☐ | math/multiplication_division.ipynb | multiplication-division | addition-subtraction |
| ☐ | math/polynomial_functions.ipynb | polynomial-functions | multiplication-division |
| ☐ | math/function-degrees.ipynb | function-degrees | polynomial-functions |
| ☐ | math/function-significant-terms.ipynb | function-significant-terms | function-degrees |
| ☑ | math/trigonometric_functions.ipynb | trigonometric-functions | polynomial-functions |
| ☐ | math/exponential_logrithmic.ipynb | exponential-logarithmic | polynomial-functions |
| ☐ | math/eulers_number.ipynb | eulers-number | exponential-logarithmic |
| ☐ | math/logistic_function.ipynb | logistic-function | eulers-number |
| ☐ | math/logit_function.ipynb | logit-function | exponential-logarithmic |
| ☐ | math/logistic_and_logit_functions.ipynb | logistic-and-logit | logistic-function, logit-function |
| ☑ | math/calculus_differentiation_integration.ipynb | calculus-differentiation-integration | function-degrees, trigonometric-functions? |
| ☐ | math/calculus_applications.ipynb | calculus-applications | calculus-differentiation-integration |

## stats
| ☐ | source notebook | concept-id | prerequisites |
|---|---|---|---|
| ☐ | stats/dataset.ipynb | datasets | — |
| ☐ | stats/average_and_proportion.ipynb | average-and-proportion | datasets |
| ☐ | stats/standard_deviation.ipynb | standard-deviation | average-and-proportion |
| ☐ | stats/bernoulli_distribution.ipynb | bernoulli-distribution | average-and-proportion |
| ☐ | stats/central_limit_theorem.ipynb | central-limit-theorem | standard-deviation |
| ☐ | stats/standard_error.ipynb | standard-error | central-limit-theorem |
| ☐ | stats/least_squires_method.ipynb | least-squares-method | standard-deviation |
| ☐ | stats/null_hypothesis.ipynb | null-hypothesis | standard-error |
| ☐ | stats/statistical_hypotheis_test.ipynb | hypothesis-testing | null-hypothesis |
| ☑ | stats/statistical_significance.ipynb | statistical-significance | hypothesis-testing |
| ☐ | stats/alpha_error_beta_error.ipynb | alpha-beta-errors | statistical-significance |
| ☐ | stats/statistical_power.ipynb | statistical-power | alpha-beta-errors |
| ☐ | stats/z-test.ipynb | z-test | hypothesis-testing, standard-error |
| ☐ | stats/students_t_test.ipynb | t-test | z-test |
| ☐ | stats/chi_squared_distribution.ipynb | chi-squared-distribution | hypothesis-testing |

## ml / electricity / language / plotting
| ☐ | source notebook | concept-id | prerequisites |
|---|---|---|---|
| ☐ | ml/activation_functions.ipynb | activation-functions | logistic-function |
| ☐ | electricity/ohms_law.ipynb | ohms-law | — |
| ☐ | language/compare_csharp/*.ipynb | (defer — reference material, may stay lab-only) | — |
| ☐ | plotting/basic_plot.ipynb | (lab-only; tooling note, not a concept) | — |

## Seeded "what's next" stubs (Phase 4)
math: taylor-series (← calculus-differentiation-integration), fourier-series (← trigonometric-functions, taylor-series), definite-integral-applications, vectors-and-matrices
stats: confidence-intervals (← standard-error), bayes-theorem (← bernoulli-distribution), p-value-pitfalls (← statistical-significance), anova (← t-test)
ml: gradient-descent (← calculus-applications), linear-regression (← least-squares-method), backpropagation (← gradient-descent, activation-functions)
physics: kinematics-v-t-graph (← calculus-differentiation-integration) — episode 2026-06-28 material
