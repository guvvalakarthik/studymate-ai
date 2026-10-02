export type KnowledgeEntry = {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
};

export const knowledgeBase: KnowledgeEntry[] = [
  {
    id: "ai-basics",
    title: "AI and Machine Learning basics",
    category: "AI",
    content:
      "Artificial Intelligence is the field focused on creating systems that can perform tasks that normally require human intelligence. Machine Learning is a subset that trains models on data to learn patterns. Neural networks are computational models inspired by biological neurons and are used in speech recognition, vision, and recommendation systems. A strong AI workflow involves data collection, preprocessing, model training, evaluation, and deployment.",
    tags: ["ai", "machine learning", "neural network", "model", "training"],
  },
  {
    id: "study-methods",
    title: "Effective study techniques",
    category: "Learning",
    content:
      "Active recall, spaced repetition, and interleaving are powerful study methods. Active recall means retrieving information from memory without notes, which improves long-term retention. Spaced repetition revisits material after increasing intervals, while interleaving mixes different topics to improve transfer and discrimination. Students should summarize concepts in their own words and solve practice problems to reinforce understanding.",
    tags: ["study", "revision", "recall", "spaced repetition", "interleaving"],
  },
  {
    id: "python-fundamentals",
    title: "Python fundamentals for AI",
    category: "Programming",
    content:
      "Python is widely used in AI because of its readable syntax and large ecosystem of libraries such as NumPy, pandas, PyTorch, and scikit-learn. Fundamental concepts include variables, data types, functions, control flow, loops, classes, and modules. For data science and AI, understanding lists, dictionaries, arrays, and file handling is critical before moving to model training and experimentation.",
    tags: ["python", "programming", "data structures", "functions", "libraries"],
  },
  {
    id: "rag-overview",
    title: "Retrieval-Augmented Generation",
    category: "AI Systems",
    content:
      "Retrieval-Augmented Generation, or RAG, combines an information retrieval system with a language model. The system searches a knowledge base or document collection for relevant context, then provides that context to the model so the final response is grounded in evidence. This reduces hallucinations, improves factuality, and allows the chatbot to answer questions about documents, notes, and course materials more accurately.",
    tags: ["rag", "retrieval", "knowledge base", "grounding", "hallucination"],
  },
  {
    id: "edtech-support",
    title: "Ed-Tech learning support",
    category: "Education",
    content:
      "An educational AI assistant should explain concepts in simple language, support different learning styles, and adapt to the learner's level. Good responses include examples, analogies, step-by-step guidance, and short quizzes or practice prompts. For image-based learning, the assistant can analyze diagrams, equations, handwritten notes, or textbook pages and explain them in a learner-friendly way.",
    tags: ["education", "assistant", "learning", "diagram", "support"],
  },
  {
    id: "llm-prompting",
    title: "Prompting and model behavior",
    category: "AI Engineering",
    content:
      "Effective prompting gives the model context, clear instructions, and examples of desired output. When building AI products, prompts should specify the tone, constraints, response format, and the audience. Better prompts reduce ambiguity and improve reliability. For educational use cases, instructions can ask for concise explanations, bullet points, and step-by-step solutions with checklists for understanding.",
    tags: ["prompting", "llm", "instructions", "output format", "reliability"],
  },
];

export function retrieveRelevantContext(query: string) {
  const normalized = query.toLowerCase();

  const scored = knowledgeBase
    .map((entry) => {
      const searchableText = `${entry.title} ${entry.content} ${entry.tags.join(" ")}`.toLowerCase();
      const score = entry.tags.reduce((total, tag) => {
        return total + (normalized.includes(tag.toLowerCase()) ? 2 : 0);
      }, 0);

      const titleBoost = searchableText.includes(normalized) ? 5 : 0;
      const directMatch = searchableText.split(/\s+/).filter((word) => word.length > 3).some((word) => normalized.includes(word));

      return {
        entry,
        score: score + titleBoost + (directMatch ? 2 : 0),
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (scored.length === 0) {
    return "No highly relevant course context matched. Respond generally while keeping the answer educational, accurate, and concise.";
  }

  return scored
    .map(({ entry }) => `Source: ${entry.title} (${entry.category})\n${entry.content}`)
    .join("\n\n");
}
