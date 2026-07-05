from manim import *

# Color convention in this scene:
# base object = BLUE, first-order face/strip growth = GREEN,
# higher-order overlap terms = ORANGE.


class SquareToCubeGrowth(ThreeDScene):
    def construct(self):
        self.camera.background_color = "#111827"
        title = Text("Power rule geometry", font_size=38).to_edge(UP)
        self.add_fixed_in_frame_mobjects(title)
        self.play(FadeIn(title))

        square = Square(side_length=2.4, color=BLUE, fill_opacity=0.35).shift(LEFT * 2.2)
        right_strip = Rectangle(width=0.45, height=2.4, color=GREEN, fill_opacity=0.65).next_to(square, RIGHT, buff=0)
        top_strip = Rectangle(width=2.4, height=0.45, color=GREEN, fill_opacity=0.65).next_to(square, UP, buff=0)
        corner = Square(side_length=0.45, color=ORANGE, fill_opacity=0.8).next_to(right_strip, UP, buff=0)
        corner.align_to(top_strip, RIGHT)
        formula_2 = MathTex(r"\Delta A = 2x\,\Delta x + \Delta x^2", font_size=40).shift(RIGHT * 2.0)
        formula_2[0][3:9].set_color(GREEN)   # 2x Delta x term = the two strips
        formula_2[0][10:].set_color(ORANGE)  # Delta x^2 term = the corner
        note_2 = MathTex(r"\frac{d}{dx}x^2 = 2x", font_size=36).next_to(formula_2, DOWN, buff=0.5)

        self.play(Create(square), run_time=1.2)
        self.play(GrowFromEdge(right_strip, LEFT), GrowFromEdge(top_strip, DOWN), run_time=1.5)
        self.play(FadeIn(corner), Write(formula_2), FadeIn(note_2), run_time=1.4)
        self.play(corner.animate.set_opacity(0.18).scale(0.55), run_time=1.1)
        self.wait(0.8)
        self.play(
            FadeOut(square),
            FadeOut(right_strip),
            FadeOut(top_strip),
            FadeOut(corner),
            FadeOut(formula_2),
            FadeOut(note_2),
        )

        self.remove(title)
        title_3 = Text("Cube growth", font_size=38).to_edge(UP)
        self.add_fixed_in_frame_mobjects(title_3)
        self.play(FadeIn(title_3))

        self.set_camera_orientation(phi=65 * DEGREES, theta=-40 * DEGREES, zoom=0.9)
        cube = Cube(side_length=2.0, fill_color=BLUE, fill_opacity=0.34, stroke_color=BLUE)
        face_x = Prism(dimensions=[0.38, 2.0, 2.0], fill_color=GREEN, fill_opacity=0.64).shift(RIGHT * 1.19)
        face_y = Prism(dimensions=[2.0, 0.38, 2.0], fill_color=GREEN, fill_opacity=0.64).shift(UP * 1.19)
        face_z = Prism(dimensions=[2.0, 2.0, 0.38], fill_color=GREEN, fill_opacity=0.64).shift(OUT * 1.19)
        edge_1 = Prism(dimensions=[0.38, 0.38, 2.38], fill_color=ORANGE, fill_opacity=0.62).shift(RIGHT * 1.19 + UP * 1.19 + OUT * 0.19)
        edge_2 = Prism(dimensions=[0.38, 2.0, 0.38], fill_color=ORANGE, fill_opacity=0.62).shift(RIGHT * 1.19 + OUT * 1.19)
        edge_3 = Prism(dimensions=[2.0, 0.38, 0.38], fill_color=ORANGE, fill_opacity=0.62).shift(UP * 1.19 + OUT * 1.19)
        formula_3 = MathTex(
            r"\Delta V = 3x^2\,\Delta x + \cdots \quad\Rightarrow\quad \frac{d}{dx}x^3 = 3x^2",
            font_size=36,
        ).to_edge(DOWN)
        formula_3[0][3:10].set_color(GREEN)  # 3x^2 Delta x term = the three faces
        self.add_fixed_in_frame_mobjects(formula_3)

        self.play(Create(cube), run_time=1.2)
        self.play(FadeIn(face_x), FadeIn(face_y), FadeIn(face_z), run_time=1.7)
        self.play(FadeIn(edge_1), FadeIn(edge_2), FadeIn(edge_3), Write(formula_3), run_time=1.3)
        self.begin_ambient_camera_rotation(rate=0.12)
        self.play(
            edge_1.animate.set_opacity(0.16),
            edge_2.animate.set_opacity(0.16),
            edge_3.animate.set_opacity(0.16),
            run_time=1.5,
        )
        self.wait(2)
        self.stop_ambient_camera_rotation()
