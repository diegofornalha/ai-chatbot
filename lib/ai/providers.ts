import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { xai } from '@ai-sdk/xai';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';
import { isTestEnvironment } from '../constants';
import { claudeSDK } from './providers/claude-sdk';

// Configuração do Claude SDK Provider
const claudeSDKProvider = claudeSDK({
  apiUrl: process.env.NEXT_PUBLIC_CLAUDE_SDK_API_URL || 
         process.env.CLAUDE_SDK_API_URL || 
         'http://127.0.0.1:8002'
});

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
        'claude-code-sdk': claudeSDKProvider.languageModel('claude-code-sdk'),
      },
    })
  : customProvider({
      languageModels: {
        'chat-model': xai('grok-2-vision-1212'),
        'chat-model-reasoning': wrapLanguageModel({
          model: xai('grok-3-mini-beta'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': xai('grok-2-1212'),
        'artifact-model': xai('grok-2-1212'),
        'claude-code-sdk': claudeSDKProvider.languageModel('claude-code-sdk'),
      },
      imageModels: {
        'small-model': xai.imageModel('grok-2-image'),
      },
    });
