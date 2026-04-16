#!/usr/bin/env python3
"""
Build ShipKit as Windows Executable
Uses PyInstaller + Inno Setup
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent
DIST_DIR = PROJECT_ROOT / "dist"
BUILD_DIR = PROJECT_ROOT / "build"
SPEC_FILE = PROJECT_ROOT / "shipkit.spec"

def clean():
    """Remove build artifacts"""
    print("[Build] Cleaning previous builds...")
    for directory in [DIST_DIR, BUILD_DIR, PROJECT_ROOT / "__pycache__"]:
        if directory.exists():
            shutil.rmtree(directory)
    if SPEC_FILE.exists():
        SPEC_FILE.unlink()
    print("[Build] Clean complete")

def build_frontend():
    """Build React frontend"""
    print("[Build] Building React frontend...")
    result = subprocess.run(
        ["npm", "run", "build"],
        cwd=PROJECT_ROOT,
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        print("[Build ERROR] Frontend build failed:")
        print(result.stderr)
        sys.exit(1)
    print("[Build] Frontend build complete")

def create_pyinstaller_spec():
    """Create PyInstaller spec file"""
    print("[Build] Creating PyInstaller spec...")
    
    frontend_build = PROJECT_ROOT / "frontend" / "build"
    
    spec_content = f'''# -*- mode: python ; coding: utf-8 -*-
from PyInstaller.utils.hooks import collect_submodules, collect_data_files
import sys
from pathlib import Path

a = Analysis(
    [r'{PROJECT_ROOT / "main.py"}'],
    pathex=[],
    binaries=[],
    datas=[
        (r'{frontend_build}', 'frontend/build'),
    ],
    hiddenimports=['uvicorn.lifespan', 'uvicorn.loops', 'uvicorn.protocols'],
    hookspath=[],
    hooksconfig={{}},
    runtime_hooks=[],
    excludedimports=[],
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=None)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='ShipKit',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=r'{PROJECT_ROOT / "assets" / "icon.ico"}',
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='ShipKit',
)
'''
    
    with open(SPEC_FILE, 'w') as f:
        f.write(spec_content)
    
    print(f"[Build] Spec file created at {SPEC_FILE}")

def build_exe():
    """Build executable with PyInstaller"""
    print("[Build] Building executable with PyInstaller...")
    
    result = subprocess.run(
        ["pyinstaller", str(SPEC_FILE), "--distpath", str(DIST_DIR)],
        capture_output=True,
        text=True
    )
    
    if result.returncode != 0:
        print("[Build ERROR] PyInstaller build failed:")
        print(result.stderr)
        sys.exit(1)
    
    print("[Build] Executable build complete")
    print(f"[Build] Output: {DIST_DIR / 'ShipKit'}")

def build_installer():
    """Build Windows installer with Inno Setup"""
    print("[Build] Creating Windows installer...")
    
    inno_script = PROJECT_ROOT / "installer.iss"
    
    # Check if Inno Setup is installed
    inno_exe = Path("C:/Program Files (x86)/Inno Setup 6/ISCC.exe")
    if not inno_exe.exists():
        print("[Build WARNING] Inno Setup not found at:", inno_exe)
        print("[Build WARNING] Skipping installer creation")
        print("[Build WARNING] Manual installer creation needed")
        return
    
    result = subprocess.run(
        [str(inno_exe), str(inno_script)],
        capture_output=True,
        text=True
    )
    
    if result.returncode != 0:
        print("[Build ERROR] Installer build failed:")
        print(result.stderr)
        sys.exit(1)
    
    print("[Build] Installer created: Output/ShipKit-Setup.exe")

def create_installer_script():
    """Create Inno Setup installer script"""
    print("[Build] Creating installer script...")
    
    version = "1.0.0"
    
    iss_content = f'''[Setup]
AppName=ShipKit
AppVersion={version}
AppPublisher=ShipKit
AppPublisherURL=https://shipkit.local
AppSupportURL=https://shipkit.local
AppUpdatesURL=https://shipkit.local
DefaultDirName={{commonpf}}\\ShipKit
DefaultGroupName=ShipKit
OutputBaseFilename=ShipKit-Setup
OutputDir=Output
Compression=lzma2
SolidCompression=yes
PrivilegesRequired=poweruser
AllowNoIcons=yes
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64
WizardStyle=modern

[Files]
Source: "dist\\ShipKit\\*"; DestDir: "{{app}}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{{group}}\\ShipKit"; Filename: "{{app}}\\ShipKit.exe"
Name: "{{commondesktop}}\\ShipKit"; Filename: "{{app}}\\ShipKit.exe"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Create a desktop shortcut"; GroupDescription: "Shortcuts:"

[Run]
Filename: "{{app}}\\ShipKit.exe"; Description: "Launch ShipKit"; Flags: nowait postinstall skipifsilent
'''
    
    iss_file = PROJECT_ROOT / "installer.iss"
    with open(iss_file, 'w') as f:
        f.write(iss_content)
    
    print(f"[Build] Installer script created at {iss_file}")

def main():
    """Main build process"""
    print("""
    ╔════════════════════════════════════════╗
    ║  ShipKit Build Process                 ║
    ║  Building Windows Desktop Application  ║
    ╚════════════════════════════════════════╝
    """)
    
    if len(sys.argv) > 1 and sys.argv[1] == "--clean":
        clean()
        return
    
    try:
        # Step 1: Clean
        clean()
        
        # Step 2: Build frontend
        build_frontend()
        
        # Step 3: Create PyInstaller spec
        create_pyinstaller_spec()
        
        # Step 4: Build executable
        build_exe()
        
        # Step 5: Create installer script
        create_installer_script()
        
        # Step 6: Build installer
        build_installer()
        
        print("""
        ╔════════════════════════════════════════╗
        ║  Build Complete!                       ║
        ╠════════════════════════════════════════╣
        ║  Executable: dist/ShipKit/ShipKit.exe  ║
        ║  Installer:  Output/ShipKit-Setup.exe  ║
        ║  Version:    1.0.0                     ║
        ╚════════════════════════════════════════╝
        """)
        
    except Exception as e:
        print(f"\n[Build ERROR] Build failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
