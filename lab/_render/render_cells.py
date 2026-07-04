import numpy as np
import matplotlib.pyplot as plt
import os

OUT = os.path.join(os.path.dirname(__file__))

# ---------- shared setup ----------
t = np.linspace(0, 10, 1000)
dt = t[1] - t[0]
a_const = 2

def position(t):
    return 0.5 * a_const * t**2

def differentiate(f, t):
    return np.gradient(f, t)

def integrate(f, t, initial=0):
    dt = t[1] - t[0]
    return np.cumsum(f) * dt + initial

def draw_tangent(ax, x, y, x_point):
    idx = (np.abs(x - x_point)).argmin()
    x0 = x[idx]
    y0 = y[idx]
    slope = differentiate(y, x)[idx]
    x_tangent = np.linspace(x0 - 1, x0 + 1, 100)
    y_tangent = slope * (x_tangent - x0) + y0
    ax.plot(x_tangent, y_tangent, 'r--', label=f'Tangent at t={x0:.1f}s')
    return slope

s = position(t)
v = differentiate(s, t)
a = differentiate(v, t)
v_int = integrate(a, t, initial=0)
s_int = integrate(v_int, t, initial=0)

# ================= Cell 1 =================
plt.figure(figsize=(12, 8))

plt.subplot(3, 1, 1)
plt.plot(t, s, label='Position (from differentiation)')
plt.plot(t, s_int, '--', label='Position (from integration)')
plt.title('Position vs Time')
plt.xlabel('Time [s]')
plt.ylabel('Position [m]')
plt.legend()

plt.subplot(3, 1, 2)
plt.plot(t, v, label='Velocity (from differentiation)')
plt.plot(t, v_int, '--', label='Velocity (from integration)')
plt.title('Velocity vs Time')
plt.xlabel('Time [s]')
plt.ylabel('Velocity [m/s]')
plt.legend()

plt.subplot(3, 1, 3)
plt.plot(t, a, label='Acceleration (from differentiation)')
plt.plot(t, [a_const]*len(t), '--', label='Acceleration (constant)')
plt.title('Acceleration vs Time')
plt.xlabel('Time [s]')
plt.ylabel('Acceleration [m/s^2]')
plt.legend()

plt.tight_layout()
plt.savefig(os.path.join(OUT, 'cell1-three-stack.png'), dpi=130)
plt.close()

# ================= Cell 5 =================
fig, axes = plt.subplots(3, 1, figsize=(12, 12))

ax = axes[0]
ax.plot(t, s, label='Position')
slope_s = draw_tangent(ax, t, s, 2)
slope_s = draw_tangent(ax, t, s, 5)
slope_s = draw_tangent(ax, t, s, 8)
ax.set_title('Position vs Time')
ax.set_xlabel('Time [s]')
ax.set_ylabel('Position [m]')
ax.legend()
ax.text(0.1, 0.9, f'Slope (Velocity) at t=5s: {slope_s:.2f} m/s', transform=ax.transAxes)

ax = axes[1]
ax.plot(t, v, label='Velocity')
slope_v = draw_tangent(ax, t, v, 2)
slope_v = draw_tangent(ax, t, v, 5)
slope_v = draw_tangent(ax, t, v, 8)
ax.set_title('Velocity vs Time')
ax.set_xlabel('Time [s]')
ax.set_ylabel('Velocity [m/s]')
ax.legend()
ax.text(0.1, 0.9, f'Slope (Acceleration) at t=5s: {slope_v:.2f} m/s²', transform=ax.transAxes)

ax = axes[2]
ax.plot(t, a, label='Acceleration')
slope_a = draw_tangent(ax, t, a, 2)
slope_a = draw_tangent(ax, t, a, 5)
slope_a = draw_tangent(ax, t, a, 8)
ax.set_title('Acceleration vs Time')
ax.set_xlabel('Time [s]')
ax.set_ylabel('Acceleration [m/s²]')
ax.legend()
ax.text(0.1, 0.9, f'Slope at t=5s: {slope_a:.2e}', transform=ax.transAxes)

plt.tight_layout()
plt.savefig(os.path.join(OUT, 'cell5-tangent-lines.png'), dpi=130)
plt.close()

# ================= Cell 8 =================
fig, axes = plt.subplots(3, 1, figsize=(12, 12))

t_start = 2
t_end = 6
mask = (t >= t_start) & (t <= t_end)

ax = axes[2]
ax.plot(t, a, label='Acceleration')
ax.fill_between(t[mask], 0, a[mask], color='orange', alpha=0.3, label='Area = Δv')
ax.set_title('Acceleration vs Time')
ax.set_xlabel('Time [s]')
ax.set_ylabel('Acceleration [m/s²]')
ax.legend()
delta_v = np.trapezoid(a[mask], t[mask])
ax.text(0.5, 0.8, f'Δv = {delta_v:.2f} m/s', transform=ax.transAxes)

ax = axes[1]
ax.plot(t, v, label='Velocity')
ax.fill_between(t[mask], 0, v[mask], color='green', alpha=0.3, label='Area = Δs')
ax.set_title('Velocity vs Time')
ax.set_xlabel('Time [s]')
ax.set_ylabel('Velocity [m/s]')
ax.legend()
delta_s = np.trapezoid(v[mask], t[mask])
ax.text(0.5, 0.8, f'Δs = {delta_s:.2f} m', transform=ax.transAxes)

ax = axes[0]
ax.plot(t, s, label='Position')
idx_start = np.argmin(np.abs(t - t_start))
idx_end = np.argmin(np.abs(t - t_end))
s_start = s[idx_start]
s_end = s[idx_end]
ax.vlines([t_start, t_end], s.min(), s.max(), colors='gray', linestyles='dashed')
ax.hlines([s_start, s_end], t.min(), t.max(), colors='gray', linestyles='dashed')
ax.set_title('Position vs Time')
ax.set_xlabel('Time [s]')
ax.set_ylabel('Position [m]')
ax.legend()
delta_s_position = s_end - s_start
ax.text(0.5, 0.8, f'Δs = {delta_s_position:.2f} m', transform=ax.transAxes)

plt.tight_layout()
plt.savefig(os.path.join(OUT, 'cell8-area-under-curve.png'), dpi=130)
plt.close()

# ================= Cell 11 =================
fig, axes = plt.subplots(3, 2, figsize=(16, 12))

ax = axes[0, 0]
ax.plot(t, s, label='Position')
slope_s = draw_tangent(ax, t, s, 5)
ax.set_title('Position vs Time (Differentiation)')
ax.set_xlabel('Time [s]')
ax.set_ylabel('Position [m]')
ax.legend()
ax.text(0.1, 0.9, f'Slope (Velocity) at t=5s: {slope_s:.2f} m/s', transform=ax.transAxes)

ax = axes[1, 0]
ax.plot(t, v, label='Velocity')
slope_v = draw_tangent(ax, t, v, 5)
ax.set_title('Velocity vs Time (Differentiation)')
ax.set_xlabel('Time [s]')
ax.set_ylabel('Velocity [m/s]')
ax.legend()
ax.text(0.1, 0.9, f'Slope (Acceleration) at t=5s: {slope_v:.2f} m/s²', transform=ax.transAxes)

ax = axes[2, 0]
ax.plot(t, a, label='Acceleration')
slope_a = draw_tangent(ax, t, a, 5)
ax.set_title('Acceleration vs Time (Differentiation)')
ax.set_xlabel('Time [s]')
ax.set_ylabel('Acceleration [m/s²]')
ax.legend()
ax.text(0.1, 0.9, f'Slope at t=5s: {slope_a:.2e}', transform=ax.transAxes)

ax = axes[2, 1]
ax.plot(t, a, label='Acceleration')
ax.fill_between(t[mask], 0, a[mask], color='orange', alpha=0.3, label='Area = Δv')
ax.set_title('Acceleration vs Time (Integration)')
ax.set_xlabel('Time [s]')
ax.set_ylabel('Acceleration [m/s²]')
ax.legend()
delta_v = np.trapezoid(a[mask], t[mask])
ax.text(0.5, 0.8, f'Δv = {delta_v:.2f} m/s', transform=ax.transAxes)

ax = axes[1, 1]
ax.plot(t, v_int, label='Velocity')
ax.fill_between(t[mask], 0, v_int[mask], color='green', alpha=0.3, label='Area = Δs')
ax.set_title('Velocity vs Time (Integration)')
ax.set_xlabel('Time [s]')
ax.set_ylabel('Velocity [m/s]')
ax.legend()
delta_s_int = np.trapezoid(v_int[mask], t[mask])
ax.text(0.5, 0.8, f'Δs = {delta_s_int:.2f} m', transform=ax.transAxes)

ax = axes[0, 1]
ax.plot(t, s_int, label='Position')
idx_start = np.argmin(np.abs(t - t_start))
idx_end = np.argmin(np.abs(t - t_end))
s_start = s_int[idx_start]
s_end = s_int[idx_end]
ax.vlines([t_start, t_end], s_int.min(), s_int.max(), colors='gray', linestyles='dashed')
ax.hlines([s_start, s_end], t.min(), t.max(), colors='gray', linestyles='dashed')
ax.set_title('Position vs Time (Integration)')
ax.set_xlabel('Time [s]')
ax.set_ylabel('Position [m]')
ax.legend()
delta_s_position_int = s_end - s_start
ax.text(0.5, 0.8, f'Δs = {delta_s_position_int:.2f} m', transform=ax.transAxes)

plt.tight_layout()
plt.savefig(os.path.join(OUT, 'cell11-side-by-side.png'), dpi=130)
plt.close()

print("done")
