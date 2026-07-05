import numpy as np
import matplotlib.pyplot as plt

OUT = "../../public/img/addition-subtraction"

k = 1
x_vals = np.linspace(-10, 10, 400)

# Addition plot
constants = [0, 3, 5]
plt.figure(figsize=(8, 6))
for b in constants:
    y_vals = k * x_vals + b
    label = f'y = {k}x + {b}'
    plt.plot(x_vals, y_vals, label=label)
plt.xlabel('x')
plt.ylabel('y')
plt.grid(True)
plt.legend()
plt.savefig(f"{OUT}/01-addition.png", dpi=130, bbox_inches="tight")
plt.close()

# Subtraction plot
constants = [-5, -3, 0]
plt.figure(figsize=(8, 6))
for b in constants:
    y_vals = k * x_vals + b
    label = f'y = {k}x + {b}'
    plt.plot(x_vals, y_vals, label=label)
plt.xlabel('x')
plt.ylabel('y')
plt.grid(True)
plt.legend()
plt.savefig(f"{OUT}/02-subtraction.png", dpi=130, bbox_inches="tight")
plt.close()

print("done")
