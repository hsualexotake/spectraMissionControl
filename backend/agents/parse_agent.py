"""
Mission log parsing agent using LangChain and ChatOpenAI.
Extracts structured mission data from raw text logs.
"""

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser


def parse_log_text(raw_text: str) -> dict:
    """
    Parse mission log text and extract structured data using ChatOpenAI.

    The function uses an LLM to intelligently extract mission information
    from various text formats and normalizes it into a consistent JSON schema.

    Args:
        raw_text: Raw text content from log files (TXT, PDF, CSV)

    Returns:
        Dictionary containing normalized mission data with fields:
        - mission_id (str): Unique mission identifier
        - requested_port (str): Requested port designation
        - start_time (str): Mission start time in ISO 8601 format
        - end_time (str): Mission end time in ISO 8601 format
        - team (str): Team or personnel name
        - refueling_required (bool): Whether refueling is needed

    Raises:
        Exception: If the LLM call fails or parsing errors occur
    """
    # Initialize the LLM with temperature=0 for consistent parsing
    llm = ChatOpenAI(
        model="gpt-3.5-turbo",
        temperature=0
    )

    # Define the output schema
    output_schema = {
        "mission_id": "string - unique mission identifier (e.g., 'Orion-3')",
        "requested_port": "string - port designation (e.g., 'A1', 'B2')",
        "start_time": "string - ISO 8601 datetime format (e.g., '2025-10-01T10:00:00Z')",
        "end_time": "string - ISO 8601 datetime format (e.g., '2025-10-01T12:00:00Z')",
        "team": "string - team or personnel name",
        "refueling_required": "boolean - true if refueling is needed, false otherwise"
    }

    # Create prompt template with explicit instructions
    prompt = ChatPromptTemplate.from_template(
        """You are a mission log parser. Extract mission information from the provided text and output it in the specified JSON format.

Instructions:
- Extract all relevant mission details from the text
- Convert dates and times to ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)
- If a field is not explicitly mentioned, make a reasonable inference based on context
- Output ONLY valid JSON, no additional text or explanation

Required JSON Schema:
{schema}

Raw Log Text:
{text}

Output the parsed mission data as JSON:"""
    )

    # Create the chain using LCEL with JsonOutputParser
    chain = prompt | llm | JsonOutputParser()

    # Invoke the chain
    parsed_data = chain.invoke({
        "text": raw_text,
        "schema": output_schema
    })

    return parsed_data
