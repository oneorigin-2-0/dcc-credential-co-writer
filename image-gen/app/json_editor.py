import json
import gradio as gr
from app.config import default_badge_config
from app.core.composer import render_from_spec


def generate_from_json(json_text):
    """Generate badge image from JSON configuration"""
    try:
        # Parse the JSON
        config = json.loads(json_text)
        
        # Generate the image
        image = render_from_spec(config)
        
        # Return image and clear error
        return image, ""
    except json.JSONDecodeError as e:
        # Return None for image and show error
        return None, f"JSON Parse Error: {str(e)}"
    except Exception as e:
        # Return None for image and show error
        return None, f"Error: {str(e)}"


def reset_to_default():
    """Reset to default configuration"""
    return json.dumps(default_badge_config, indent=2)


def create_json_interface():
    """Create JSON editor interface"""
    with gr.Blocks(title="Badge Generator - JSON Editor") as interface:
        gr.Markdown("# Badge Generator - JSON Configuration")
        gr.Markdown("Edit the JSON configuration below to customize your badge. The preview will update automatically.")
        
        with gr.Row():
            with gr.Column(scale=1):
                gr.Markdown("### Configuration Editor")
                json_input = gr.Code(
                    value=json.dumps(default_badge_config, indent=2),
                    language="json",
                    label="JSON Configuration",
                    lines=30,
                    interactive=True
                )
                
                with gr.Row():
                    generate_btn = gr.Button("Generate Badge", variant="primary")
                    reset_btn = gr.Button("Reset to Default", variant="secondary")
                
                error_output = gr.Textbox(
                    label="Error Messages",
                    visible=True,
                    interactive=False,
                    max_lines=3
                )
                
            with gr.Column(scale=1):
                gr.Markdown("### Generated Badge")
                output_image = gr.Image(
                    label="Preview",
                    type="pil",
                    height=600
                )
        
        gr.Markdown("""
        ### Configuration Guide:
        - **canvas**: Set width, height, and background color
        - **layers**: Array of layer objects with different types:
          - **BackgroundLayer**: Solid or gradient background
          - **ShapeLayer**: Main shape (hexagon, circle, shield, rounded_rect)
          - **LogoLayer**: Logo image with dynamic sizing
          - **TextLayer**: Text with dynamic wrapping
        - Each layer has a **z** value for layering order (higher = on top)
        """)
        
        # Auto-generate on JSON change
        json_input.change(
            fn=generate_from_json,
            inputs=[json_input],
            outputs=[output_image, error_output]
        )
        
        # Manual generate button
        generate_btn.click(
            fn=generate_from_json,
            inputs=[json_input],
            outputs=[output_image, error_output]
        )
        
        # Reset button
        reset_btn.click(
            fn=reset_to_default,
            outputs=[json_input]
        )
        
        # Generate default badge on load
        interface.load(
            fn=generate_from_json,
            inputs=[json_input],
            outputs=[output_image, error_output]
        )
    
    return interface