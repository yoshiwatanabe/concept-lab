import sympy as sp
import numpy as np
import matplotlib.pyplot as plt

OUT = "../../public/img/multiplication-division"
x = sp.symbols('x')
x_vals = np.linspace(-10, 10, 400)


def plot_family(coefficients, b, filename):
    plt.figure(figsize=(8, 8))
    for k in coefficients:
        linear_func = k * x + b
        linear_func_numeric = sp.lambdify(x, linear_func, 'numpy')
        y_vals = linear_func_numeric(x_vals)
        if np.isscalar(y_vals):
            y_vals = np.full_like(x_vals, y_vals)
        label = f'y = {k}x + {b}'
        plt.plot(x_vals, y_vals, label=label)
    plt.axis('equal')
    plt.xlim(-10, 10)
    plt.ylim(-10, 10)
    plt.axhline(0, color='black', linewidth=0.5)
    plt.axvline(0, color='black', linewidth=0.5)
    plt.xlabel('x')
    plt.ylabel('y')
    plt.grid(True)
    plt.legend()
    plt.savefig(f"{OUT}/{filename}", dpi=130, bbox_inches="tight")
    plt.close()


plot_family([0, 1, 3], 0, "01-multiplication.png")
plot_family([-3, -1, 1], 0, "02-negative-multiplication.png")
plot_family([-1, -0.5, 0.5, 1], 0, "03-division.png")
plot_family([-3, -1, -0.5, 0, 0.5, 1, 3], 0, "04-combined.png")
plot_family([-2, -1, 0.5, 1, 2], 2, "05-constant-term.png")

print("done")
