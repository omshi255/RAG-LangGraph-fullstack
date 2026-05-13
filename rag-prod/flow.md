Flow 1 — Retrieval Pipeline
1. Semantic Cache (Cosine similarity, in-memory)

Jab query aati hai, pehle check karta hai ki same/similar query pehle puchi gayi thi kya
Agar cache hit → seedha END, no processing needed ⚡

2. Query Rewriter (HyDE + step-back via Groq)

Original query ko better banata hai retrieval ke liye
HyDE = hypothetical document generate karta hai jo answer jaisa hoga
Step-back = broader question banata hai better context ke liye

3. Hybrid Retriever (Pinecone + BM25 → Top 20)

Pinecone = semantic/vector search (meaning-based)
BM25 = keyword-based search
Dono combine karke top 20 docs laata hai

4. Cohere Reranker (Top 20 → Top 5)

Neural model se 20 docs ko relevance ke basis pe sort karke sirf top 5 rakhta hai


Flow 2 — Self-Correction Loop
5. Generate (Groq llama-3.3-70b)

Top 5 docs ke basis pe answer generate karta hai

6. Hallucination Grader

Check karta hai — kya answer context mein grounded hai?

7. Answer Grader

Check karta hai — kya answer actually question ka jawab de raha hai?

8. Grader Router (Decision point)

Both pass → Finalize (cache mein save karo → END) ✅
Hallucination fail → Regenerate (stricter prompt se dobara)
Answer fail → Rewrite + Retrieve (naya query + naye docs)
Max 3 retries ke baad force finalize