# Checkpoint 4: Core Docking Logic
# Main algorithm for processing docking requests and assigning missions to ports

from datetime import datetime
from docking_rules import PORT_RULES, DOCKING_PORTS
from docking_validation import parse_time, is_port_free, can_refuel


def assign_port(port: str, mission: dict) -> None:
    """
    Add a mission to the docking schedule at the specified port.

    Args:
        port: Port ID to assign mission to (e.g., "A1")
        mission: Mission dictionary with parsed datetime objects

    Side Effects:
        Updates DOCKING_PORTS[port] with the new mission
    """
    DOCKING_PORTS[port].append({
        "mission_id": mission["mission_id"],
        "start_time": mission["start_time"],
        "end_time": mission["end_time"],
        "team": mission["team"]
    })


def process_docking_request(mission: dict) -> dict:
    """
    Process a docking request and assign to an available port.

    Algorithm:
        1. Validate refueling constraint first (fail fast)
        2. Loop through compatible ports from requested port's can_dock list
        3. Find first available port using is_port_free()
        4. Assign mission or return rejection

    Args:
        mission: Dictionary with keys:
            - mission_id: str
            - requested_port: str (e.g., "A1", "A2", "B1")
            - start_time: str (ISO format)
            - end_time: str (ISO format)
            - team: str
            - refueling_required: bool

    Returns:
        Success: {"status": "accepted", "assigned_port": "A1"}
        Failure: {"status": "rejected", "reason": "..."}
    """
    # Extract mission data
    requested_port = mission["requested_port"]
    start = parse_time(mission["start_time"])
    end = parse_time(mission["end_time"])
    refueling_required = mission.get("refueling_required", False)

    # 1. Validate refueling constraint FIRST (fail fast)
    if not can_refuel(requested_port, refueling_required):
        return {
            "status": "rejected",
            "reason": "Refueling only available at A1"
        }

    # 2. Loop through compatible ports to find availability
    compatible_ports = PORT_RULES[requested_port]["can_dock"]

    for port in compatible_ports:
        if is_port_free(port, start, end):
            # Found an available port - assign mission
            mission_to_store = {
                "mission_id": mission["mission_id"],
                "start_time": start,
                "end_time": end,
                "team": mission["team"]
            }
            assign_port(port, mission_to_store)

            return {
                "status": "accepted",
                "assigned_port": port
            }

    # 3. No compatible ports available
    return {
        "status": "rejected",
        "reason": "No compatible ports available"
    }
