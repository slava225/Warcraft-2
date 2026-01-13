import argparse
import importlib.util
import re
import sys
from dataclasses import dataclass
from pathlib import Path

PLACEHOLDER_PATTERN = re.compile(
    r"(\{[^{}]+\}|\$\{[^{}]+\}|%[sd]|%\d+\$[sd]|\\n|\\t|\\\\|\n\\)$"
)
TOKEN_PATTERN = re.compile(r"__PH(\d+)__")


@dataclass
class ParsedLine:
    raw: str
    key: str | None
    value: str | None
    left: str | None
    right_prefix: str | None


def parse_line(line: str) -> ParsedLine:
    if "=" not in line or line.lstrip().startswith("#"):
        return ParsedLine(line, None, None, None, None)
    left, _, right = line.partition("=")
    prefix = right[: len(right) - len(right.lstrip(" "))]
    value = right[len(prefix) :]
    return ParsedLine(line, left.rstrip(), value.rstrip("\n"), left + "=", prefix)


def mask_placeholders(text: str) -> tuple[str, list[str]]:
    replacements: list[str] = []

    def replacer(match: re.Match[str]) -> str:
        replacements.append(match.group(0))
        return f"__PH{len(replacements) - 1}__"

    masked = re.sub(
        r"(\{[^{}]+\}|\$\{[^{}]+\}|%[sd]|%\d+\$[sd]|\\n|\\t|\\\\|\n\\)",
        replacer,
        text,
    )
    return masked, replacements


def unmask_placeholders(text: str, replacements: list[str]) -> str:
    def replacer(match: re.Match[str]) -> str:
        index = int(match.group(1))
        return replacements[index]

    return TOKEN_PATTERN.sub(replacer, text)


def translate_value(value: str, from_lang: str, to_lang: str, argos_translate) -> str:
    masked, replacements = mask_placeholders(value)
    translated = argos_translate.translate(masked, from_lang, to_lang)
    return unmask_placeholders(translated, replacements)


def load_key_map(path: Path) -> dict[str, str]:
    key_map: dict[str, str] = {}
    for line in path.read_text(encoding="utf-8").splitlines(keepends=True):
        parsed = parse_line(line)
        if parsed.key:
            key_map[parsed.key] = parsed.value or ""
    return key_map


def ensure_language_installed(from_code: str, to_code: str, argos_package) -> None:
    packages = argos_package.get_installed_packages()
    for package in packages:
        if package.from_code == from_code and package.to_code == to_code:
            return
    raise RuntimeError(
        "Argos Translate language pack missing. Install with: "
        "argos-translate-cli --install-package <path-to-en_ru-argosmodel>"
    )


def process(
    en_path: Path,
    ru_path: Path,
    from_code: str,
    to_code: str,
    argos_package,
    argos_translate,
) -> None:
    ensure_language_installed(from_code, to_code, argos_package)
    ru_values = load_key_map(ru_path) if ru_path.exists() else {}

    output_lines: list[str] = []
    for line in en_path.read_text(encoding="utf-8").splitlines(keepends=True):
        parsed = parse_line(line)
        if not parsed.key:
            output_lines.append(line)
            continue
        en_value = parsed.value or ""
        current_value = ru_values.get(parsed.key, "")
        if not current_value or current_value.strip() == en_value.strip():
            translated = translate_value(en_value, from_code, to_code, argos_translate)
        else:
            translated = current_value
        output_line = f"{parsed.left}{parsed.right_prefix}{translated}"
        if line.endswith("\n"):
            output_line += "\n"
        output_lines.append(output_line)

    ru_path.write_text("".join(output_lines), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Translate en_us/client.lang into ru/client.lang with Argos Translate."
    )
    parser.add_argument("--en", default="en_us/client.lang")
    parser.add_argument("--ru", default="ru/client.lang")
    parser.add_argument("--from-code", default="en")
    parser.add_argument("--to-code", default="ru")
    args = parser.parse_args()

    if importlib.util.find_spec("argostranslate") is None:
        print(
            "Missing dependency: argostranslate. Install with:\n"
            "  python -m pip install argostranslate\n"
            "Then install the English->Russian package with:\n"
            "  argos-translate-cli --install-package <path-to-en_ru-argosmodel>"
        )
        sys.exit(1)

    import argostranslate.package
    import argostranslate.translate

    process(
        Path(args.en),
        Path(args.ru),
        args.from_code,
        args.to_code,
        argostranslate.package,
        argostranslate.translate,
    )


if __name__ == "__main__":
    main()
