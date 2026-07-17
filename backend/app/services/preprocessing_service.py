import re
import unicodedata


class PreprocessingService:
    """
    Cleans and normalizes user queries before they hit Rasa, RAG, or the LLM.

    What it does:
    - Strips extra whitespace and normalises unicode
    - Expands common English contractions
    - Removes non-informative punctuation clutter
    - Lowercases for downstream matching (returns both raw and cleaned)
    """

    # Common contractions → expanded forms
    CONTRACTIONS = {
        r"\bwon't\b": "will not",
        r"\bcan't\b": "cannot",
        r"\bshan't\b": "shall not",
        r"\bn't\b": " not",
        r"\b're\b": " are",
        r"\b've\b": " have",
        r"\b'll\b": " will",
        r"\b'd\b": " would",
        r"\b'm\b": " am",
        r"\bi'm\b": "i am",
        r"\blet's\b": "let us",
        r"\bwhat's\b": "what is",
        r"\bthat's\b": "that is",
        r"\bthere's\b": "there is",
        r"\bhere's\b": "here is",
        r"\bhow's\b": "how is",
        r"\bwho's\b": "who is",
        r"\bwhere's\b": "where is",
        r"\bwhen's\b": "when is",
        r"\bwhy's\b": "why is",
        r"\bit's\b": "it is",
    }

    # Common misspellings / Indian English variations
    SPELLING_FIXES = {
        r"\bpls\b": "please",
        r"\bplz\b": "please",
        r"\bu\b": "you",
        r"\bur\b": "your",
        r"\br\b": "are",
        r"\bk\b": "okay",
        r"\bthnx\b": "thanks",
        r"\bthx\b": "thanks",
        r"\bgud\b": "good",
        r"\bbt\b": "but",
        r"\babt\b": "about",
        r"\bwat\b": "what",
        r"\bwhr\b": "where",
        r"\bwhn\b": "when",
        r"\bhv\b": "have",
        r"\bhw\b": "how",
        r"\btel\b": "tell",
        r"\binfo\b": "information",
    }

    def clean(self, text: str) -> str:
        """
        Returns a cleaned version of the input text.
        The original casing is preserved for Rasa entity extraction;
        only structural cleanup is done here.
        """
        if not text or not text.strip():
            return ""

        # Normalize unicode (e.g. smart quotes → ASCII)
        text = unicodedata.normalize("NFKD", text)

        # Collapse multiple spaces / tabs / newlines into single space
        text = re.sub(r"\s+", " ", text).strip()

        # Remove purely decorative repeated punctuation (???, !!!, ...)
        text = re.sub(r"([?!.]){2,}", r"\1", text)

        return text

    def normalize(self, text: str) -> str:
        """
        Returns a fully normalized version: lowercased, contractions
        expanded, common abbreviations fixed. Use this for RAG retrieval
        and LLM context — NOT for Rasa (Rasa needs closer-to-original text).
        """
        cleaned = self.clean(text)
        if not cleaned:
            return ""

        lowered = cleaned.lower()

        # Expand contractions
        for pattern, replacement in self.CONTRACTIONS.items():
            lowered = re.sub(pattern, replacement, lowered, flags=re.IGNORECASE)

        # Fix common abbreviations / misspellings
        for pattern, replacement in self.SPELLING_FIXES.items():
            lowered = re.sub(pattern, replacement, lowered, flags=re.IGNORECASE)

        # Final whitespace cleanup
        lowered = re.sub(r"\s+", " ", lowered).strip()

        return lowered


preprocessing_service = PreprocessingService()