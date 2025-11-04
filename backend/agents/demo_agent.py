"""
Text summarization agent using LangChain and ChatOpenAI.
"""

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser


def summarize_text(message: str) -> str:
    """
    Summarize the provided text using ChatOpenAI.

    Args:
        message: The text to summarize

    Returns:
        A 2-3 sentence summary of the input text

    Raises:
        Exception: If the LLM call fails
    """
    # Initialize the LLM
    llm = ChatOpenAI(
        model="gpt-3.5-turbo",
        temperature=0.5
    )

    # Create prompt template
    prompt = ChatPromptTemplate.from_template(
        "Summarize the following text in 2-3 sentences:\n\n{text}"
    )

    # Create the chain using LCEL
    chain = prompt | llm | StrOutputParser()

    # Invoke the chain
    summary = chain.invoke({"text": message})

    return summary
