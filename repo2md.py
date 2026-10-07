#!/usr/bin/env python3
"""
repo2md.py - Merge an entire code repository into a single Markdown file.

Usage:
    python repo2md.py <repo_path> [-o output.md] [--max-size KB] [--exclude PATTERN ...]
                      [--include-ext .py .js ...] [--no-tree]

Examples:
    python repo2md.py ./my-website
    python repo2md.py ./my-website -o site.md --max-size 200
    python repo2md.py ./my-website --exclude "*.test.js" "docs/*"
    python repo2md.py ./my-website --include-ext .html .css .js
"""

import argparse
import fnmatch
import os
import subprocess
import sys
from pathlib import Path

# Directories that are never useful to include
DEFAULT_IGNORE_DIRS = {
    ".git", ".svn", ".hg", "node_modules", "__pycache__", ".next", ".nuxt",
    "dist", "build", "out", ".cache", ".parcel-cache", ".turbo", "vendor",
    "venv", ".venv", "env", ".idea", ".vscode", "coverage", ".pytest_cache",
    ".svelte-kit", ".vercel", ".netlify", "bower_components", "target",
}

# Files that are never useful to include
DEFAULT_IGNORE_FILES = {
    "package-lock.json", "yarn.lock", "pnpm-lock.yaml", "composer.lock",
    "Gemfile.lock", "poetry.lock", "Cargo.lock", ".DS_Store", "Thumbs.db",
}

# Binary / non-text extensions to skip
BINARY_EXTS = {
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".bmp", ".tiff", ".avif",
    ".woff", ".woff2", ".ttf", ".otf", ".eot",
    ".mp3", ".mp4", ".wav", ".ogg", ".webm", ".mov", ".avi",
    ".zip", ".tar", ".gz", ".rar", ".7z", ".pdf",
    ".exe", ".dll", ".so", ".dylib", ".bin", ".pyc", ".class", ".jar",
    ".psd", ".ai", ".sketch", ".map",
}

# Extension -> markdown code fence language
LANG_MAP = {
    ".py": "python", ".js": "javascript", ".mjs": "javascript", ".cjs": "javascript",
    ".jsx": "jsx", ".ts": "typescript", ".tsx": "tsx", ".html": "html", ".htm": "html",
    ".css": "css", ".scss": "scss", ".sass": "sass", ".less": "less",
    ".json": "json", ".yml": "yaml", ".yaml": "yaml", ".toml": "toml",
    ".md": "markdown", ".xml": "xml", ".svg": "xml", ".sh": "bash", ".bash": "bash",
    ".php": "php", ".rb": "ruby", ".go": "go", ".rs": "rust", ".java": "java",
    ".c": "c", ".cpp": "cpp", ".h": "c", ".cs": "csharp", ".sql": "sql",
    ".vue": "vue", ".svelte": "svelte", ".astro": "astro", ".txt": "text",
    ".env": "bash", ".ini": "ini", ".conf": "nginx", ".graphql": "graphql",
}


def is_binary(path: Path) -> bool:
    """Detect binary files by checking for null bytes."""
    try:
        with open(path, "rb") as f:
            return b"\0" in f.read(4096)
    except OSError:
        return True


def git_tracked_files(root: Path):
    """Return list of files tracked/unignored by git, or None if not a git repo."""
    try:
        out = subprocess.run(
            ["git", "-C", str(root), "ls-files", "--cached", "--others", "--exclude-standard"],
            capture_output=True, text=True, check=True,
        )
        return [root / line for line in out.stdout.splitlines() if line.strip()]
    except (subprocess.SubprocessError, FileNotFoundError):
        return None


def walk_files(root: Path):
    files = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = sorted(d for d in dirnames if d not in DEFAULT_IGNORE_DIRS)
        for name in sorted(filenames):
            files.append(Path(dirpath) / name)
    return files


def should_skip(path: Path, root: Path, args) -> str | None:
    """Return a reason string if the file should be skipped, else None."""
    rel = path.relative_to(root)
    rel_str = rel.as_posix()

    if any(part in DEFAULT_IGNORE_DIRS for part in rel.parts[:-1]):
        return "ignored dir"
    if path.name in DEFAULT_IGNORE_FILES:
        return "ignored file"
    if path.suffix.lower() in BINARY_EXTS:
        return "binary"
    if path.name.endswith((".min.js", ".min.css")):
        return "minified"
    for pattern in args.exclude:
        if fnmatch.fnmatch(rel_str, pattern) or fnmatch.fnmatch(path.name, pattern):
            return "excluded by pattern"
    if args.include_ext and path.suffix.lower() not in args.include_ext:
        return "extension not included"
    if not path.is_file():
        return "not a file"
    try:
        if path.stat().st_size > args.max_size * 1024:
            return f"larger than {args.max_size} KB"
    except OSError:
        return "unreadable"
    if is_binary(path):
        return "binary"
    return None


def build_tree(rel_paths):
    """Build an ASCII directory tree from relative paths."""
    tree = {}
    for p in rel_paths:
        node = tree
        for part in p.parts:
            node = node.setdefault(part, {})

    lines = []

    def render(node, prefix=""):
        items = sorted(node.items(), key=lambda kv: (not kv[1], kv[0].lower()))
        for i, (name, child) in enumerate(items):
            last = i == len(items) - 1
            lines.append(f"{prefix}{'└── ' if last else '├── '}{name}{'/' if child else ''}")
            if child:
                render(child, prefix + ("    " if last else "│   "))

    render(tree)
    return "\n".join(lines)


def fence_for(content: str) -> str:
    """Pick a code fence longer than any backtick run inside the content."""
    longest, run = 0, 0
    for ch in content:
        run = run + 1 if ch == "`" else 0
        longest = max(longest, run)
    return "`" * max(3, longest + 1)


def main():
    ap = argparse.ArgumentParser(description="Merge a repo into one Markdown file.")
    ap.add_argument("repo", help="Path to the repository / website folder")
    ap.add_argument("-o", "--output", help="Output .md file (default: <repo-name>.md)")
    ap.add_argument("--max-size", type=int, default=500, help="Skip files larger than this many KB (default 500)")
    ap.add_argument("--exclude", nargs="*", default=[], help="Glob patterns to exclude")
    ap.add_argument("--include-ext", nargs="*", default=[], help="Only include these extensions (e.g. .html .css .js)")
    ap.add_argument("--no-tree", action="store_true", help="Don't include the directory tree")
    ap.add_argument("--no-git", action="store_true", help="Don't use git to decide which files to include")
    args = ap.parse_args()

    root = Path(args.repo).resolve()
    if not root.is_dir():
        sys.exit(f"Error: {root} is not a directory")

    args.include_ext = [e.lower() if e.startswith(".") else f".{e.lower()}" for e in args.include_ext]
    output = Path(args.output) if args.output else Path(f"{root.name}.md")

    files = None if args.no_git else git_tracked_files(root)
    source = "git (respects .gitignore)" if files is not None else "filesystem walk"
    if files is None:
        files = walk_files(root)

    included, skipped = [], []
    out_resolved = output.resolve()
    for f in files:
        if f.resolve() == out_resolved:
            continue
        reason = should_skip(f, root, args)
        if reason:
            skipped.append((f.relative_to(root), reason))
        else:
            included.append(f)

    included.sort(key=lambda p: p.relative_to(root).as_posix().lower())

    total_chars = 0
    with open(output, "w", encoding="utf-8") as out:
        out.write(f"# Repository: {root.name}\n\n")
        out.write(f"- **Files included:** {len(included)}\n")
        out.write(f"- **Files skipped:** {len(skipped)}\n")
        out.write(f"- **File discovery:** {source}\n\n")

        if not args.no_tree:
            out.write("## Directory Structure\n\n```\n")
            out.write(f"{root.name}/\n")
            out.write(build_tree([f.relative_to(root) for f in included]))
            out.write("\n```\n\n")

        out.write("---\n\n## Files\n\n")

        for f in included:
            rel = f.relative_to(root).as_posix()
            try:
                content = f.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                content = f.read_text(encoding="utf-8", errors="replace")
            content = content.replace("\r\n", "\n").rstrip("\n")
            lang = LANG_MAP.get(f.suffix.lower(), "")
            fence = fence_for(content)

            out.write(f"### `{rel}`\n\n{fence}{lang}\n{content}\n{fence}\n\n")
            total_chars += len(content)

    size_kb = output.stat().st_size / 1024
    print(f"✓ Wrote {output} ({size_kb:.1f} KB)")
    print(f"  {len(included)} files included, {len(skipped)} skipped")
    print(f"  ~{total_chars // 4:,} tokens (rough estimate)")


if __name__ == "__main__":
    main()
