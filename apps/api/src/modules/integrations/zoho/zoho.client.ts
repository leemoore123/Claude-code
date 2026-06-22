import { Injectable, Logger } from '@nestjs/common';

export type ZohoService = 'crm' | 'books' | 'sign' | 'inventory' | 'fsm';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  body?: unknown;
}

/**
 * Region-aware, rate-limit-aware wrapper for all Zoho API calls. Every outbound
 * request to any Zoho service goes through here so token refresh, throttling and
 * 429 backoff live in ONE place — never call Zoho from a request handler.
 *
 * Phase 4 fills in: encrypted token load/refresh from ZohoConnection, a token
 * bucket per service, and exponential backoff on 429/5xx (driven by BullMQ).
 */
@Injectable()
export class ZohoClient {
  private readonly logger = new Logger(ZohoClient.name);

  /** apiDomain is persisted per connection (.com / .eu / .sa) — never hard-coded. */
  async request<T>(service: ZohoService, _opts: RequestOptions): Promise<T> {
    this.logger.debug(`Zoho ${service} request — live transport lands in Phase 4`);
    throw new Error('ZohoClient transport not yet implemented (Phase 4)');
  }

  /** Builds the region-aware OAuth authorize URL for the connect flow. */
  authorizeUrl(params: { clientId: string; redirectUri: string; scope: string; accountsDomain: string }): string {
    const u = new URL('/oauth/v2/auth', params.accountsDomain);
    u.searchParams.set('response_type', 'code');
    u.searchParams.set('access_type', 'offline');
    u.searchParams.set('client_id', params.clientId);
    u.searchParams.set('redirect_uri', params.redirectUri);
    u.searchParams.set('scope', params.scope);
    return u.toString();
  }
}
