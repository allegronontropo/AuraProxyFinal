# Implement Fallback Traceability

The user requested the ability to trace fallbacks. Specifically, two features:
1. The **Playground UI** should explicitly indicate when a response was served by a fallback provider instead of the primary provider.
2. The **Dashboard** (Routing Page or Overview) should display a table of fallback logs, allowing the user to see when fallbacks occurred, what the original request was, and which fallback provider eventually succeeded.

## User Review Required

> [!NOTE]
> Please review this plan. I will be modifying the `CostTrackerDecorator` to properly save fallback metadata into the `RequestLog` table, and I will be building a new UI component to display these traces.

## Proposed Changes

### Backend (Proxy)

#### [MODIFY] [cost-tracker.decorator.ts](file:///c:/Users/badri/Downloads/AuraProxyFinal/apps/proxy/src/decorators/cost-tracker.decorator.ts)
- Update `recordLog` signature to accept an optional `metadata` parameter.
- Pass `data.metadata` to `prisma.requestLog.create`.
- In the `chat()` method, extract `(response as any).metadata` and pass it to `this.recordLog()`.
- (For streaming, the metadata is not currently yielded by `ChatService`, but I will ensure it captures it if present).

### Frontend (Dashboard)

#### [MODIFY] [PlaygroundClient.tsx](file:///c:/Users/badri/Downloads/AuraProxyFinal/apps/dashboard/src/components/dashboard/PlaygroundClient.tsx)
- The proxy returns the final `provider` in its response. The Playground knows the *requested* provider from the dropdown. 
- If the response succeeds but `responseProvider !== requestedProvider`, we will show a subtle badge (e.g., `Fallback: Groq`) next to the response or model name.

#### [NEW] [fallback-logs.ts](file:///c:/Users/badri/Downloads/AuraProxyFinal/apps/dashboard/src/actions/fallback-logs.ts)
- Create a server action `getFallbackLogs(projectId: string, limit?: number)` that queries Prisma for `RequestLog` records where `metadata` contains `fallback_provider`.

#### [NEW] [FallbackLogsTable.tsx](file:///c:/Users/badri/Downloads/AuraProxyFinal/apps/dashboard/src/components/dashboard/FallbackLogsTable.tsx)
- Create a UI table specifically designed to show fallback events.
- Columns: Date, API Key, Primary Provider, Requested Model, Fallback Provider, Latency, Status.
- Use a design consistent with `Aura-Brand` (glassmorphism, clean typography, dark theme).

#### [MODIFY] [RoutingSection.tsx](file:///c:/Users/badri/Downloads/AuraProxyFinal/apps/dashboard/src/components/dashboard/RoutingSection.tsx)
- Import and render `<FallbackLogsTable />` at the bottom of the routing section so users can immediately see the results of their routing configurations.

## Verification Plan

### Automated Tests
- No new automated tests are required for this UI addition.

### Manual Verification
- We will trigger a fallback request in the playground (e.g. by setting an invalid OpenAI API key but keeping a valid Groq key).
- We will verify that the Playground UI displays the fallback badge.
- We will navigate to the Routing page and verify that the fallback event appears in the new `Fallback Logs` table.
