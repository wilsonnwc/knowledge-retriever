#!/usr/bin/env python3
"""
Temperature experiment — asks the same question 3x at temperature=0 and
3x at temperature=1, so you can see the sampling effect directly.

Not part of the main app. A standalone learning tool.
"""

import os
import sys
from dotenv import load_dotenv
import anthropic

load_dotenv()
api_key = os.getenv("ANTHROPIC_API_KEY")
if not api_key:
    print("ERROR: ANTHROPIC_API_KEY not found in .env")
    sys.exit(1)

client = anthropic.Anthropic(api_key=api_key)

QUESTION = "Name one AI product management skill that matters in 2026. Answer in one short sentence."


def ask(temperature: float) -> str:
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=100,
        temperature=temperature,
        messages=[{"role": "user", "content": QUESTION}],
    )
    return response.content[0].text.strip()


if __name__ == "__main__":
    print(f"Question: {QUESTION}\n")

    print("=== temperature = 0 (near-deterministic) ===")
    for i in range(1, 4):
        print(f"{i}. {ask(0)}")

    print("\n=== temperature = 1 (default sampling) ===")
    for i in range(1, 4):
        print(f"{i}. {ask(1)}")
