# Checkpoint 2: Port Rules and In-Memory Schedule
# This module defines the ISS docking configuration and tracks the current schedule

from datetime import datetime

# ============================================================================
# STATIC CONFIGURATION (never changes during runtime)
# ============================================================================

PORT_RULES = {
    "A1": {
        "can_dock": ["A1", "B1"],  # Ships requesting A1 can also dock at B1
        "refuel": True              # Only A1 has refueling capability
    },
    "A2": {
        "can_dock": ["A2", "B1"],  # Ships requesting A2 can also dock at B1
        "refuel": False
    },
    "B1": {
        "can_dock": ["B1"],        # B1 ships can only dock at B1
        "refuel": False
    }
}

# ============================================================================
# DYNAMIC SCHEDULE (updated as missions are assigned)
# ============================================================================

# Each port maps to a list of assigned missions
# Mission format: {
#     "mission_id": str,
#     "start_time": datetime,
#     "end_time": datetime,
#     "team": str
# }
DOCKING_PORTS = {
    "A1": [],
    "A2": [],
    "B1": []
}

