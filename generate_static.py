#!/usr/bin/env python3
"""
Generate static visualizations for PDF export
"""
import http.server
import socketserver
import webbrowser
import threading
import time
import os

def start_server():
    """Start a simple HTTP server"""
    PORT = 8001
    Handler = http.server.SimpleHTTPRequestHandler
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Server running at http://localhost:{PORT}")
        print("Open static_visualization.html in your browser")
        print("Use browser's Print to PDF feature to save as PDF")
        print("Press Ctrl+C to stop the server")
        
        # Auto-open browser
        def open_browser():
            time.sleep(1)
            webbrowser.open(f'http://localhost:{PORT}/static_visualization.html')
        
        browser_thread = threading.Thread(target=open_browser)
        browser_thread.daemon = True
        browser_thread.start()
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped")

if __name__ == "__main__":
    # Check if data files exist
    if not os.path.exists('state_totals.csv'):
        print("Error: state_totals.csv not found")
        print("Please run 'python process_data.py' first")
        exit(1)
    
    if not os.path.exists('state_heatmaps.json'):
        print("Error: state_heatmaps.json not found") 
        print("Please run 'python process_data.py' first")
        exit(1)
    
    start_server()