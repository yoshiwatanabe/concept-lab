import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D  # noqa: F401

OUT = "../../public/img/ohms-law"

I_values = np.linspace(0, 10, 50)
R_values = np.linspace(1, 20, 50)
I_mesh, R_mesh = np.meshgrid(I_values, R_values)
V_mesh = I_mesh * R_mesh

# --- 1. Plain 3D surface ---
fig = plt.figure(figsize=(8, 6))
ax = fig.add_subplot(111, projection='3d')
ax.plot_surface(I_mesh, R_mesh, V_mesh, cmap='viridis')
ax.set_xlabel('I (A)')
ax.set_ylabel('R (Ohm)')
ax.set_zlabel('V (V)')
ax.set_title("Ohm's Law: V=I*R (3D Surface)")
plt.savefig(f"{OUT}/01-3d-surface.png", dpi=130, bbox_inches="tight")
plt.close()

# --- 2. Fixed I slices (I=2, I=8) ---
I_line_1, I_line_2 = 2, 8
R_line = np.linspace(1, 20, 50)
V_line_1 = I_line_1 * R_line
V_line_2 = I_line_2 * R_line
I_line_array_1 = np.full_like(R_line, I_line_1)
I_line_array_2 = np.full_like(R_line, I_line_2)

fig1 = plt.figure(figsize=(8, 6))
ax3d = fig1.add_subplot(111, projection='3d')
surf = ax3d.plot_surface(I_mesh, R_mesh, V_mesh, cmap='viridis', alpha=0.8)
fig1.colorbar(surf, ax=ax3d, shrink=0.6, aspect=10, label='Voltage (V)')
ax3d.plot(I_line_array_1, R_line, V_line_1, color='red', linewidth=2, label='I=2A')
ax3d.plot(I_line_array_2, R_line, V_line_2, color='magenta', linewidth=2, label='I=8A')
ax3d.set_xlabel('I (A)')
ax3d.set_ylabel('R (Ohm)')
ax3d.set_zlabel('V (V)')
ax3d.set_title("Ohm's Law: V=I*R (3D Surface + Slices)")
ax3d.legend()
plt.savefig(f"{OUT}/02a-3d-slices-fixed-I.png", dpi=130, bbox_inches="tight")
plt.close()

fig2, ax2d = plt.subplots(figsize=(7, 5))
ax2d.plot(R_line, V_line_1, color='red', label='I=2A')
ax2d.plot(R_line, V_line_2, color='magenta', label='I=8A')
ax2d.set_xlabel('R (Ohm)')
ax2d.set_ylabel('V (V)')
ax2d.set_title("Slices for I=2A and I=8A (2D View)")
ax2d.grid(True)
ax2d.legend()
plt.savefig(f"{OUT}/02b-2d-slices-fixed-I.png", dpi=130, bbox_inches="tight")
plt.close()

# --- 3. Fixed R slices (R=7.5, R=17.5) ---
R_line_1, R_line_2 = 7.5, 17.5
I_line = np.linspace(0, 10, 50)
V_line_1 = I_line * R_line_1
V_line_2 = I_line * R_line_2
R_line_array_1 = np.full_like(I_line, R_line_1)
R_line_array_2 = np.full_like(I_line, R_line_2)

fig1 = plt.figure(figsize=(8, 6))
ax3d = fig1.add_subplot(111, projection='3d')
surf = ax3d.plot_surface(I_mesh, R_mesh, V_mesh, cmap='viridis', alpha=0.8)
fig1.colorbar(surf, ax=ax3d, shrink=0.6, aspect=10, label='Voltage (V)')
ax3d.plot(I_line, R_line_array_1, V_line_1, color='red', linewidth=2, label='R=7.5Ohm')
ax3d.plot(I_line, R_line_array_2, V_line_2, color='magenta', linewidth=2, label='R=17.5Ohm')
ax3d.set_xlabel('I (A)')
ax3d.set_ylabel('R (Ohm)')
ax3d.set_zlabel('V (V)')
ax3d.set_title("Ohm's Law: V=I*R (3D Surface + Slices)")
ax3d.legend()
plt.savefig(f"{OUT}/03a-3d-slices-fixed-R.png", dpi=130, bbox_inches="tight")
plt.close()

fig2, ax2d = plt.subplots(figsize=(7, 5))
ax2d.plot(I_line, V_line_1, color='red', label='R=7.5Ohm')
ax2d.plot(I_line, V_line_2, color='magenta', label='R=17.5Ohm')
ax2d.set_xlabel('I (A)')
ax2d.set_ylabel('V (V)')
ax2d.set_title("Slices for R=7.5Ohm and R=17.5Ohm (2D View)")
ax2d.grid(True)
ax2d.legend()
plt.savefig(f"{OUT}/03b-2d-slices-fixed-R.png", dpi=130, bbox_inches="tight")
plt.close()

# --- 4. Constant-voltage lines V=25, V=125 ---
I_line_25 = np.linspace(1.25, 10, 100)
R_line_25 = 25 / I_line_25
V_line_25 = np.full_like(I_line_25, 25)

I_line_125 = np.linspace(6.25, 10, 100)
R_line_125 = 125 / I_line_125
V_line_125 = np.full_like(I_line_125, 125)

fig1 = plt.figure(figsize=(8, 6))
ax3d = fig1.add_subplot(111, projection='3d')
surf = ax3d.plot_surface(I_mesh, R_mesh, V_mesh, cmap='viridis', alpha=0.8)
cb = fig1.colorbar(surf, ax=ax3d, shrink=0.6, aspect=10)
cb.set_label('Voltage (V)')
ax3d.plot(I_line_25, R_line_25, V_line_25, color='red', linewidth=2, label='V=25')
ax3d.plot(I_line_125, R_line_125, V_line_125, color='magenta', linewidth=2, label='V=125')
ax3d.set_xlabel('I (A)')
ax3d.set_ylabel('R (Ohm)')
ax3d.set_zlabel('V (V)')
ax3d.set_title("Ohm's Law: V=I*R (3D Surface + constant V lines)")
ax3d.legend()
plt.savefig(f"{OUT}/04a-3d-constant-voltage.png", dpi=130, bbox_inches="tight")
plt.close()

fig2, ax2d = plt.subplots(figsize=(7, 5))
contour = ax2d.contourf(I_mesh, R_mesh, V_mesh, levels=20, cmap='viridis')
plt.colorbar(contour, ax=ax2d, label='Voltage (V)')
ax2d.plot(I_line_25, R_line_25, color='red', linewidth=2, label='V=25')
ax2d.plot(I_line_125, R_line_125, color='magenta', linewidth=2, label='V=125')
ax2d.set_xlabel('I (A)')
ax2d.set_ylabel('R (Ohm)')
ax2d.set_title("Constant Voltage lines (V=25, V=125) in I-R plane")
ax2d.legend()
ax2d.grid(True)
plt.savefig(f"{OUT}/04b-2d-constant-voltage-contour.png", dpi=130, bbox_inches="tight")
plt.close()

# --- 5. Hyperbola R = 25/I with example points ---
I_line = np.linspace(0.5, 10, 300)
V = 25
R_line = V / I_line
I_points = np.array([2, 5])
R_points = V / I_points

fig, ax = plt.subplots(figsize=(7, 5))
ax.plot(I_line, R_line, color='blue', label='R = 25 / I')
ax.plot(I_points, R_points, 'ro', label='(I, R) points')
for i, r in zip(I_points, R_points):
    ax.plot([i, i], [0, r], color='red', linestyle='--', alpha=0.7)
    ax.plot([0, i], [r, r], color='red', linestyle='--', alpha=0.7)
    ax.text(i + 0.2, r + 0.5, f"R={r:.1f}Ohm", color='red')
ax.set_xlim(0, 10.5)
ax.set_ylim(0, 20)
ax.set_xlabel("I (A)")
ax.set_ylabel("R (Ohm)")
ax.set_title("Ohm's Law at V=25: R = 25 / I")
ax.grid(True)
ax.legend()
plt.savefig(f"{OUT}/05-hyperbola-v25.png", dpi=130, bbox_inches="tight")
plt.close()

# --- 6. Extended range comparison V=25 vs V=125 ---
I_line_25 = np.linspace(0.36, 20, 300)
R_line_25 = 25 / I_line_25
I_line_125 = np.linspace(1.8, 20, 300)
R_line_125 = 125 / I_line_125

fig, ax = plt.subplots(figsize=(8, 6))
rect = plt.Rectangle((0, 0), 10, 20, color='gray', alpha=0.2)
ax.add_patch(rect)
ax.plot(I_line_25, R_line_25, color='red', label='V=25')
ax.plot(I_line_125, R_line_125, color='magenta', label='V=125')
ax.set_xlim(0, 20)
ax.set_ylim(0, 70)
ax.set_xlabel('I (A)')
ax.set_ylabel('R (Ohm)')
ax.set_title("Ohm's Law slices (V=25, V=125) with extended range")
ax.grid(True)
ax.legend()
plt.savefig(f"{OUT}/06-hyperbola-extended-range.png", dpi=130, bbox_inches="tight")
plt.close()

print("done")
