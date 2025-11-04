# Checkpoint 3: Validation Functions
# Helper functions for checking docking rules and conflicts

from datetime import datetime
from docking_rules import PORT_RULES, DOCKING_PORTS


def parse_time(tstr: str) -> datetime:
    """
    Convert ISO 8601 string to datetime object.

    Args:
        tstr: ISO format time string (e.g., "2024-03-15T10:00:00Z")

    Returns:
        datetime object

    Example:
        >>> parse_time("2024-03-15T10:00:00Z")
        datetime(2024, 3, 15, 10, 0, 0)
    """
    return datetime.fromisoformat(tstr.replace("Z", ""))


def is_port_free(port: str, start: datetime, end: datetime) -> bool:
    """
    Check if a port is available during the requested time window.

    Args:
        port: Port ID (e.g., "A1", "A2", "B1")
        start: Mission start time
        end: Mission end time

    Returns:
        True if port is free (no overlapping missions), False otherwise

    Logic:
        Two time ranges overlap if NOT (end1 <= start2 OR start1 >= end2)
    """
    for mission in DOCKING_PORTS[port]:
        mission_start = mission["start_time"]
        mission_end = mission["end_time"]

        # Check for overlap: missions conflict if they're NOT completely before or after
        if not (end <= mission_start or start >= mission_end):
            return False

    return True


def can_refuel(requested_port: str, refueling_required: bool) -> bool:
    """
    Validate refueling constraint.

    Args:
        requested_port: Port requested by the mission
        refueling_required: Whether the mission needs refueling

    Returns:
        True if refueling constraint is satisfied, False otherwise

    Logic:
        - If refueling needed, requested port must have refuel capability
        - If no refueling needed, any port is acceptable
    """
    if refueling_required:
        return PORT_RULES[requested_port]["refuel"]
    return True
