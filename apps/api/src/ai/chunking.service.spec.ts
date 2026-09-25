import { ChunkingService } from './chunking.service';

describe('ChunkingService', () => {
  let service: ChunkingService;

  beforeEach(() => {
    service = new ChunkingService();
  });

  it('returns empty array for empty string', () => {
    expect(service.chunk('')).toEqual([]);
  });

  it('returns single chunk for short text', () => {
    const text = 'Hello world';
    const result = service.chunk(text);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(text);
  });

  it('splits text longer than chunk size', () => {
    const text = 'a'.repeat(1100);
    const result = service.chunk(text);
    expect(result.length).toBeGreaterThan(1);
  });

  it('each chunk does not exceed 500 characters', () => {
    const text = 'word '.repeat(300); // 1500 chars
    const result = service.chunk(text);
    result.forEach((chunk) => {
      expect(chunk.length).toBeLessThanOrEqual(500);
    });
  });

  it('produces overlapping chunks', () => {
    const text = 'a'.repeat(600);
    const result = service.chunk(text);
    expect(result.length).toBeGreaterThanOrEqual(2);
    // Second chunk should start before where first chunk ended (overlap)
    const firstChunkEnd = 500;
    const overlap = 50;
    const secondChunkStart = firstChunkEnd - overlap;
    expect(result[1]).toBe(text.slice(secondChunkStart, secondChunkStart + 500).trim());
  });

  it('filters out empty chunks', () => {
    const text = '   ';
    const result = service.chunk(text);
    expect(result).toEqual([]);
  });

  it('handles text exactly at chunk size boundary', () => {
    const text = 'a'.repeat(500);
    const result = service.chunk(text);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(text);
  });
});
