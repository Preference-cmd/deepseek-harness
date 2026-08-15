# Programmatic Usage Examples

## Direct Service Usage

```typescript
import {
  createSearchIndex,
  buildIndex,
  searchTools,
} from "@deepseek-ai/dsh-tool-search";

// Create search index
const index = createSearchIndex();

// Build index from tools
await buildIndex(tools);

// Search for tools
const results = await searchTools(
  {
    query: "search the web",
    limit: 5,
    method: "hybrid",
  },
  index,
  toolsMap,
  config,
);

console.log(
  "Found tools:",
  results.map((r) => r.tool.name),
);
```

## Custom Embedding Function

```typescript
import { buildIndex } from "@deepseek-ai/dsh-tool-search";

// Custom embedding function using OpenAI embeddings
async function openAIEmbedding(text: string): Promise<number[]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-ada-002",
      input: text,
    }),
  });

  const data = await response.json();
  return data.data[0].embedding;
}

// Use custom embedding function
await buildIndex(tools, openAIEmbedding);
```
