#!/usr/bin/env python
"""
Student ERP — Django Command-Line Utility
"""
import os
import sys
from pathlib import Path

# Load environment variables from .env if present
try:
    from dotenv import load_dotenv
    backend_dir = Path(__file__).resolve().parent
    load_dotenv(backend_dir / '.env')
    load_dotenv(backend_dir.parent / '.env')
except ImportError:
    pass

def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)

if __name__ == '__main__':
    main()
