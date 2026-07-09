import math


def get_shape_width_at_y(shape_spec, y_position, canvas_width, canvas_height, scale_factor=1.0):
    """Calculate the horizontal width of a shape at a given Y position

    Args:
        shape_spec: Shape specification dict
        y_position: Y coordinate to check
        canvas_width: Canvas width (already scaled)
        canvas_height: Canvas height (already scaled)
        scale_factor: Scale factor to apply to shape params
    """
    shape = shape_spec.get("shape", "hexagon")
    params = shape_spec.get("params", {})
    cx = canvas_width // 2
    cy = canvas_height // 2

    if shape == "hexagon":
        radius = int(params.get("radius", min(canvas_width, canvas_height)//2 - 20) * scale_factor)
        # Hexagon with flat sides has vertices at 60-degree intervals
        # Calculate the X bounds at the given Y position
        ang = math.pi/3  # 60 degrees
        points = [(cx + radius*math.cos(i*ang), cy + radius*math.sin(i*ang)) for i in range(6)]
        
        # Find the hexagon edges that intersect with the horizontal line at y_position
        # The hexagon has 6 edges, we need to find which ones cross our Y line
        left_x = canvas_width
        right_x = 0
        
        for i in range(6):
            p1 = points[i]
            p2 = points[(i + 1) % 6]
            
            # Check if this edge crosses the Y position
            if (p1[1] <= y_position <= p2[1]) or (p2[1] <= y_position <= p1[1]):
                # Calculate X at this Y using linear interpolation
                if p2[1] != p1[1]:  # Avoid division by zero
                    t = (y_position - p1[1]) / (p2[1] - p1[1])
                    x = p1[0] + t * (p2[0] - p1[0])
                    left_x = min(left_x, x)
                    right_x = max(right_x, x)
        
        if left_x < canvas_width and right_x > 0:
            return left_x, right_x
        return cx - radius, cx + radius  # Fallback to full width
    
    elif shape == "circle":
        margin = int(params.get("margin", 50) * scale_factor)
        radius = min(canvas_width, canvas_height)//2 - margin

        # Calculate circle intersection at Y
        dy = abs(y_position - cy)
        if dy <= radius:
            # Use Pythagorean theorem to find X extent at this Y
            dx = math.sqrt(radius**2 - dy**2)
            return cx - dx, cx + dx
        return cx, cx  # Outside circle, no width

    elif shape == "shield":
        margin = int(params.get("margin", 56) * scale_factor)
        left = margin
        right = canvas_width - margin
        return left, right  # Shield has straight sides in our implementation

    elif shape == "rounded_rect":
        # Match ShapeLayer implementation - use width, height, radius parameters
        width = int(params.get("width", 450) * scale_factor)
        height = int(params.get("height", 450) * scale_factor)

        # Center the rectangle on canvas (same as ShapeLayer)
        x1 = cx - width//2
        y1 = cy - height//2
        x2 = cx + width//2
        y2 = cy + height//2

        rect = [x1, y1, x2, y2]
        if rect[1] <= y_position <= rect[3]:
            return rect[0], rect[2]
        return cx, cx  # Outside rectangle

    elif shape == "ribbon":
        # Classic ribbon with V-notch tails
        width = int(params.get("width", 480) * scale_factor)
        height = int(params.get("height", 80) * scale_factor)
        tail_depth = int(params.get("tail_depth", 25) * scale_factor)
        y_offset = int(params.get("y_offset", 180) * scale_factor)

        ribbon_cy = cy + y_offset
        left = cx - width // 2
        right = cx + width // 2
        top = ribbon_cy - height // 2
        bottom = ribbon_cy + height // 2

        # Check if y_position is within ribbon bounds
        if top <= y_position <= bottom:
            # For simplicity, return full width (excluding tail notch area)
            # The V-notch only affects the very edge, text should use inner width
            return left + tail_depth, right - tail_depth
        return cx, cx  # Outside ribbon

    elif shape == "ribbon_folded":
        # Folded ribbon - return main ribbon body bounds (text goes on main body)
        width = int(params.get("width", 440) * scale_factor)
        height = int(params.get("height", 80) * scale_factor)
        y_offset = int(params.get("y_offset", 140) * scale_factor)

        ribbon_cy = cy + y_offset
        left = cx - width // 2
        right = cx + width // 2
        top = ribbon_cy - height // 2
        bottom = ribbon_cy + height // 2

        # Check if y_position is within main ribbon bounds
        if top <= y_position <= bottom:
            return left, right
        return cx, cx  # Outside ribbon

    # Default: use full width minus margin
    margin = 50
    return margin, canvas_width - margin


def get_shape_bounds(shape_spec, canvas_width, canvas_height, scale_factor=1.0):
    """Calculate the bounding box of a shape layer

    Args:
        shape_spec: Shape specification dict
        canvas_width: Canvas width (already scaled)
        canvas_height: Canvas height (already scaled)
        scale_factor: Scale factor to apply to shape params
    """
    shape = shape_spec.get("shape", "hexagon")
    params = shape_spec.get("params", {})

    if shape == "hexagon":
        radius = int(params.get("radius", min(canvas_width, canvas_height)//2 - 20) * scale_factor)
        cx, cy = canvas_width//2, canvas_height//2
        # Calculate actual hexagon points to get real Y bounds
        # Hexagon with flat top/bottom has points at angles 0°, 60°, 120°, 180°, 240°, 300°
        ang = math.pi/3  # 60 degrees
        points = [(cx + radius*math.cos(i*ang), cy + radius*math.sin(i*ang)) for i in range(6)]
        
        # Get actual Y coordinates from the points
        y_coords = [p[1] for p in points]
        top = min(y_coords)     # Actual top Y of hexagon
        bottom = max(y_coords)  # Actual bottom Y of hexagon
        
        return {"top": top, "bottom": bottom, "center_x": cx, "center_y": cy, "radius": radius}

    elif shape == "circle":
        margin = int(params.get("margin", 50) * scale_factor)
        radius = min(canvas_width, canvas_height)//2 - margin
        cx, cy = canvas_width//2, canvas_height//2
        # Calculate actual circle bounds (just like we do for hexagon)
        top = cy - radius      # Actual top Y of circle
        bottom = cy + radius   # Actual bottom Y of circle
        return {"top": top, "bottom": bottom, "center_x": cx, "center_y": cy, "radius": radius}
    
    elif shape == "shield":
        margin = int(params.get("margin", 56) * scale_factor)
        tip_height = int(params.get("tip_height", 110) * scale_factor)
        top = margin
        bottom = canvas_height - margin
        cx = canvas_width//2
        return {"top": top, "bottom": bottom, "center_x": cx, "center_y": (top + bottom)//2, "radius": min(canvas_width, canvas_height)//2 - margin}

    elif shape == "rounded_rect":
        # Match ShapeLayer implementation - use width, height, radius parameters
        width = int(params.get("width", 450) * scale_factor)
        height = int(params.get("height", 450) * scale_factor)

        # Center the rectangle on canvas (same as ShapeLayer)
        cx = canvas_width//2
        cy = canvas_height//2
        x1 = cx - width//2
        y1 = cy - height//2
        x2 = cx + width//2
        y2 = cy + height//2

        rect = [x1, y1, x2, y2]
        top, bottom = rect[1], rect[3]
        return {"top": top, "bottom": bottom, "center_x": cx, "center_y": cy, "radius": min(width, height)//2}

    elif shape == "ribbon":
        # Classic ribbon with V-notch tails
        width = int(params.get("width", 480) * scale_factor)
        height = int(params.get("height", 80) * scale_factor)
        y_offset = int(params.get("y_offset", 180) * scale_factor)

        cx = canvas_width // 2
        cy = canvas_height // 2
        ribbon_cy = cy + y_offset

        top = ribbon_cy - height // 2
        bottom = ribbon_cy + height // 2

        return {"top": top, "bottom": bottom, "center_x": cx, "center_y": ribbon_cy, "radius": width // 2}

    elif shape == "ribbon_folded":
        # Folded ribbon - return main ribbon body bounds (text positioning)
        width = int(params.get("width", 480) * scale_factor)
        height = int(params.get("height", 80) * scale_factor)
        y_offset = int(params.get("y_offset", 180) * scale_factor)

        cx = canvas_width // 2
        cy = canvas_height // 2
        ribbon_cy = cy + y_offset

        top = ribbon_cy - height // 2
        bottom = ribbon_cy + height // 2

        return {"top": top, "bottom": bottom, "center_x": cx, "center_y": ribbon_cy, "radius": width // 2}

    # Default fallback
    return {"top": 50, "bottom": canvas_height-50, "center_x": canvas_width//2, "center_y": canvas_height//2, "radius": min(canvas_width, canvas_height)//2 - 50}