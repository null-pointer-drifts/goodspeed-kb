import { Injectable } from '@nestjs/common';

const CHUNK_SIZE = 500;   // characters
const CHUNK_OVERLAP = 50; // characters

@Injectable()
export class ChunkingService {
  chunk(text: string): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + CHUNK_SIZE, text.length);
      chunks.push(text.slice(start, end).trim());
      if (end === text.length) break;
      start += CHUNK_SIZE - CHUNK_OVERLAP;
    }

    return chunks.filter((c) => c.length > 0);
  }
}
