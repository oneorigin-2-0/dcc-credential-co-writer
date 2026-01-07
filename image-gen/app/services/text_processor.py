"""
Text preprocessing utilities for icon matching and similarity calculations
"""

import re
import logging

logger = logging.getLogger(__name__)


def preprocess_text(text: str) -> str:
    """
    Preprocess text for similarity matching:
    - Convert to lowercase
    - Remove special characters (keep alphanumeric and spaces)
    - Normalize whitespace
    - Remove extra spaces
    
    Args:
        text: Input text to preprocess
        
    Returns:
        Preprocessed text string
    """
    if not text:
        return ""
    
    # Convert to lowercase
    text = text.lower()
    
    # Remove special characters, keep alphanumeric and spaces
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    
    # Normalize whitespace (replace multiple spaces/tabs/newlines with single space)
    text = re.sub(r'\s+', ' ', text)
    
    # Strip leading/trailing whitespace
    text = text.strip()
    
    return text

