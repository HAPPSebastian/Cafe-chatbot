export type Document = { id: string; text: string };
export type SearchResult = Document & { score: number };
export type Embed = (texts: string[]) => Promise<number[][]>;

function normalize(vector: number[]): number[] {
  const magnitude = Math.hypot(...vector);
  if (!vector.length || !vector.every(Number.isFinite) || magnitude === 0) {
    throw new Error('Embedding must be a nonzero vector of finite numbers.');
  }
  return vector.map(function normalizeValue(value) {
    return value / magnitude;
  });
}

export class VectorStore {
  private readonly documents: Document[];
  private readonly vectors: number[][];
  private readonly embed: Embed;

  private constructor(documents: Document[], vectors: number[][], embed: Embed) {
    this.documents = documents;
    this.vectors = vectors;
    this.embed = embed;
  }

  static async create(documents: readonly Document[], embed: Embed): Promise<VectorStore> {
    if (!documents.length) throw new Error('Knowledge must contain at least one document.');
    const texts = documents.map(function getText(document) {
      return document.text;
    });
    const embeddings = await embed(texts);
    const vectors = embeddings.map(normalize);
    const dimension = vectors[0]?.length;
    if (vectors.length !== documents.length || vectors.some(function hasDifferentDimension(vector) {
      return vector.length !== dimension;
    })) {
      throw new Error('Embedding count or dimensions do not match the documents.');
    }
    return new VectorStore([...documents], vectors, embed);
  }

  async search(query: string): Promise<SearchResult[]> {
    const embeddings = await this.embed([query]);
    if (embeddings.length !== 1 || !embeddings[0]) throw new Error('Expected one query embedding.');
    const queryVector = normalize(embeddings[0]);
    if (queryVector.length !== this.vectors[0]?.length) throw new Error('Embedding dimensions differ.');
    const results: SearchResult[] = [];
    for (let index = 0; index < this.documents.length; index++) {
      const document = this.documents[index]!;
      const vector = this.vectors[index]!;
      let score = 0;
      for (let i = 0; i < vector.length; i++) {
        score += vector[i]! * queryVector[i]!;
      }
      results.push({ ...document, score: score });
    }
    results.sort(function compareScores(a, b) {
      return b.score - a.score;
    });
    return results.slice(0, 3);
  }
}
