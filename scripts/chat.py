#!/usr/bin/env python3
"""
Personal Knowledge Retriever — Chat interface
Loads your notes and talks with you about them.
"""

import os
import re
import sys
from pathlib import Path
from dotenv import load_dotenv
import anthropic
import chromadb
from openai import OpenAI

# Load API key from .env
load_dotenv()
api_key = os.getenv("ANTHROPIC_API_KEY")
if not api_key:
    print("ERROR: ANTHROPIC_API_KEY not found in .env")
    sys.exit(1)

client = anthropic.Anthropic(api_key=api_key)

# Paths
PROJECT_ROOT = Path(__file__).parent.parent
NOTES_DIR = PROJECT_ROOT / "notes"
PROMPTS_DIR = PROJECT_ROOT / "prompts"
SYSTEM_PROMPT_PATH = PROMPTS_DIR / "system.txt"
CHROMA_DIR = PROJECT_ROOT / "system" / "chroma_db"
COLLECTION_NAME = "notes"
EMBEDDING_MODEL = "text-embedding-3-small"

if not SYSTEM_PROMPT_PATH.exists():
    print(f"ERROR: System prompt not found at {SYSTEM_PROMPT_PATH}")
    sys.exit(1)

with open(SYSTEM_PROMPT_PATH, "r") as f:
    SYSTEM_PROMPT = f.read()


def search_notes(query: str) -> str:
    """
    Keyword search across all notes with section-aware preview.
    Respects ## section boundaries for consolidated files.
    """
    if not NOTES_DIR.exists():
        return "[No notes directory found]"

    relevant_items = []
    # Strip punctuation so "goals?" matches "goals" in content
    query_words = re.findall(r"[a-z0-9']+", query.lower())

    for note_file in NOTES_DIR.rglob("*.md"):
        with open(note_file, "r", encoding="utf-8") as f:
            content = f.read()

        # Count keyword matches
        matches = sum(1 for word in query_words if word in content.lower())
        if matches > 0:
            # Extract a section-aware preview: frontmatter + intro + first section
            lines = content.split("\n")
            preview_lines = []
            section_count = 0

            # Pull content: frontmatter (---), intro text, and first full section
            for i, line in enumerate(lines):
                preview_lines.append(line)

                # Count section headers (##)
                if line.startswith("## "):
                    section_count += 1
                    # Stop after capturing the first section
                    if section_count > 1:
                        break

                # Safety limit: don't pull entire file even if no second header
                if i > 120:
                    break

            relevant_items.append({
                "file": note_file.name,
                "path": note_file.relative_to(NOTES_DIR),
                "matches": matches,
                "preview": "\n".join(preview_lines)
            })

    # Sort by match count
    relevant_items.sort(key=lambda x: x["matches"], reverse=True)

    if not relevant_items:
        return "[No matching notes found]"

    # Build context
    context_parts = []
    for item in relevant_items[:5]:  # Top 5 matches
        context_parts.append(f"=== {item['path']} ===\n{item['preview']}\n")

    return "\n".join(context_parts)


def search_notes_semantic(query: str) -> str:
    """
    Semantic search across all notes using embeddings stored in Chroma.
    Same output shape as search_notes() so it's a drop-in swap for evaluation.
    """
    if not CHROMA_DIR.exists():
        return "[No Chroma index found — run scripts/embed.py first]"

    openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    chroma_client = chromadb.PersistentClient(path=str(CHROMA_DIR))
    collection = chroma_client.get_or_create_collection(name=COLLECTION_NAME)

    query_embedding = openai_client.embeddings.create(
        model=EMBEDDING_MODEL, input=[query]
    ).data[0].embedding

    results = collection.query(query_embeddings=[query_embedding], n_results=5)

    if not results["ids"] or not results["ids"][0]:
        return "[No matching notes found]"

    context_parts = []
    for doc, meta in zip(results["documents"][0], results["metadatas"][0]):
        source_path = meta.get("source_file", "unknown")
        context_parts.append(f"=== {source_path} ===\n{doc}\n")

    return "\n".join(context_parts)


def chat():
    """
    Main chat loop.
    """
    print("\n🧠 Personal Knowledge Retriever")
    print("─" * 50)
    print("Ask me anything about your saved notes.")
    print("Type 'quit' to exit.\n")
    
    conversation_history = []
    
    while True:
        user_input = input("You: ").strip()
        
        if user_input.lower() in ["quit", "exit", "q"]:
            print("\nGoodbye!")
            break
        
        if not user_input:
            continue
        
        # Search for relevant notes
        retrieved_context = search_notes(user_input)
        
        # Build the message with retrieved context
        context_message = f"""
RETRIEVED NOTES (relevant to this query):
{retrieved_context}

USER QUERY:
{user_input}

---

Please respond based on the retrieved notes above. If no relevant notes exist, say so clearly.
"""
        
        # Add to conversation
        conversation_history.append({
            "role": "user",
            "content": context_message
        })
        
        # Call Claude
        try:
            response = client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=1024,
                system=SYSTEM_PROMPT,
                messages=conversation_history
            )
            
            assistant_message = response.content[0].text
            conversation_history.append({
                "role": "assistant",
                "content": assistant_message
            })
            
            print(f"\nAssistant: {assistant_message}\n")
        
        except anthropic.APIError as e:
            print(f"\nERROR: {e}\n")
            # Remove the last user message if API call failed
            conversation_history.pop()


if __name__ == "__main__":
    chat()
