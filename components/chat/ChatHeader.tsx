'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw, Trash2, Bot, DollarSign, Activity } from 'lucide-react';
import type { Session } from '@/lib/stores/chatStore';

interface ChatHeaderProps {
  activeSession: Session | null;
  metrics: {
    totalTokens: number;
    totalCost: number;
    messageCount: number;
  };
  onNewSession: () => void;
  onClearSession: () => void;
  onExportSession: () => void;
}

export function ChatHeader({
  activeSession,
  metrics,
  onNewSession,
  onClearSession,
  onExportSession,
}: ChatHeaderProps) {
  return (
    <div className="border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bot className="size-6 text-primary" />
          <div>
            <h2 className="text-lg font-semibold">
              {activeSession?.title || 'Nova Conversa'}
            </h2>
            {activeSession && (
              <p className="text-xs text-muted-foreground">
                ID: {activeSession.id.slice(0, 8)}...
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Metrics */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Activity className="size-4" />
              <span>{metrics.totalTokens.toLocaleString()} tokens</span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="size-4" />
              <span>${metrics.totalCost.toFixed(4)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onExportSession}
              disabled={!activeSession}
              title="Exportar sessão"
            >
              <Download className="size-5" />
            </Button>

            {activeSession && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClearSession}
                title="Limpar sessão"
              >
                <Trash2 className="size-5" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={onNewSession}
              title="Nova sessão"
            >
              <RefreshCw className="size-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}