#!/usr/bin/env python3
import sys
import os

# Force output
sys.stdout.write("Hello from Python!\n")
sys.stdout.flush()

# Try to write to a file
with open('test_file.txt', 'w') as f:
    f.write("Test file created successfully\n")

print("Script completed")