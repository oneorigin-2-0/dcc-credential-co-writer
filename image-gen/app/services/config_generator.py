"""
Image configuration generation service
Moved from mit-slm to centralize all image-related logic
"""
import random
from typing import Dict, Any, Optional
from app.core.utils.geometry import get_shape_bounds


def _rand_hex():
    return "#" + "".join(random.choice("0123456789ABCDEF") for _ in range(6))


def _darken_color(hex_color: str, factor: float = 0.7) -> str:
    """Darken a hex color by a factor (0.0 = black, 1.0 = original)"""
    hex_color = hex_color.lstrip('#')
    r = int(int(hex_color[0:2], 16) * factor)
    g = int(int(hex_color[2:4], 16) * factor)
    b = int(int(hex_color[4:6], 16) * factor)
    return f"#{r:02x}{g:02x}{b:02x}"


def _pick_palette_color(palette):
    if palette:
        return random.choice(palette)
    return _rand_hex()


def _get_luminance(hex_color: str) -> float:
    """Calculate WCAG relative luminance (0=dark, 1=bright)

    Args:
        hex_color: Hex color string (e.g., '#FF6F61' or 'FF6F61')

    Returns:
        Float between 0 (black) and 1 (white)
    """
    hex_color = hex_color.lstrip('#')

    # Convert hex to RGB (0-1 range)
    r = int(hex_color[0:2], 16) / 255.0
    g = int(hex_color[2:4], 16) / 255.0
    b = int(hex_color[4:6], 16) / 255.0

    # Apply gamma correction (linearize RGB)
    def adjust(c):
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4

    r, g, b = adjust(r), adjust(g), adjust(b)

    # Calculate relative luminance
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def _get_complementary_text_color(
    gradient_start: str,
    gradient_end: str,
    warm: list,
    cool: list,
    text_light: list,
    text_dark: list
) -> str:
    """Select text color that complements gradient background

    Strategy:
    - Very dark gradients (< 0.3): Use light text (white/cream)
    - Medium gradients (0.3-0.5): Use contrasting palette color not in gradient
    - Bright gradients (> 0.5): Use dark text (black/navy)

    Args:
        gradient_start: Start color of gradient
        gradient_end: End color of gradient
        warm: Warm color palette
        cool: Cool color palette
        text_light: Light text color options
        text_dark: Dark text color options

    Returns:
        Hex color string for text
    """
    lum_start = _get_luminance(gradient_start)
    lum_end = _get_luminance(gradient_end)
    avg_luminance = (lum_start + lum_end) / 2

    if avg_luminance < 0.3:
        # Very dark gradient → light text
        return random.choice(text_light)
    elif avg_luminance > 0.5:
        # Bright gradient → dark text
        return random.choice(text_dark)
    else:
        # Medium gradient → colored text from palette (exclude gradient colors)
        all_colors = warm + cool
        available = [c for c in all_colors if c not in (gradient_start, gradient_end)]

        # Pick color that contrasts with gradient
        # Prefer colors with different luminance range
        contrasting = [c for c in available if abs(_get_luminance(c) - avg_luminance) > 0.2]

        if contrasting:
            return random.choice(contrasting)
        else:
            # Fallback: any available color
            return random.choice(available) if available else random.choice(text_dark)


# Curated gradient schemes with high visual contrast
# All gradients have luminance difference > 0.15 and perceptual color distance > 150
GRADIENT_SCHEMES = [
    # Warm gradients (high contrast within warm family)
    {"start": "#FF6F61", "end": "#FFB703", "category": "warm"},      # Coral to Gold (lum: 0.22, dist: 196)
    {"start": "#FB8500", "end": "#FFF4CC", "category": "warm"},      # Dark orange to cream (lum: 0.55, dist: 350)
    {"start": "#FF6F61", "end": "#FFD9B3", "category": "warm"},      # Coral to peach (lum: 0.38, dist: 250)
    {"start": "#FFD9B3", "end": "#FFB703", "category": "warm"},      # Peach to Gold (lum: 0.19, dist: 258)

    # Cool gradients (high contrast within cool family)
    {"start": "#26547C", "end": "#B3E5FC", "category": "cool"},      # Navy to sky blue (lum: 0.70, dist: 400)
    {"start": "#118AB2", "end": "#06D6A0", "category": "cool"},      # Deep blue to turquoise (lum: 0.29, dist: 180)
    {"start": "#26547C", "end": "#E1BEE7", "category": "cool"},      # Navy to lavender (lum: 0.62, dist: 350)
    {"start": "#457B9D", "end": "#B3E5FC", "category": "cool"},      # Blue to sky blue (lum: 0.55, dist: 312)

    # Warm-to-cool transitions (high contrast cross-family)
    {"start": "#FFB703", "end": "#06D6A0", "category": "warm-cool"}, # Gold to mint (lum: 0.05, dist: 470)
    {"start": "#FF8C42", "end": "#2A9D8F", "category": "warm-cool"}, # Orange to teal (lum: 0.14, dist: 364)
    {"start": "#26547C", "end": "#FFF4CC", "category": "cool-warm"}, # Navy to cream (lum: 0.84, dist: 450)
    {"start": "#06D6A0", "end": "#FFD9B3", "category": "cool-warm"}, # Turquoise to peach (lum: 0.21, dist: 300)
]


def calculate_font_size(text: str, base_size: int) -> int:
    """Calculate font size based on text length within spec limits"""
    if not text:
        return base_size

    # Scale down for longer text, stay within 36-45 range
    if len(text) > 30:
        return max(base_size - 7, 36)
    elif len(text) > 20:
        return max(base_size - 4, 36)

    return min(base_size, 45)


def _generate_text_badge_layers(
    meta: dict,
    seed: Optional[int] = None,
    logo_path: str = "assets/logos/dcc_logo.png",
    institution_colors: Optional[dict] = None,
):
    """Generate text-based badge configuration following spec

    Args:
        meta: Badge metadata
        seed: Random seed for reproducibility
        logo_path: Path to logo image
        institution_colors: Dict with primary, secondary, tertiary colors from institution
    """
    if seed is not None:
        random.seed(seed)

    # Use institution colors if available, otherwise use default palettes
    if institution_colors:
        warm = []
        cool = []
        if institution_colors.get("primary"):
            warm.append(institution_colors["primary"])
        if institution_colors.get("secondary"):
            cool.append(institution_colors["secondary"])
        if institution_colors.get("tertiary"):
            warm.append(institution_colors["tertiary"])
        # Text color options for institution colors
        text_light = ["#FFFFFF", "#F5F5F5", "#FFF9E6"]
        text_dark = ["#000000", "#1A1A1A", "#2C3E50"]
    else:
        # Expanded color palettes with better balance of light/medium/dark
        warm = [
            "#FF6F61",  # Coral (medium-dark, lum ~0.34)
            "#FF8C42",  # Orange (medium-dark, lum ~0.40)
            "#FFB703",  # Gold (medium-bright, lum ~0.55)
            "#FB8500",  # Dark orange (lum ~0.37)
            "#FFD9B3",  # Peach (light, lum ~0.72)
            "#FFF4CC",  # Cream (light, lum ~0.92)
        ]
        cool = [
            "#118AB2",  # Deep blue (dark, lum ~0.22)
            "#06D6A0",  # Turquoise (medium-bright, lum ~0.51)
            "#26547C",  # Navy (dark, lum ~0.08)
            "#2A9D8F",  # Teal (medium-dark, lum ~0.27)
            "#B3E5FC",  # Sky blue (light, lum ~0.78)
            "#E1BEE7",  # Lavender (light, lum ~0.70)
        ]

        # Text-specific color palettes for better variety
        text_light = ["#FFFFFF", "#F5F5F5", "#FFF9E6", "#FFFACD"]  # White/cream tints
        text_dark = ["#000000", "#1A1A1A", "#2C3E50", "#34495E"]   # Black/navy shades

    # Fixed canvas per spec
    canvas = {"width": 600, "height": 600}

    # Background layer (z: 0-9)
    background_layer = {
        "type": "BackgroundLayer",
        "mode": "solid",
        "color": "#FFFFFF00",
        "z": 0,
    }

    # Shape layer (z: 10-19)
    shape = random.choice(["hexagon", "circle", "rounded_rect"])

    # Select gradient colors using curated schemes (if no institution colors)
    if not institution_colors:
        # Use curated gradient schemes for harmonious color combinations
        gradient_scheme = random.choice(GRADIENT_SCHEMES)
        start = gradient_scheme["start"]
        end = gradient_scheme["end"]
    else:
        # For institution colors, create gradient from available colors
        all_colors = warm + cool
        if len(all_colors) >= 2:
            # Pick two different colors
            start = random.choice(all_colors)
            available = [c for c in all_colors if c != start]
            end = random.choice(available)
        else:
            # Fallback if only one color available
            start = _pick_palette_color(warm)
            end = _pick_palette_color(cool if cool else warm)

    fill = {
        "mode": "gradient",
        "start_color": start,
        "end_color": end,
        "vertical": True,
    }

    # Border disabled by default 
    # if random.random() < 0.6:
    #     border = {
    #         "color": _pick_palette_color(neutrals + cool + warm),
    #         "width": random.randint(1, 6),
    #     }
    # else:
    border = {
        "color": None,
        "width": 0
    }

    # Shape-specific params per spec
    if shape == "hexagon":
        params = {"radius": 250}
    elif shape == "circle":
        params = {"radius": 250}
    else:  # rounded_rect
        params = {
            "radius": random.randint(0, 100),
            "width": 450,
            "height": 450,
        }

    shape_layer = {
        "type": "ShapeLayer",
        "shape": shape,
        "fill": fill,
        "border": border,
        "params": params,
        "z": random.randint(10, 19),
    }

    # Logo layer (z: 20-24)
    logo_layer = {
        "type": "LogoLayer",
        "path": logo_path,
        "size": {"dynamic": True},
        "position": {"x": "center", "y": "dynamic"},
        "z": random.randint(20, 24),
    }

    # Ribbon layer (optional, z: 25-29, behind title)
    ribbon_layer = None
    if random.random() < 0.5:  # 50% chance to include ribbon
        ribbon_type = random.choice(["ribbon", "ribbon_folded"])
        ribbon_color = _darken_color(start, 0.7)

        # Calculate title Y position based on main shape bounds
        canvas_center = canvas["height"] // 2  # 300 for 600x600 canvas
        shape_bounds = get_shape_bounds(
            {"shape": shape, "params": params},
            canvas["width"],
            canvas["height"]
        )
        shape_height = shape_bounds["bottom"] - shape_bounds["top"]
        title_y = shape_bounds["top"] + shape_height * 0.46  # Title at 46% from top
        # Adjust ribbon down by ~15px to account for text baseline vs visual center
        ribbon_y_offset = int(title_y - canvas_center) + 15

        # Different widths for ribbon types
        ribbon_width = 540 if ribbon_type == "ribbon" else 490  # ribbon_folded is shorter

        # Build ribbon params
        ribbon_params = {
            "width": ribbon_width,
            "height": 70,
            "y_offset": ribbon_y_offset,  # Dynamically calculated to align with title
        }
        # Reduce V-notch depth for regular ribbon (smaller = shallower V, wider angle)
        if ribbon_type == "ribbon":
            ribbon_params["tail_depth"] = 15  # Default is 25, reduced for shallower V

        ribbon_layer = {
            "type": "ShapeLayer",
            "shape": ribbon_type,
            "fill": {"mode": "solid", "color": ribbon_color},
            "border": {"color": None, "width": 0},
            "params": ribbon_params,
            "z": random.randint(25, 29),
        }

    # Smart text processing
    def _clip_smart(s, max_len=40):
        if not s:
            return ""
        s = str(s).strip()
        if len(s) <= max_len:
            return s
        return s[:max_len-1] + "…"

    title = _clip_smart(meta.get("badge_title") or "Badge Title")
    subtitle = _clip_smart(meta.get("subtitle") or "Certified Achievement")
    extra = _clip_smart(meta.get("extra_text") or "")

    # Always include title, randomly choose between subtitle OR extra_text
    texts = [title]

    # Randomly select subtitle or extra_text (50/50 chance)
    if random.random() < 0.5:
        # Use subtitle
        if subtitle:
            texts.append(subtitle)
        elif extra:  # Fallback to extra if subtitle is empty
            texts.append(extra)
    else:
        # Use extra_text
        if extra:
            texts.append(extra)
        elif subtitle:  # Fallback to subtitle if extra is empty
            texts.append(subtitle)

    # Text layers (z: 30-39)
    text_layers = []
    z_values = sorted(random.sample(range(30, 40), len(texts)))

    for idx, txt in enumerate(texts):
        if not txt:
            continue

        # Font size within spec (36-45)
        base_size = 43 if idx == 0 else 40
        font_size = calculate_font_size(txt, base_size)

        # Select text color that complements the gradient background
        color = _get_complementary_text_color(start, end, warm, cool, text_light, text_dark)

        # Line gap within spec (4-7)
        line_gap = random.randint(4, 7)

        text_layer = {
            "type": "TextLayer",
            "text": txt,
            "font": {
                "path": "assets/fonts/ArialBold.ttf" if idx == 0 else "assets/fonts/Arial.ttf",
                "size": font_size,
            },
            "color": color,
            "align": {"x": "center", "y": "dynamic"},
            "wrap": {
                "dynamic": True,
                "line_gap": line_gap,
            },
            "z": z_values[idx],
        }
        text_layers.append(text_layer)

    config = {
        "layers": [
            # background_layer, added this layer in image-generation backend so no need to pass here
            shape_layer,
            logo_layer,
            *([ribbon_layer] if ribbon_layer else []),  # Add ribbon if generated
            *text_layers,
        ],
    }

    return config


def _generate_icon_badge_layers(
    meta: dict,
    seed: Optional[int] = None,
    icon_dir: str = "assets/icons/",
    suggested_icon: Optional[str] = None,
    institution_colors: Optional[dict] = None,
):
    """Generate icon-based badge configuration

    Args:
        meta: Badge metadata
        seed: Random seed for reproducibility
        icon_dir: Directory containing icon files
        suggested_icon: Suggested icon filename
        institution_colors: Dict with primary, secondary, tertiary colors from institution
    """
    if seed is not None:
        random.seed(seed)

    # Use institution colors if available, otherwise use default palettes
    if institution_colors:
        warm = []
        cool = []
        if institution_colors.get("primary"):
            warm.append(institution_colors["primary"])
        if institution_colors.get("secondary"):
            cool.append(institution_colors["secondary"])
        if institution_colors.get("tertiary"):
            warm.append(institution_colors["tertiary"])
        # Text color options for institution colors (for consistency)
        text_light = ["#FFFFFF", "#F5F5F5", "#FFF9E6"]
        text_dark = ["#000000", "#1A1A1A", "#2C3E50"]
    else:
        # Expanded color palettes with better balance (same as text badge)
        warm = [
            "#FF6F61",  # Coral (medium-dark, lum ~0.34)
            "#FF8C42",  # Orange (medium-dark, lum ~0.40)
            "#FFB703",  # Gold (medium-bright, lum ~0.55)
            "#FB8500",  # Dark orange (lum ~0.37)
            "#FFD9B3",  # Peach (light, lum ~0.72)
            "#FFF4CC",  # Cream (light, lum ~0.92)
        ]
        cool = [
            "#118AB2",  # Deep blue (dark, lum ~0.22)
            "#06D6A0",  # Turquoise (medium-bright, lum ~0.51)
            "#26547C",  # Navy (dark, lum ~0.08)
            "#2A9D8F",  # Teal (medium-dark, lum ~0.27)
            "#B3E5FC",  # Sky blue (light, lum ~0.78)
            "#E1BEE7",  # Lavender (light, lum ~0.70)
        ]

        # Text-specific color palettes (for consistency)
        text_light = ["#FFFFFF", "#F5F5F5", "#FFF9E6", "#FFFACD"]
        text_dark = ["#000000", "#1A1A1A", "#2C3E50", "#34495E"]

    if suggested_icon:
        icon_file = suggested_icon
    else:
        icon_file = random.choice(["trophy.png", "goal.png", "solution.png", "diamond.png"])

    final_icon_path = icon_dir.rstrip("/") + "/" + icon_file

    canvas = {"width": 600, "height": 600}

    background_layer = {
        "type": "BackgroundLayer",
        "mode": "solid",
        "color": "#FFFFFF",
        "z": 0,
    }

    shape = random.choice(["hexagon", "circle", "rounded_rect"])
    z_shape = random.randint(10, 19)

    # Select gradient colors using curated schemes (same as text badge)
    if not institution_colors:
        # Use curated gradient schemes for harmonious color combinations
        gradient_scheme = random.choice(GRADIENT_SCHEMES)
        start = gradient_scheme["start"]
        end = gradient_scheme["end"]
    else:
        # For institution colors, create gradient from available colors
        all_colors = warm + cool
        if len(all_colors) >= 2:
            # Pick two different colors
            start = random.choice(all_colors)
            available = [c for c in all_colors if c != start]
            end = random.choice(available)
        else:
            # Fallback if only one color available
            start = _pick_palette_color(warm)
            end = _pick_palette_color(cool if cool else warm)

    fill = {
        "mode": "gradient",
        "start_color": start,
        "end_color": end,
        "vertical": True,
    }

    # Border disabled by default 
    # if random.random() < 0.6:
    #     border = {
    #         "color": _pick_palette_color(neutrals + cool + warm),
    #         "width": random.randint(1, 6),
    #     }
    # else:
    border = {"color": None, "width": 0}

    if shape in ("hexagon", "circle"):
        params = {"radius": 250}
    else:
        params = {"radius": random.randint(0, 100), "width": 450, "height": 450}

    shape_layer = {
        "type": "ShapeLayer",
        "shape": shape,
        "fill": fill,
        "border": border,
        "params": params,
        "z": z_shape,
    }

    image_layer = {
        "type": "ImageLayer",
        "path": final_icon_path,
        "size": {"dynamic": True},
        "position": {"x": "center", "y": "center"},
        "z": random.randint(20, 29),
    }

    config = {
        "layers": [
            # background_layer, added this layer in image-generation backend so no need to pass here
            shape_layer,
            image_layer
        ],
    }

    return config


def generate_text_overlay_config(
    short_title: str,
    institute: str = "",
    achievement_phrase: str = "",
    colors: Optional[dict] = None,
    seed: Optional[int] = None
) -> Dict[str, Any]:
    """Generate image configuration with text overlay

    Args:
        short_title: Short badge title text
        institute: Institution/organization name (optional, defaults to empty string)
        achievement_phrase: Achievement phrase or motto (optional, defaults to empty string)
        colors: Optional brand colors (primary, secondary, tertiary)
        seed: Optional random seed for reproducibility

    Returns:
        Complete badge configuration ready for rendering
    """
    if seed is None:
        seed = random.randint(1, 10000)

    meta = {
        "badge_title": short_title,
        "subtitle": institute,
        "extra_text": achievement_phrase
    }

    config = _generate_text_badge_layers(
        meta=meta,
        seed=seed,
        logo_path="assets/logos/dcc_logo.png",
        institution_colors=colors
    )

    return config


def generate_icon_based_config(
    icon_name: str,
    colors: Optional[dict] = None,
    seed: Optional[int] = None
) -> Dict[str, Any]:
    """Generate image configuration with specified icon

    Args:
        icon_name: Icon filename (e.g., 'atom.png', 'trophy.png')
        colors: Optional brand colors (primary, secondary, tertiary)
        seed: Optional random seed for reproducibility

    Returns:
        Complete badge configuration ready for rendering
    """
    if seed is None:
        seed = random.randint(1, 10000)

    # Icon-based badges don't use text, so meta is minimal
    meta = {}

    config = _generate_icon_badge_layers(
        meta=meta,
        seed=seed,
        suggested_icon=icon_name,
        institution_colors=colors
    )

    return config
