from app.services.llm import llm

class HallucinationGrader:
    def grade(self, answer: str, chunks: list[str]) -> bool:
        context = "\n\n".join(chunks)
        system = (
            "You are a hallucination grader. "
            "Reply ONLY 'yes' if the answer is fully grounded in the context, else 'no'."
        )
        result = llm.chat(system, f"CONTEXT:\n{context}\n\nANSWER:\n{answer}")
        return result.strip().lower().startswith("yes")

class AnswerGrader:
    def grade(self, question: str, answer: str) -> bool:
        system = (
            "You are an answer quality grader. "
            "Reply ONLY 'yes' if the answer addresses the question, else 'no'."
        )
        result = llm.chat(system, f"QUESTION:\n{question}\n\nANSWER:\n{answer}")
        return result.strip().lower().startswith("yes")

hallucination_grader = HallucinationGrader()
answer_grader        = AnswerGrader()
