# Author: Lee Moore
"""Rename all files in a folder by adding the prefix 'project_' to each name.

Usage:
    python3 rename_files.py <folder_path>

Example:
    python3 rename_files.py ./my_folder
"""

import os
import sys

PREFIX = "project_"


def rename_files(folder):
    """Add PREFIX to every file (not sub-folder) in the given folder."""
    if not os.path.isdir(folder):
        print(f"Error: '{folder}' is not a valid directory.")
        return

    for filename in os.listdir(folder):
        old_path = os.path.join(folder, filename)

        # Skip directories and files that already have the prefix.
        if not os.path.isfile(old_path):
            continue
        if filename.startswith(PREFIX):
            continue

        new_name = PREFIX + filename
        new_path = os.path.join(folder, new_name)

        # Avoid clobbering an existing file with the same target name.
        if os.path.exists(new_path):
            print(f"Skipping '{filename}': '{new_name}' already exists.")
            continue

        os.rename(old_path, new_path)
        print(f"Renamed: {filename} -> {new_name}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 rename_files.py <folder_path>")
        sys.exit(1)

    rename_files(sys.argv[1])
