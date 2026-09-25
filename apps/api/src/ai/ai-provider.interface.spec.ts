import { IAiProvider } from './providers/ai-provider.interface';

// Verify the provider interface contract is satisfied by a mock
class MockProvider implements IAiProvider {
  async chat(): Promise<string> { return 'response'; }
  async embed(): Promise<number[]> { return [0.1, 0.2]; }
  async embedBatch(texts: string[]): Promise<number[][]> {
    return texts.map(() => [0.1, 0.2]);
  }
}

describe('IAiProvider interface', () => {
  let provider: IAiProvider;

  beforeEach(() => {
    provider = new MockProvider();
  });

  it('chat returns a string', async () => {
    const result = await provider.chat([], 'system');
    expect(typeof result).toBe('string');
  });

  it('embed returns a number array', async () => {
    const result = await provider.embed('text');
    expect(Array.isArray(result)).toBe(true);
    expect(typeof result[0]).toBe('number');
  });

  it('embedBatch returns array of arrays', async () => {
    const result = await provider.embedBatch(['a', 'b']);
    expect(result).toHaveLength(2);
    result.forEach((emb) => {
      expect(Array.isArray(emb)).toBe(true);
    });
  });
});
