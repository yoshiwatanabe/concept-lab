import numpy as np
import matplotlib.pyplot as plt

OUT = "../../public/img/function-significant-terms"

x = np.linspace(-10, 10, 1000)

# --- Plot 1: effect of the dominant-term coefficient (small vs large) ---
coefficients = [0.1, 10]


def linear(x, a):
    return a * x


def quadratic(x, a):
    return a * x**2


def cubic(x, a):
    return a * x**3


def quartic(x, a):
    return a * x**4


functions = [linear, quadratic, cubic, quartic]
titles = [
    "Linear (degree 1)",
    "Quadratic (degree 2)",
    "Cubic (degree 3)",
    "Quartic (degree 4)",
]

fig, axes = plt.subplots(2, 2, figsize=(12, 8))
y_limits = (-50, 50)
for i, (func, title) in enumerate(zip(functions, titles)):
    ax = axes[i // 2, i % 2]
    for a in coefficients:
        y = func(x, a)
        ax.plot(x, y, label=f"a={a}")
    ax.axhline(0, color='gray', linestyle='--', linewidth=0.8)
    ax.axvline(0, color='gray', linestyle='--', linewidth=0.8)
    ax.set_title(title)
    ax.set_xlabel("x")
    ax.set_ylabel("f(x)")
    ax.legend()
    ax.set_ylim(y_limits)
plt.tight_layout()
plt.savefig(f"{OUT}/01-dominant-term-coefficient.png", dpi=130, bbox_inches="tight")
plt.close()

# --- Plot 2: effect of the second-most-dominant term ---
second_term_values = np.linspace(0.1, 5, 6)


def linear_with_second(x, a, b):
    return a * x + b


def quadratic_with_second(x, a, b):
    return a * x**2 + b * x


def cubic_with_second(x, a, b):
    return a * x**3 + b * x**2


def quartic_with_second(x, a, b):
    return a * x**4 + b * x**3


functions_with_second = [
    linear_with_second,
    quadratic_with_second,
    cubic_with_second,
    quartic_with_second,
]
titles_with_second = [
    "Linear with constant term",
    "Quadratic with linear term",
    "Cubic with quadratic term",
    "Quartic with cubic term",
]

fig, axes = plt.subplots(2, 2, figsize=(12, 8))
for i, (func, title) in enumerate(zip(functions_with_second, titles_with_second)):
    ax = axes[i // 2, i % 2]
    for b in second_term_values:
        y = func(x, 1, b)
        if func is linear_with_second:
            label = f"y = x + {b:.1f}"
        elif func is quadratic_with_second:
            label = f"y = x^2 + {b:.1f}x"
        elif func is cubic_with_second:
            label = f"y = x^3 + {b:.1f}x^2"
        else:
            label = f"y = x^4 + {b:.1f}x^3"
        ax.plot(x, y, label=label)
    ax.axhline(0, color='gray', linestyle='--', linewidth=0.8)
    ax.axvline(0, color='gray', linestyle='--', linewidth=0.8)
    ax.set_title(title)
    ax.set_xlabel("x")
    ax.set_ylabel("f(x)")
    ax.legend(fontsize=7)
plt.tight_layout()
plt.savefig(f"{OUT}/02-second-dominant-term.png", dpi=130, bbox_inches="tight")
plt.close()

print("done")
