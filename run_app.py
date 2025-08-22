#!/usr/bin/env python3
"""
StockSeer.AI - Enhanced Stock Analysis Platform
A modern, AI-powered stock analysis application with improved UI/UX
"""

import streamlit as st
import sys
import os

def main():
    """Main entry point for the StockSeer.AI application"""
    
    # Set page configuration
    st.set_page_config(
        page_title="StockSeer.AI - Advanced Stock Analysis",
        page_icon="📈",
        layout="wide",
        initial_sidebar_state="expanded"
    )
    
    # Add Google Fonts link to head
    st.markdown("""
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&family=Martel+Sans:wght@200;300;400;600;700;800;900&display=swap" rel="stylesheet">
        <script>
            // Ensure fonts are loaded
            document.fonts.ready.then(function () {
                console.log('Google Fonts loaded successfully');
            });
            
            // Apply fonts to all elements
            document.addEventListener('DOMContentLoaded', function() {
                document.body.style.fontFamily = "'Manrope', sans-serif";
                var headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
                headings.forEach(function(heading) {
                    heading.style.fontFamily = "'Martel Sans', 'Manrope', sans-serif";
                });
                
                                            // Fix expander icons - Ultra aggressive approach
                function fixExpanderIcons() {
                    // Function to replace text content
                    function replaceTextContent(element) {
                        if (element.textContent && element.textContent.includes('keyboard_double_arrow_right')) {
                            var expander = element.closest('.stExpander');
                            if (expander) {
                                var isExpanded = expander.getAttribute('data-state') === 'expanded' || 
                                               expander.getAttribute('aria-expanded') === 'true';
                                element.textContent = isExpanded ? '▼' : '▶';
                                element.style.fontFamily = 'inherit';
                                element.style.fontSize = '16px';
                                element.style.color = '#00d4ff';
                                element.style.fontWeight = 'bold';
                                return true;
                            }
                        }
                        return false;
                    }
                    
                    // Function to replace innerHTML
                    function replaceInnerHTML(element) {
                        if (element.innerHTML && element.innerHTML.includes('keyboard_double_arrow_right')) {
                            var expander = element.closest('.stExpander');
                            if (expander) {
                                var isExpanded = expander.getAttribute('data-state') === 'expanded' || 
                                               expander.getAttribute('aria-expanded') === 'true';
                                element.innerHTML = isExpanded ? '▼' : '▶';
                                element.style.fontFamily = 'inherit';
                                element.style.fontSize = '16px';
                                element.style.color = '#00d4ff';
                                element.style.fontWeight = 'bold';
                                return true;
                            }
                        }
                        return false;
                    }
                    
                    // Try multiple selectors to find the icon elements
                    var selectors = [
                        '[data-testid="expanderIcon"]',
                        '.stExpanderIcon',
                        '.stExpander button span',
                        '.stExpander button div',
                        '.stExpander button',
                        '.stExpander *'
                    ];
                    
                    selectors.forEach(function(selector) {
                        var elements = document.querySelectorAll(selector);
                        elements.forEach(function(element) {
                            replaceTextContent(element);
                            replaceInnerHTML(element);
                        });
                    });
                    
                    // Also try to find and replace any Material Icons
                    var materialIcons = document.querySelectorAll('[class*="material-icons"], [class*="MaterialIcons"]');
                    materialIcons.forEach(function(icon) {
                        var expander = icon.closest('.stExpander');
                        if (expander) {
                            var isExpanded = expander.getAttribute('data-state') === 'expanded' || 
                                           expander.getAttribute('aria-expanded') === 'true';
                            icon.innerHTML = isExpanded ? '▼' : '▶';
                            icon.style.fontFamily = 'inherit';
                            icon.style.fontSize = '16px';
                            icon.style.color = '#00d4ff';
                            icon.style.fontWeight = 'bold';
                        }
                    });
                    
                    // Ultra aggressive: Scan ALL elements in the document
                    var allElements = document.querySelectorAll('*');
                    allElements.forEach(function(element) {
                        replaceTextContent(element);
                        replaceInnerHTML(element);
                    });
                    
                    // Also check for any elements with the specific text content using XPath
                    try {
                        var textNodes = document.evaluate("//text()[contains(., 'keyboard_double_arrow_right')]", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                        for (var i = 0; i < textNodes.snapshotLength; i++) {
                            var textNode = textNodes.snapshotItem(i);
                            var parentElement = textNode.parentElement;
                            if (parentElement) {
                                var expander = parentElement.closest('.stExpander');
                                if (expander) {
                                    var isExpanded = expander.getAttribute('data-state') === 'expanded' || 
                                                   expander.getAttribute('aria-expanded') === 'true';
                                    textNode.textContent = isExpanded ? '▼' : '▶';
                                    parentElement.style.fontFamily = 'inherit';
                                    parentElement.style.fontSize = '16px';
                                    parentElement.style.color = '#00d4ff';
                                    parentElement.style.fontWeight = 'bold';
                                }
                            }
                        }
                    } catch (e) {
                        console.log('XPath evaluation failed:', e);
                    }
                    
                    // Force replace any remaining instances
                    var walker = document.createTreeWalker(
                        document.body,
                        NodeFilter.SHOW_TEXT,
                        null,
                        false
                    );
                    
                    var node;
                    while (node = walker.nextNode()) {
                        if (node.textContent && node.textContent.includes('keyboard_double_arrow_right')) {
                            var parentElement = node.parentElement;
                            if (parentElement && parentElement.closest('.stExpander')) {
                                var expander = parentElement.closest('.stExpander');
                                var isExpanded = expander.getAttribute('data-state') === 'expanded' || 
                                               expander.getAttribute('aria-expanded') === 'true';
                                node.textContent = isExpanded ? '▼' : '▶';
                                parentElement.style.fontFamily = 'inherit';
                                parentElement.style.fontSize = '16px';
                                parentElement.style.color = '#00d4ff';
                                parentElement.style.fontWeight = 'bold';
                            }
                        }
                    }
                }
            
            // Run immediately
            fixExpanderIcons();
            
            // Run again after a short delay to catch any late-loading elements
            setTimeout(fixExpanderIcons, 100);
            setTimeout(fixExpanderIcons, 300);
            setTimeout(fixExpanderIcons, 500);
            setTimeout(fixExpanderIcons, 1000);
            setTimeout(fixExpanderIcons, 2000);
            setTimeout(fixExpanderIcons, 3000);
            
            // Set up mutation observer to handle dynamically added expanders
            var observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'childList') {
                        setTimeout(fixExpanderIcons, 50);
                        setTimeout(fixExpanderIcons, 100);
                        setTimeout(fixExpanderIcons, 200);
                    }
                });
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['data-state', 'aria-expanded']
            });
            
            // Also fix icons when expander state changes
            document.addEventListener('click', function(e) {
                if (e.target.closest('.stExpander')) {
                    setTimeout(fixExpanderIcons, 10);
                    setTimeout(fixExpanderIcons, 50);
                    setTimeout(fixExpanderIcons, 100);
                    setTimeout(fixExpanderIcons, 200);
                }
            });
            
            // More frequent periodic check for any missed icons
            setInterval(fixExpanderIcons, 1000);
            
            // Also run on any DOM changes
            document.addEventListener('DOMContentLoaded', fixExpanderIcons);
            window.addEventListener('load', fixExpanderIcons);
            window.addEventListener('resize', fixExpanderIcons);
            });
        </script>
    """, unsafe_allow_html=True)
    
    # Add custom CSS for better loading experience
    st.markdown("""
        <style>
        /* Hide Streamlit's default loading spinner */
        .stSpinner > div {
            display: none;
        }
        
        /* Custom loading animation */
        .custom-loading {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 40px;
            background: linear-gradient(135deg, #0a0e1a 0%, #1a1f2e 100%);
            border-radius: 16px;
            margin: 20px 0;
        }
        
        .loading-spinner {
            width: 50px;
            height: 50px;
            border: 4px solid rgba(0, 212, 255, 0.2);
            border-top: 4px solid #00d4ff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .loading-text {
            margin-left: 20px;
            color: #b8c5d6;
            font-size: 1.1rem;
            font-family: 'Manrope', sans-serif;
        }
        
        /* Apply fonts to all elements */
        body, p, div, span, input, textarea, select, button {
            font-family: 'Manrope', sans-serif !important;
        }
        
        /* Apply heading fonts */
        h1, h2, h3, h4, h5, h6, .stMarkdown h1, .stMarkdown h2, .stMarkdown h3, .stMarkdown h4, .stMarkdown h5, .stMarkdown h6 {
            font-family: 'Martel Sans', 'Manrope', sans-serif !important;
        }
        
        /* Apply fonts to welcome message */
        h1, h2, h3, h4, h5, h6 {
            font-family: 'Martel Sans', 'Manrope', sans-serif;
        }
        
        body, p, div {
            font-family: 'Manrope', sans-serif;
        }
        
        /* Comprehensive fix for keyboard_double_arrow_right icon issue */
        .stExpander [data-testid="expanderIcon"],
        .stExpander .stExpanderIcon,
        .stExpander button span,
        .stExpander button div,
        .stExpander button {
            font-family: inherit !important;
            color: #00d4ff !important;
            font-size: 16px !important;
            font-weight: bold !important;
        }
        
        /* Replace all possible icon scenarios */
        .stExpander [data-testid="expanderIcon"]::before,
        .stExpander .stExpanderIcon::before,
        .stExpander button::before,
        .stExpander button span::before,
        .stExpander button div::before {
            content: "▶" !important;
            font-family: inherit !important;
            color: #00d4ff !important;
            font-size: 16px !important;
            font-weight: bold !important;
        }
        
        /* When expanded, show different icon */
        .stExpander[data-state="expanded"] [data-testid="expanderIcon"]::before,
        .stExpander[data-state="expanded"] .stExpanderIcon::before,
        .stExpander[data-state="expanded"] button::before,
        .stExpander[data-state="expanded"] button span::before,
        .stExpander[data-state="expanded"] button div::before,
        .stExpander[aria-expanded="true"] [data-testid="expanderIcon"]::before,
        .stExpander[aria-expanded="true"] .stExpanderIcon::before,
        .stExpander[aria-expanded="true"] button::before,
        .stExpander[aria-expanded="true"] button span::before,
        .stExpander[aria-expanded="true"] button div::before {
            content: "▼" !important;
        }
        
        /* Hide any Material Icons in expanders */
        .stExpander [class*="material-icons"],
        .stExpander [class*="MaterialIcons"] {
            display: none !important;
        }
        
        /* Force our custom icons to show */
        .stExpander button::after {
            content: "▶" !important;
            font-family: inherit !important;
            color: #00d4ff !important;
            font-size: 16px !important;
            font-weight: bold !important;
            position: absolute !important;
            right: 10px !important;
            top: 50% !important;
            transform: translateY(-50%) !important;
        }
        
        .stExpander[data-state="expanded"] button::after,
        .stExpander[aria-expanded="true"] button::after {
            content: "▼" !important;
        }
        
        /* Hide the keyboard_double_arrow_right text specifically */
        .stExpander *:contains("keyboard_double_arrow_right") {
            display: none !important;
        }
        
        /* Alternative approach: Replace text content with CSS */
        .stExpander button:contains("keyboard_double_arrow_right")::before {
            content: "▶" !important;
            font-family: inherit !important;
            color: #00d4ff !important;
            font-size: 16px !important;
            font-weight: bold !important;
        }
        
        .stExpander[data-state="expanded"] button:contains("keyboard_double_arrow_right")::before {
            content: "▼" !important;
        }
        
        /* Ultra aggressive: Hide ALL text content in expander buttons and force our icons */
        .stExpander button {
            position: relative !important;
        }
        
        .stExpander button * {
            visibility: hidden !important;
            opacity: 0 !important;
        }
        
        .stExpander button::after {
            content: "▶" !important;
            font-family: inherit !important;
            color: #00d4ff !important;
            font-size: 16px !important;
            font-weight: bold !important;
            position: absolute !important;
            right: 10px !important;
            top: 50% !important;
            transform: translateY(-50%) !important;
            visibility: visible !important;
            opacity: 1 !important;
            z-index: 1000 !important;
        }
        
        .stExpander[data-state="expanded"] button::after,
        .stExpander[aria-expanded="true"] button::after {
            content: "▼" !important;
        }
        
        /* Force hide any remaining text */
        .stExpander button span,
        .stExpander button div,
        .stExpander button p {
            display: none !important;
        }
        
        /* Hide Streamlit deploy bar - More specific targeting */
        /* Only hide the main menu button, not the sidebar */
        #MainMenu {
            visibility: hidden !important;
        }
        
        /* Hide only the footer, not the sidebar */
        .stApp > footer {
            display: none !important;
        }
        
        /* Hide only the top header, not the sidebar */
        .stApp > header {
            display: none !important;
        }
        
        /* Hide the "Made with Streamlit" footer */
        .stDeployButton {
            display: none !important;
        }
        
        /* Hide any other Streamlit branding elements */
        [data-testid="stDeployButton"] {
            display: none !important;
        }
        
        /* Alternative selectors for the deploy bar */
        .stDeployButton,
        .stDeployButtonContainer,
        .stDeployButtonWrapper {
            display: none !important;
        }
        
        /* Ensure sidebar is visible */
        .stApp > div[data-testid="stSidebar"] {
            display: block !important;
            visibility: visible !important;
        }
        
        /* Ensure sidebar content is visible */
        .stApp > div[data-testid="stSidebar"] * {
            visibility: visible !important;
        }
        </style>
    """, unsafe_allow_html=True)
    
    try:
        # Import and run the main application
        import app
        
        # Display a welcome message for first-time users
        if 'first_visit' not in st.session_state:
            st.session_state.first_visit = True
            st.markdown("""
                <div style="text-align: center; padding: 40px; background: linear-gradient(145deg, #1e2332, #1a1f2e); border-radius: 20px; border: 1px solid rgba(0, 212, 255, 0.2); margin: 20px 0;">
                    <div style="font-size: 4rem; margin-bottom: 20px;">🚀</div>
                    <h1 style="color: #00d4ff; margin-bottom: 15px;">Welcome to StockSeer.AI</h1>
                    <p style="color: #b8c5d6; font-size: 1.1rem; margin-bottom: 20px;">
                        Your AI-powered stock analysis platform with advanced insights and predictions
                    </p>
                    <div style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap;">
                        <div style="background: rgba(0, 212, 255, 0.1); padding: 15px; border-radius: 12px; border: 1px solid rgba(0, 212, 255, 0.2);">
                            <div style="font-size: 1.5rem; margin-bottom: 5px;">📊</div>
                            <div style="font-weight: 600; color: #00d4ff;">Real-time Data</div>
                        </div>
                        <div style="background: rgba(0, 255, 136, 0.1); padding: 15px; border-radius: 12px; border: 1px solid rgba(0, 255, 136, 0.2);">
                            <div style="font-size: 1.5rem; margin-bottom: 5px;">🤖</div>
                            <div style="font-weight: 600; color: #00ff88;">AI Analysis</div>
                        </div>
                        <div style="background: rgba(255, 107, 53, 0.1); padding: 15px; border-radius: 12px; border: 1px solid rgba(255, 107, 53, 0.2);">
                            <div style="font-size: 1.5rem; margin-bottom: 5px;">📈</div>
                            <div style="font-weight: 600; color: #ff6b35;">Predictions</div>
                        </div>
                    </div>
                </div>
            """, unsafe_allow_html=True)
            
            # Auto-hide welcome message after 5 seconds
            st.markdown("""
                <script>
                    setTimeout(function() {
                        document.querySelector('.welcome-message').style.display = 'none';
                    }, 5000);
                </script>
            """, unsafe_allow_html=True)
        
    except ImportError as e:
        st.error(f"Failed to import required modules: {e}")
        st.info("Please ensure all dependencies are installed: `pip install -r requirements.txt`")
    except Exception as e:
        st.error(f"An unexpected error occurred: {e}")
        st.info("Please check the console for more details or restart the application.")

if __name__ == "__main__":
    main()

