#!/usr/bin/env python3
"""Count log lines per service, filtered by log level."""
import sys
from typing import Dict


def count_by_service(level: str, log_path: str) -> Dict[str, int]:
    """
    Read a log file and count how many lines match the given level,
    grouped by service name.

    :param level: The log level to filter on (e.g. "ERROR", "WARN").
    :param log_path: Path to the log file to read.
    :return: Dict mapping service name -> count of matching lines.
    """
    counts: Dict[str, int] = {}

    with open(log_path, encoding="utf-8") as log_file:
        for line in log_file:
            line = line.strip()
            if not line:
                # Skip blank lines
                continue

            # Expect lines shaped like: "<timestamp> <service> <level> <message...>"
            # maxsplit=3 keeps the rest of the message intact as one chunk
            parts = line.split(maxsplit=3)
            if len(parts) < 4:
                # Malformed line (missing one of the expected fields) — skip it (would alert someone in a real system)
                continue

            _timestamp, service, line_level, _message = parts
            if line_level != level:
                # Not the level we're filtering for
                continue

            counts[service] = counts.get(service, 0) + 1

    return counts


def main() -> int:
    """
    Parse CLI args, run the count, and print results sorted by
    count (descending) then service name (alphabetical) as a tiebreaker.

    :return: Process exit code (0 = success, 1 = error).
    """
    if len(sys.argv) != 3:
        print("Usage: analyse.sh <LEVEL> <path-to-log-file>", file=sys.stderr)
        return 1

    level: str = sys.argv[1]
    log_path: str = sys.argv[2]

    try:
        counts: Dict[str, int] = count_by_service(level, log_path)
    except OSError as exc:
        # e.g. file not found, permission denied, etc.
        print(
            f"analyse.sh: cannot read '{log_path}': {exc.strerror}", file=sys.stderr)
        return 1

    # Sort by count descending (-item[1]), then service name ascending (item[0])
    for service, count in sorted(counts.items(), key=lambda item: (-item[1], item[0])):
        print(f"{service}: {count}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
