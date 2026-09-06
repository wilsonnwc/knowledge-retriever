#!/usr/bin/env python3
"""
Personal Knowledge Retriever — Embedding generation

Chunks every note (scripts/chunking.py), embeds each chunk with OpenAI's
text-embedding-3-small, and stores them in a local Chroma collection.

Chunk IDs are deterministic: "<relative file path>::<chunk index>". Running
this script again re-embeds and upserts (overwrites) rather than duplicating,
so it's safe to re-run after editing notes or changing the chunking rule.
"""

import os
import sys
from pathlib import Path

import chromadb
from dotenv import load_dotenv
from openai import OpenAI

sys.path.insert(0, str(Path(__file__).parent))
from chunking import chunk_all_notes, chunk_note
from config import NOTES_DIR, CHROMA_DIR, COLLECTION_NAME, EMBEDDING_MODEL

load_dotenv()


def get_openai_client() -> OpenAI:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("ERROR: OPENAI_API_KEY not found in .env")
        sys.exit(1)
    return OpenAI(api_key=api_key)


def get_chroma_collection():
    client = chromadb.PersistentClient(path=str(CHROMA_DIR))
    return client.get_or_create_collection(name=COLLECTION_NAME)


def chunk_text_for_embedding(chunk) -> str:
    """
    What actually gets embedded: note title + author (when present) +
    section title (if any) + chunk body. Title/author used to be left out
    as pure metadata (like dates/tags), on the reasoning that they're
    identifiers, not semantic content a query would match on — but a name
    is exactly what a real query like "what does Teresa Torres say about
    X" or "what about Teresa Torres" matches on. That query only worked
    for notes whose body happened to restate the author's name in prose
    (e.g. Marty Cagan's), and silently failed for notes where the name
    only ever appeared in frontmatter (e.g. Teresa Torres's "Continuous
    Discovery Habits") — retrieval-by-author was luck, not a designed
    capability. Prepending title/author gives every chunk that signal
    regardless of body wording.
    """
    fm = chunk.frontmatter
    title = fm.get("title") or fm.get("source") or ""
    author = fm.get("author", "")

    header_lines = [line for line in (
        f"Title: {title}" if title else "",
        f"Author: {author}" if author else "",
        chunk.section_title,
    ) if line]

    if not header_lines:
        return chunk.text
    return "\n".join(header_lines) + f"\n\n{chunk.text}"


def embed_all_notes():
    print("Chunking notes...")
    chunks = chunk_all_notes(NOTES_DIR)
    print(f"  {len(chunks)} chunks from {len(set(c.source_file for c in chunks))} notes")

    openai_client = get_openai_client()
    collection = get_chroma_collection()

    ids = []
    embedding_inputs = []  # title/author-prefixed text — embedded for retrieval signal only
    documents = []          # original chunk body — what a citation actually shows back
    metadatas = []
    for c in chunks:
        by_file_index = sum(1 for prior in ids if prior.startswith(f"{c.source_file}::"))
        ids.append(f"{c.source_file}::{by_file_index}")
        embedding_inputs.append(chunk_text_for_embedding(c))
        documents.append(c.text)
        metadatas.append({
            "source_file": c.source_file,
            "section_title": c.section_title,
            **{k: v for k, v in c.frontmatter.items() if v},
        })

    print(f"Generating embeddings via {EMBEDDING_MODEL}...")
    response = openai_client.embeddings.create(model=EMBEDDING_MODEL, input=embedding_inputs)
    embeddings = [d.embedding for d in response.data]

    print(f"Upserting {len(ids)} chunks into Chroma collection '{COLLECTION_NAME}'...")
    collection.upsert(ids=ids, embeddings=embeddings, documents=documents, metadatas=metadatas)

    print(f"Done. Collection now has {collection.count()} chunks.")


def delete_note_embeddings(note_id: str):
    """Removes one note's chunks from the collection. This is a local
    metadata-filtered delete, not an API call — no OpenAI cost, so there's
    no reason to batch/delay it (unlike re-embedding, which does cost)."""
    collection = get_chroma_collection()
    collection.delete(where={"source_file": note_id})


def embed_single_note(note_id: str):
    """Re-embeds one note (e.g. after restoring it from trash) without
    touching the rest of the collection — cheaper than a full rebuild."""
    file_path = NOTES_DIR / note_id
    chunks = chunk_note(file_path, NOTES_DIR)
    if not chunks:
        return

    openai_client = get_openai_client()
    collection = get_chroma_collection()

    ids, embedding_inputs, documents, metadatas = [], [], [], []
    for i, c in enumerate(chunks):
        ids.append(f"{c.source_file}::{i}")
        embedding_inputs.append(chunk_text_for_embedding(c))
        documents.append(c.text)
        metadatas.append({
            "source_file": c.source_file,
            "section_title": c.section_title,
            **{k: v for k, v in c.frontmatter.items() if v},
        })

    response = openai_client.embeddings.create(model=EMBEDDING_MODEL, input=embedding_inputs)
    embeddings = [d.embedding for d in response.data]
    collection.upsert(ids=ids, embeddings=embeddings, documents=documents, metadatas=metadatas)


if __name__ == "__main__":
    embed_all_notes()
