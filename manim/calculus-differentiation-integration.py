"""
Manim CE scene for the "微分と積分の関係" concept.

Color convention (kinematics): position = BLUE, velocity = GREEN, acceleration = RED.
All on-screen text is English (CLAUDE.md hard rule #2: labels inside visualizations
are English; only the MDX narrative is Japanese).

Render:
    manim -qm manim/calculus-differentiation-integration.py PositionVelocityAccelerationCascade
"""
from manim import *
import numpy as np

T_MAX = 5


class PositionVelocityAccelerationCascade(Scene):
    def construct(self):
        # ---------- intro title ----------
        title = Text("Differentiation ⇄ Integration", font_size=40)
        subtitle = Text("position ↔ velocity ↔ acceleration", font_size=26, color=GRAY_B)
        intro = VGroup(title, subtitle).arrange(DOWN, buff=0.3)
        self.play(FadeIn(intro))
        self.wait(0.8)
        self.play(FadeOut(intro))

        # ---------- functions ----------
        def s(t):
            return t ** 2

        def v(t):
            return 2 * t

        def a(t):
            return 2.0

        # ---------- axes, stacked vertically ----------
        common_axis_config = {"include_tip": False, "font_size": 20}

        pos_axes = Axes(
            x_range=[0, T_MAX, 1], y_range=[0, T_MAX ** 2, 5],
            x_length=10, y_length=1.9, axis_config=common_axis_config,
        )
        vel_axes = Axes(
            x_range=[0, T_MAX, 1], y_range=[0, 2 * T_MAX, 2],
            x_length=10, y_length=1.9, axis_config=common_axis_config,
        )
        acc_axes = Axes(
            x_range=[0, T_MAX, 1], y_range=[0, 4, 1],
            x_length=10, y_length=1.9, axis_config=common_axis_config,
        )

        pos_title = Text("Position   x(t) = t²", font_size=24, color=BLUE)
        vel_title = Text("Velocity   v(t) = 2t", font_size=24, color=GREEN)
        acc_title = Text("Acceleration   a(t) = 2", font_size=24, color=RED)

        pos_group = VGroup(pos_title, pos_axes).arrange(DOWN, buff=0.1)
        vel_group = VGroup(vel_title, vel_axes).arrange(DOWN, buff=0.1)
        acc_group = VGroup(acc_title, acc_axes).arrange(DOWN, buff=0.1)

        stack = VGroup(pos_group, vel_group, acc_group).arrange(DOWN, buff=0.3)
        stack.scale_to_fit_height(7.0)
        stack.move_to(ORIGIN)

        self.play(
            LaggedStart(*[FadeIn(g) for g in (pos_group, vel_group, acc_group)], lag_ratio=0.25),
            run_time=1.5,
        )

        # ---------- draw the position curve ----------
        pos_graph = pos_axes.plot(s, x_range=[0, T_MAX], color=BLUE)
        self.play(Create(pos_graph), run_time=2.5)
        self.wait(0.3)

        # helper: secant-approximated tangent line in axes coordinates
        def tangent_line(axes, func, t0, dt=0.25, color=YELLOW):
            p1 = axes.coords_to_point(max(t0 - dt, 0), func(max(t0 - dt, 0)))
            p2 = axes.coords_to_point(min(t0 + dt, T_MAX), func(min(t0 + dt, T_MAX)))
            return Line(p1, p2, color=color, stroke_width=5)

        def down_arrow_label(text):
            return VGroup(
                Text(text, font_size=22, color=YELLOW),
                Arrow(UP * 0.35, DOWN * 0.35, buff=0, color=YELLOW, stroke_width=5),
            ).arrange(RIGHT, buff=0.25)

        def up_arrow_label(text):
            return VGroup(
                Text(text, font_size=22, color=YELLOW),
                Arrow(DOWN * 0.35, UP * 0.35, buff=0, color=YELLOW, stroke_width=5),
            ).arrange(RIGHT, buff=0.25)

        # ================= Phase 1: differentiation, position -> velocity =================
        diff_label_1 = down_arrow_label("differentiation")
        diff_label_1.move_to((pos_group.get_bottom() + vel_group.get_top()) / 2)
        diff_label_1.shift(RIGHT * 4)
        self.play(FadeIn(diff_label_1), run_time=0.6)

        t1 = ValueTracker(0.15)

        pos_tangent = always_redraw(lambda: tangent_line(pos_axes, s, t1.get_value()))
        pos_dot_1 = always_redraw(
            lambda: Dot(pos_axes.coords_to_point(t1.get_value(), s(t1.get_value())), color=YELLOW, radius=0.06)
        )
        vel_partial_1 = always_redraw(
            lambda: vel_axes.plot(v, x_range=[0, max(t1.get_value(), 0.01)], color=GREEN)
        )
        vel_dot_1 = always_redraw(
            lambda: Dot(vel_axes.coords_to_point(t1.get_value(), v(t1.get_value())), color=GREEN, radius=0.06)
        )

        self.add(pos_tangent, pos_dot_1, vel_partial_1, vel_dot_1)
        self.play(t1.animate.set_value(T_MAX), run_time=6, rate_func=linear)
        self.wait(0.3)
        self.remove(pos_tangent, pos_dot_1, vel_dot_1)
        self.play(FadeOut(diff_label_1), run_time=0.5)

        # freeze the velocity curve as a plain static graph
        vel_graph = vel_axes.plot(v, x_range=[0, T_MAX], color=GREEN)
        self.remove(vel_partial_1)
        self.add(vel_graph)

        # ================= Phase 2: differentiation, velocity -> acceleration =================
        diff_label_2 = down_arrow_label("differentiation")
        diff_label_2.move_to((vel_group.get_bottom() + acc_group.get_top()) / 2)
        diff_label_2.shift(RIGHT * 4)
        self.play(FadeIn(diff_label_2), run_time=0.6)

        t2 = ValueTracker(0.15)

        vel_tangent = always_redraw(lambda: tangent_line(vel_axes, v, t2.get_value()))
        vel_dot_2 = always_redraw(
            lambda: Dot(vel_axes.coords_to_point(t2.get_value(), v(t2.get_value())), color=YELLOW, radius=0.06)
        )
        acc_partial_2 = always_redraw(
            lambda: acc_axes.plot(a, x_range=[0, max(t2.get_value(), 0.01)], color=RED)
        )
        acc_dot_2 = always_redraw(
            lambda: Dot(acc_axes.coords_to_point(t2.get_value(), a(t2.get_value())), color=RED, radius=0.06)
        )

        self.add(vel_tangent, vel_dot_2, acc_partial_2, acc_dot_2)
        self.play(t2.animate.set_value(T_MAX), run_time=5, rate_func=linear)
        self.wait(0.3)
        self.remove(vel_tangent, vel_dot_2, acc_dot_2)
        self.play(FadeOut(diff_label_2), run_time=0.5)

        acc_graph = acc_axes.plot(a, x_range=[0, T_MAX], color=RED)
        self.remove(acc_partial_2)
        self.add(acc_graph)

        # ================= Phase 3: integration, acceleration -> velocity =================
        int_label_1 = up_arrow_label("integration")
        int_label_1.move_to((acc_group.get_top() + vel_group.get_bottom()) / 2)
        int_label_1.shift(RIGHT * 4)
        self.play(FadeIn(int_label_1), run_time=0.6)

        t3 = ValueTracker(0.15)

        acc_area = always_redraw(
            lambda: acc_axes.get_area(
                acc_axes.plot(a, x_range=[0, T_MAX], color=RED),
                x_range=[0, max(t3.get_value(), 0.01)],
                color=RED, opacity=0.4,
            )
        )
        vel_dot_3 = always_redraw(
            lambda: Dot(vel_axes.coords_to_point(t3.get_value(), v(t3.get_value())), color=YELLOW, radius=0.06)
        )

        self.add(acc_area, vel_dot_3)
        self.play(t3.animate.set_value(T_MAX), run_time=5, rate_func=linear)
        self.wait(0.5)
        self.play(FadeOut(acc_area), FadeOut(vel_dot_3), FadeOut(int_label_1), run_time=0.6)

        # ================= Phase 4: integration, velocity -> position =================
        int_label_2 = up_arrow_label("integration")
        int_label_2.move_to((vel_group.get_top() + pos_group.get_bottom()) / 2)
        int_label_2.shift(RIGHT * 4)
        self.play(FadeIn(int_label_2), run_time=0.6)

        t4 = ValueTracker(0.15)

        vel_area = always_redraw(
            lambda: vel_axes.get_area(
                vel_axes.plot(v, x_range=[0, T_MAX], color=GREEN),
                x_range=[0, max(t4.get_value(), 0.01)],
                color=GREEN, opacity=0.4,
            )
        )
        pos_dot_4 = always_redraw(
            lambda: Dot(pos_axes.coords_to_point(t4.get_value(), s(t4.get_value())), color=YELLOW, radius=0.06)
        )

        self.add(vel_area, pos_dot_4)
        self.play(t4.animate.set_value(T_MAX), run_time=5, rate_func=linear)
        self.wait(0.5)
        self.play(FadeOut(vel_area), FadeOut(pos_dot_4), FadeOut(int_label_2), run_time=0.6)

        self.wait(1.2)
