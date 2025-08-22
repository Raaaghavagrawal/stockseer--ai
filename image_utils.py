"""
Image utilities for StockSeer.AI
Handles image loading with fallback mechanisms and error handling
"""

import streamlit as st
import requests
from PIL import Image
import io
import os

def create_fallback_icon(icon_text="📈", size=100, gradient_colors=("#00d4ff", "#0099cc")):
    """
    Create a fallback icon using HTML/CSS when image loading fails
    
    Args:
        icon_text (str): Emoji or text to display
        size (int): Size of the icon in pixels
        gradient_colors (tuple): Tuple of two colors for gradient background
    
    Returns:
        str: HTML markup for the fallback icon
    """
    return f"""
        <div style="
            display: flex; 
            justify-content: center; 
            align-items: center; 
            width: {size}px; 
            height: {size}px; 
            background: linear-gradient(135deg, {gradient_colors[0]}, {gradient_colors[1]}); 
            border-radius: 16px; 
            margin: 0 auto;
            box-shadow: 0 4px 15px rgba(0, 212, 255, 0.3);
            transition: all 0.3s ease;
        ">
            <span style="font-size: {size//2}px; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                {icon_text}
            </span>
        </div>
    """

def safe_image_display(image_path, width=100, fallback_icon="📈", **kwargs):
    """
    Safely display an image with fallback handling
    
    Args:
        image_path (str): Path to the image file or URL
        width (int): Width of the image
        fallback_icon (str): Icon to show if image fails to load
        **kwargs: Additional arguments for st.image
    
    Returns:
        bool: True if image was displayed successfully, False if fallback was used
    """
    try:
        # Check if it's a local file
        if os.path.exists(image_path):
            st.image(image_path, width=width, **kwargs)
            return True
        
        # Check if it's a URL
        elif image_path.startswith(('http://', 'https://')):
            # Try to fetch the image
            response = requests.get(image_path, timeout=5)
            if response.status_code == 200:
                # Convert to PIL Image and display
                image = Image.open(io.BytesIO(response.content))
                st.image(image, width=width, **kwargs)
                return True
            else:
                raise Exception(f"HTTP {response.status_code}")
        
        else:
            raise Exception("Invalid image path")
            
    except Exception as e:
        # Display fallback icon
        st.markdown(create_fallback_icon(fallback_icon, width), unsafe_allow_html=True)
        return False

def create_company_logo_placeholder(company_name, size=80):
    """
    Create a placeholder logo for companies without logos
    
    Args:
        company_name (str): Name of the company
        size (int): Size of the logo placeholder
    
    Returns:
        str: HTML markup for the placeholder logo
    """
    # Get first letter of company name
    initial = company_name[0].upper() if company_name else "S"
    
    return f"""
        <div style="
            display: flex; 
            justify-content: center; 
            align-items: center; 
            width: {size}px; 
            height: {size}px; 
            background: linear-gradient(135deg, #1e2332, #1a1f2e); 
            border: 2px solid rgba(0, 212, 255, 0.3);
            border-radius: 16px; 
            margin: 0 auto;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            transition: all 0.3s ease;
        ">
            <span style="
                font-size: {size//2}px; 
                font-weight: bold;
                color: #00d4ff; 
                text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
            ">
                {initial}
            </span>
        </div>
    """

def create_metric_icon(metric_type, size=60):
    """
    Create an icon for different metric types
    
    Args:
        metric_type (str): Type of metric (price, volume, trend, etc.)
        size (int): Size of the icon
    
    Returns:
        str: HTML markup for the metric icon
    """
    icon_map = {
        "price": "💰",
        "volume": "📊",
        "trend": "📈",
        "change": "🔄",
        "performance": "🎯",
        "risk": "⚠️",
        "growth": "🌱",
        "profit": "💎",
        "loss": "📉",
        "neutral": "➖"
    }
    
    icon = icon_map.get(metric_type.lower(), "📊")
    
    return f"""
        <div style="
            display: flex; 
            justify-content: center; 
            align-items: center; 
            width: {size}px; 
            height: {size}px; 
            background: linear-gradient(135deg, #1e2332, #1a1f2e); 
            border: 1px solid rgba(0, 212, 255, 0.2);
            border-radius: 12px; 
            margin: 0 auto;
            transition: all 0.3s ease;
        ">
            <span style="font-size: {size//2}px; color: #00d4ff;">
                {icon}
            </span>
        </div>
    """

def create_status_indicator(status, text, size="medium"):
    """
    Create a status indicator with icon and text
    
    Args:
        status (str): Status type (success, warning, error, info)
        text (str): Status text
        size (str): Size of the indicator (small, medium, large)
    
    Returns:
        str: HTML markup for the status indicator
    """
    status_config = {
        "success": {"icon": "✅", "color": "#00ff88", "bg": "rgba(0, 255, 136, 0.1)"},
        "warning": {"icon": "⚠️", "color": "#ffaa00", "bg": "rgba(255, 170, 0, 0.1)"},
        "error": {"icon": "❌", "color": "#ff4757", "bg": "rgba(255, 71, 87, 0.1)"},
        "info": {"icon": "ℹ️", "color": "#00d4ff", "bg": "rgba(0, 212, 255, 0.1)"}
    }
    
    config = status_config.get(status, status_config["info"])
    
    size_map = {
        "small": {"padding": "4px 8px", "font_size": "0.8rem"},
        "medium": {"padding": "6px 12px", "font_size": "0.9rem"},
        "large": {"padding": "8px 16px", "font_size": "1rem"}
    }
    
    size_config = size_map.get(size, size_map["medium"])
    
    return f"""
        <div style="
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: {size_config['padding']};
            background: {config['bg']};
            color: {config['color']};
            border: 1px solid {config['color']};
            border-radius: 20px;
            font-size: {size_config['font_size']};
            font-weight: 600;
            margin: 5px;
        ">
            <span style="font-size: 1.2em;">{config['icon']}</span>
            <span>{text}</span>
        </div>
    """

def create_loading_spinner(size=50, color="#00d4ff"):
    """
    Create a loading spinner
    
    Args:
        size (int): Size of the spinner
        color (str): Color of the spinner
    
    Returns:
        str: HTML markup for the loading spinner
    """
    return f"""
        <div style="
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        ">
            <div style="
                width: {size}px;
                height: {size}px;
                border: 4px solid rgba(0, 212, 255, 0.2);
                border-top: 4px solid {color};
                border-radius: 50%;
                animation: spin 1s linear infinite;
            "></div>
            <style>
                @keyframes spin {{
                    0% {{ transform: rotate(0deg); }}
                    100% {{ transform: rotate(360deg); }}
                }}
            </style>
        </div>
    """
