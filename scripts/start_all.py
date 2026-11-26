"""
Single-command launcher for MVTec AD Anomaly Detection Studio.
Starts both the Flask REST API backend and the Vite React frontend.
"""
import os
import sys
import subprocess
import time
import signal

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def main():
    print("=" * 65)
    print("  MVTec AD PatchCore Anomaly Detection Studio Launcher")
    print("=" * 65)
    print(f"Project Root: {PROJECT_ROOT}\n")

    # 1. Start Flask API Server
    api_cmd = [sys.executable, os.path.join(PROJECT_ROOT, "scripts", "api_server.py")]
    print("[1/2] Starting Flask REST API Backend on http://localhost:5000 ...")
    api_proc = subprocess.Popen(api_cmd, cwd=PROJECT_ROOT)

    time.sleep(2)

    # 2. Start Vite Frontend
    print("[2/2] Starting Vite Frontend on http://localhost:5173 ...")
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    vite_proc = subprocess.Popen([npm_cmd, "run", "dev"], cwd=PROJECT_ROOT)

    print("\n" + "=" * 65)
    print("  All Services Running Successfully!")
    print("  -> Frontend UI:      http://localhost:5173")
    print("  -> Backend API:      http://localhost:5000")
    print("  -> API Health:       http://localhost:5000/api/status")
    print("  Press Ctrl+C to terminate both servers cleanly.")
    print("=" * 65 + "\n")

    def handle_exit(sig, frame):
        print("\nShutting down servers...")
        try:
            api_proc.terminate()
            vite_proc.terminate()
        except:
            pass
        sys.exit(0)

    signal.signal(signal.SIGINT, handle_exit)
    signal.signal(signal.SIGTERM, handle_exit)

    try:
        api_proc.wait()
        vite_proc.wait()
    except KeyboardInterrupt:
        handle_exit(None, None)

if __name__ == "__main__":
    main()
