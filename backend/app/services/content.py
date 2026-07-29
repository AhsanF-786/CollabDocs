from __future__ import annotations

import html
import re
from pathlib import Path

import markdown
import nh3

SUPPORTED_EXTENSIONS = {".txt", ".md", ".markdown"}
ALLOWED_TAGS = {
    "p",
    "br",
    "strong",
    "em",
    "u",
    "s",
    "h1",
    "h2",
    "h3",
    "ul",
    "ol",
    "li",
    "blockquote",
    "pre",
    "code",
    "hr",
    "a",
}
ALLOWED_ATTRIBUTES = {"a": {"href", "title", "target"}}


class FileImportError(ValueError):
    """Raised when an uploaded file cannot safely be imported."""


def sanitize_editor_html(value: str) -> str:
    return nh3.clean(
        value,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        url_schemes={"http", "https", "mailto"},
        link_rel="noopener noreferrer",
    )


def import_text_file(filename: str | None, content: bytes, max_bytes: int) -> tuple[str, str]:
    safe_name = Path(filename or "Imported document.txt").name
    extension = Path(safe_name).suffix.lower()

    if extension not in SUPPORTED_EXTENSIONS:
        raise FileImportError("Only .txt and .md files are supported.")
    if not content:
        raise FileImportError("The selected file is empty.")
    if len(content) > max_bytes:
        raise FileImportError(f"The selected file exceeds the {max_bytes // 1_048_576} MB limit.")
    if b"\x00" in content:
        raise FileImportError("The selected file appears to be binary, not UTF-8 text.")

    try:
        decoded = content.decode("utf-8-sig")
    except UnicodeDecodeError as error:
        raise FileImportError("The selected file must use UTF-8 text encoding.") from error

    if not decoded.strip():
        raise FileImportError("The selected file does not contain any text.")

    if extension in {".md", ".markdown"}:
        raw_html = markdown.markdown(
            decoded,
            extensions=["fenced_code", "sane_lists"],
            output_format="html",
        )
    else:
        paragraphs = [
            f"<p>{html.escape(part).replace(chr(10), '<br>')}</p>"
            for part in re.split(r"\r?\n\r?\n", decoded.strip())
        ]
        raw_html = "".join(paragraphs)

    title = Path(safe_name).stem.strip()[:200] or "Imported document"
    return title, sanitize_editor_html(raw_html)
