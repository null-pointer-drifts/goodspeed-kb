import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';
import { ChunkingService } from './chunking.service';
import { IngestionService } from './ingestion.service';
import { OpenAICompatibleProvider } from './providers/openai-compatible.provider';
import { AI_PROVIDER } from './providers/ai-provider.interface';

/**
 * To add a new provider:
 * 1. Implement IAiProvider in a new file under providers/
 * 2. Add a case for it here
 * 3. Set AI_PROVIDER=your-provider in .env
 */
const aiProviderFactory = {
  provide: AI_PROVIDER,
  useFactory: (config: ConfigService) => {
    const provider = config.get('AI_PROVIDER', 'openai');

    switch (provider) {
      case 'openai':
      case 'groq':
      case 'together':
      case 'openrouter':
      case 'ollama':
        // All these providers follow the OpenAI API spec —
        // only AI_BASE_URL, AI_MODEL, and AI_API_KEY differ
        return new OpenAICompatibleProvider(config);
      default:
        throw new Error(
          `Unknown AI provider "${provider}". ` +
          `Supported: openai, groq, together, openrouter, ollama`,
        );
    }
  },
  inject: [ConfigService],
};

@Module({
  providers: [aiProviderFactory, AiService, ChunkingService, IngestionService],
  exports: [AiService, IngestionService],
})
export class AiModule {}
