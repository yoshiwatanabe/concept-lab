"""
Manim CE scene for the "The Attention Mechanism" concept.

Color convention: query = BLUE, keys/scores = ORANGE, softmax weights = GREEN,
values/output = PURPLE.

Render:
    manim -qm manim/attention-mechanism.py AttentionFlow -o attention-mechanism-flow.mp4
"""
from manim import *
import numpy as np


class AttentionFlow(Scene):
    def construct(self):
        self.camera.background_color = "#111827"

        title = Text("Attention flow", font_size=40)
        subtitle = Text("Q · K  →  softmax  →  weighted V sum", font_size=26, color=GRAY_B)
        intro = VGroup(title, subtitle).arrange(DOWN, buff=0.25)
        self.play(FadeIn(intro), run_time=1.0)
        self.wait(0.6)
        self.play(FadeOut(intro))

        tokens = ["cat", "ga", "fish", "wo", "ate"]
        token_boxes = VGroup(*[
            RoundedRectangle(width=1.25, height=0.5, corner_radius=0.08, color=WHITE)
            .add(Text(t, font_size=22))
            for t in tokens
        ]).arrange(RIGHT, buff=0.25).to_edge(UP)
        token_boxes[4].set_color(BLUE)
        self.play(LaggedStart(*[FadeIn(b) for b in token_boxes], lag_ratio=0.12), run_time=1.2)

        q_label = Text("Q(ate)", font_size=34, color=BLUE).next_to(token_boxes[4], DOWN, buff=0.5)
        q_vec = VGroup(*[Text(v, font_size=24) for v in ["0.8", "0.0", "0.9", "0.3"]]).arrange(DOWN, buff=0.05)
        q_vec.add(SurroundingRectangle(q_vec, color=BLUE, buff=0.14)).next_to(q_label, DOWN, buff=0.25)
        q_group = VGroup(q_label, q_vec)
        self.play(Write(q_label), FadeIn(q_vec), run_time=1.2)

        keys_title = Text("compare with each Key", font_size=26, color=ORANGE).to_edge(LEFT).shift(UP * 1.0)
        score_vals = [0.40, 0.05, 0.50, 0.09, 0.49]
        axes = Axes(
            x_range=[0, 5, 1],
            y_range=[0, 0.6, 0.2],
            x_length=5.4,
            y_length=2.2,
            axis_config={"include_tip": False, "font_size": 18},
        ).shift(LEFT * 2.6 + DOWN * 0.8)
        score_bars = VGroup()
        for i, val in enumerate(score_vals):
            bar = Rectangle(
                width=0.42,
                height=axes.y_axis.n2p(val)[1] - axes.y_axis.n2p(0)[1],
                fill_color=ORANGE,
                fill_opacity=0.85,
                stroke_width=0,
            )
            bar.move_to(axes.c2p(i + 0.5, val / 2))
            label = Text(tokens[i], font_size=18).next_to(bar, DOWN, buff=0.15)
            score_bars.add(VGroup(bar, label))
        score_formula = MathTex(r"\text{score}_j = \frac{Q \cdot K_j}{\sqrt{d}}", font_size=34).next_to(axes, DOWN, buff=0.45)
        self.play(FadeIn(keys_title), Create(axes), run_time=1.0)
        self.play(LaggedStart(*[GrowFromEdge(b[0], DOWN) for b in score_bars], lag_ratio=0.15), FadeIn(score_bars), run_time=1.8)
        self.play(Write(score_formula), run_time=1.0)
        self.wait(0.5)

        softmax_title = Text("softmax turns scores into weights", font_size=26, color=GREEN).to_edge(RIGHT).shift(UP * 1.0)
        weights = np.exp(score_vals) / np.exp(score_vals).sum()
        weight_axes = Axes(
            x_range=[0, 5, 1],
            y_range=[0, 0.35, 0.1],
            x_length=5.4,
            y_length=2.2,
            axis_config={"include_tip": False, "font_size": 18},
        ).shift(RIGHT * 2.6 + DOWN * 0.8)
        weight_bars = VGroup()
        for i, val in enumerate(weights):
            bar = Rectangle(
                width=0.42,
                height=weight_axes.y_axis.n2p(float(val))[1] - weight_axes.y_axis.n2p(0)[1],
                fill_color=GREEN,
                fill_opacity=0.85,
                stroke_width=0,
            )
            bar.move_to(weight_axes.c2p(i + 0.5, float(val) / 2))
            label = Text(f"{float(val):.2f}", font_size=17).next_to(bar, UP, buff=0.08)
            weight_bars.add(VGroup(bar, label))
        softmax_formula = MathTex(r"\alpha_j = \mathrm{softmax}(\text{score}_j)", font_size=34).next_to(weight_axes, DOWN, buff=0.45)
        arrow = Arrow(axes.get_right(), weight_axes.get_left(), color=YELLOW, buff=0.2)
        self.play(GrowArrow(arrow), FadeIn(softmax_title), Create(weight_axes), run_time=1.0)
        self.play(LaggedStart(*[GrowFromEdge(b[0], DOWN) for b in weight_bars], lag_ratio=0.15), FadeIn(weight_bars), run_time=1.8)
        self.play(Write(softmax_formula), run_time=1.0)
        self.wait(0.6)

        self.play(
            FadeOut(keys_title),
            FadeOut(axes),
            FadeOut(score_bars),
            FadeOut(score_formula),
            FadeOut(softmax_title),
            FadeOut(weight_axes),
            FadeOut(weight_bars),
            FadeOut(softmax_formula),
            FadeOut(arrow),
            FadeOut(q_group),
            run_time=1.0,
        )

        values_title = Text("weighted sum of Value vectors", font_size=30, color=PURPLE).to_edge(UP)
        self.play(Transform(token_boxes, token_boxes.copy().to_edge(UP).scale(0.9)), FadeIn(values_title), run_time=0.8)
        value_cards = VGroup()
        value_texts = ["V(cat)", "V(ga)", "V(fish)", "V(wo)", "V(ate)"]
        for i, txt in enumerate(value_texts):
            card = VGroup(
                Text(f"{weights[i]:.2f}", font_size=22, color=GREEN),
                Text("x", font_size=24),
                Text(txt, font_size=22, color=PURPLE),
            ).arrange(RIGHT, buff=0.18)
            value_cards.add(card)
        value_cards.arrange(DOWN, aligned_edge=LEFT, buff=0.23).shift(LEFT * 2.9 + DOWN * 0.35)
        plus = Text("+", font_size=46).next_to(value_cards, RIGHT, buff=0.55)
        output = VGroup(
            MathTex(r"\sum_j \alpha_j V_j", font_size=40, color=PURPLE),
            Text("contextual output for 'ate'", font_size=24, color=GRAY_B),
        ).arrange(DOWN, buff=0.2).next_to(plus, RIGHT, buff=0.55)
        self.play(LaggedStart(*[FadeIn(c, shift=RIGHT * 0.2) for c in value_cards], lag_ratio=0.2), run_time=2.0)
        self.play(FadeIn(plus), TransformFromCopy(value_cards, output), run_time=1.6)
        final_formula = MathTex(
            r"\mathrm{Attention}(Q,K,V) = \mathrm{softmax}\!\left(\frac{QK^{\top}}{\sqrt{d}}\right)V",
            font_size=36,
        ).to_edge(DOWN)
        self.play(Write(final_formula), run_time=1.5)
        self.wait(2.0)
