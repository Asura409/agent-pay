Autonomous economy for AI agents. 

# AgentPay Mesh

> **A coordination and settlement layer for autonomous agents.**

AgentPay Mesh enables specialized AI agents to discover services, delegate work, negotiate service costs, and settle machine-to-machine payments on-chain.

The core idea is simple:

```text
Agents should not merely call each other.

They should be able to form economic relationships.
```

A research agent may need pricing data. A pricing agent may require compensation for producing it. A risk agent may consume both research and pricing outputs before authorizing execution.

AgentPay Mesh provides the coordination primitives required to make that interaction observable and economically meaningful:

```text
discover → request → quote → authorize → settle → execute → attest
```

The result is a system in which agents can operate as **service providers and service consumers**, rather than as a fixed collection of functions behind a single orchestrator.

---

## Why

Most multi-agent systems stop at coordination.

```text
Agent A
   │
   │ RPC / message
   ▼
Agent B
   │
   │ result
   ▼
Agent A
```

This works when every agent belongs to the same application and is controlled by the same operator.

It becomes less useful when agents are independently deployed, expose different capabilities, or provide services that have economic value.

AgentPay Mesh extends the interaction:

```text
Agent A
   │
   │ discover capability
   ▼
Agent Registry
   │
   │ select provider
   ▼
Agent B
   │
   │ quote
   ▼
Payment Authorization
   │
   │ settlement
   ▼
Monad
   │
   │ payment confirmation
   ▼
Agent B
   │
   │ execute service
   ▼
Result
```

The goal is to answer four questions:

1. **Can the machine coordinate itself?**
2. **Can agents cooperate autonomously?**
3. **Can one agent pay another for work?**
4. **Can a human understand what happened?**

---

# System Overview

AgentPay Mesh has four primary layers.

```text
┌──────────────────────────────────────────────────────────┐
│                         PRODUCT                          │
│                                                          │
│  Task input · Agent graph · Event stream · Settlement    │
│  history · Transaction visibility                        │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│                      COORDINATION                        │
│                                                          │
│  Task orchestration · Agent protocol · Service discovery │
│  Lifecycle management · Event routing                    │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│                       INTELLIGENCE                       │
│                                                          │
│  Research · Pricing · Risk · Execution · Reporting       │
│                                                          │
│  Reasoning · Tool calling · Delegation · Agent state     │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│                        SETTLEMENT                        │
│                                                          │
│  Agent identity · Wallets · Quotes · Payments · Receipts │
│                     Monad integration                   │
└──────────────────────────────────────────────────────────┘
```

Each layer has a deliberately narrow responsibility.

The frontend does not decide how agents cooperate.

The orchestrator does not own agent reasoning.

Agents do not directly implement chain-specific transaction logic.

The settlement layer does not decide which agent should perform a task.

---

# The Core Model

An agent is represented conceptually as:

```text
Agent
├── identity
├── capabilities
├── endpoint
├── wallet
├── state
└── policy
```

For example:

```text
Research Agent
├── capability: market_research
├── capability: opportunity_discovery
└── wallet: 0x...

Pricing Agent
├── capability: yield_pricing
├── capability: fee_estimation
└── wallet: 0x...

Risk Agent
├── capability: risk_analysis
├── capability: protocol_scoring
└── wallet: 0x...

Execution Agent
├── capability: execution_planning
└── wallet: 0x...
```

An agent should not need to know the implementation details of every other agent.

It asks for a **capability**.

The mesh resolves a provider.

---

# Example: Agent-to-Agent Service Purchase

Consider the task:

```text
Find the best yield opportunity.
```

The system may execute the following flow.

```text
User
 │
 ▼
Task
 │
 ▼
Research Agent
 │
 │ "I need yield pricing."
 ▼
Service Discovery
 │
 ▼
Pricing Agent
 │
 │ "This service costs 0.002 MON."
 ▼
Quote
 │
 ▼
Payment Authorization
 │
 ▼
Monad Settlement
 │
 │ ✓ confirmed
 ▼
Pricing Agent
 │
 │ performs service
 ▼
Pricing Result
 │
 ▼
Risk Agent
 │
 ▼
Execution Agent
 │
 ▼
Final Result
```

The important distinction is that the payment is associated with a **specific service interaction**.

A transfer is not just:

```text
Agent A → Agent B → money
```

It is:

```text
service_request
       │
       ▼
service_quote
       │
       ▼
payment_authorization
       │
       ▼
payment_settlement
       │
       ▼
service_execution
       │
       ▼
service_result
```

Every stage is correlated through shared identifiers.

---

# Architecture

```text
                              ┌───────────────┐
                              │   Frontend    │
                              │               │
                              │ Agent Graph   │
                              │ Event Stream  │
                              │ Payments      │
                              └───────┬───────┘
                                      │
                         REST / WebSocket / SSE
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────────┐
│                         CONTROL PLANE                        │
│                                                              │
│                       Orchestrator                           │
│                                                              │
│  Task Lifecycle · Routing · Protocol · Events · Recovery     │
└───────────────┬──────────────────────┬───────────────────────┘
                │                      │
                ▼                      ▼
       ┌────────────────┐     ┌────────────────┐
       │ Agent Registry │     │ Event Stream   │
       │                │     │                │
       │ Capabilities   │     │ agent.started  │
       │ Endpoints      │     │ payment.*      │
       │ Identity       │     │ task.*         │
       └───────┬────────┘     └────────────────┘
               │
               ▼
    ┌──────────────────────────────────────────┐
    │                AGENT MESH                │
    │                                          │
    │   Research ─────► Pricing                │
    │       │              │                   │
    │       │              ▼                   │
    │       │             Risk                 │
    │       │              │                   │
    │       └──────────────┼──────────►        │
    │                      ▼                   │
    │                  Execution               │
    └──────────────────────┬───────────────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │ Payment Service │
                  │                 │
                  │ Quotes          │
                  │ Authorization   │
                  │ Receipts        │
                  │ Verification    │
                  └────────┬────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │    Monad    │
                    │             │
                    │ Wallets     │
                    │ Transfers   │
                    │ Settlement  │
                    └─────────────┘
```

---

# Agent Protocol

AgentPay Mesh uses a common message envelope so agents can interact without coupling themselves to one another's internal implementation.

```json
{
  "id": "msg_01HXYZ",
  "task_id": "task_01HXYZ",
  "request_id": "req_01HXYZ",
  "type": "service.request",
  "from": "research-agent",
  "to": "pricing-agent",
  "capability": "yield-pricing",
  "payload": {
    "protocols": ["protocol-a", "protocol-b"]
  },
  "timestamp": "2026-08-22T00:00:00Z"
}
```

The protocol is transport-agnostic.

An implementation may use:

* HTTP
* WebSockets
* queues
* an event bus
* local process communication

The protocol defines the interaction. The transport is an implementation detail.

---

## Message Types

The MVP supports the following lifecycle:

```text
service.request
service.quote
service.accept
payment.requested
payment.confirmed
service.result
service.failed
```

### `service.request`

An agent requests work from another agent.

```json
{
  "type": "service.request",
  "request_id": "req_123",
  "capability": "yield-pricing"
}
```

### `service.quote`

A provider specifies the cost and terms of execution.

```json
{
  "type": "service.quote",
  "request_id": "req_123",
  "amount": "0.002",
  "currency": "MON"
}
```

### `service.accept`

The requester accepts the quote.

```json
{
  "type": "service.accept",
  "request_id": "req_123"
}
```

### `payment.confirmed`

Settlement has been verified.

```json
{
  "type": "payment.confirmed",
  "request_id": "req_123",
  "payment_id": "pay_456",
  "tx_hash": "0x..."
}
```

### `service.result`

The provider returns the result.

```json
{
  "type": "service.result",
  "request_id": "req_123",
  "result": {}
}
```

---

# Agent State Machine

Each service interaction has an explicit lifecycle.

```text
DISCOVERING
     │
     ▼
REQUESTED
     │
     ▼
QUOTED
     │
     ▼
ACCEPTED
     │
     ▼
PAYMENT_PENDING
     │
     ▼
PAYMENT_CONFIRMED
     │
     ▼
EXECUTING
     │
     ├──────────────► FAILED
     │
     ▼
COMPLETED
```

Explicit state matters.

Without it, a system cannot reliably answer questions such as:

* Did the provider receive the request?
* Was the quote accepted?
* Was payment actually settled?
* Did execution begin?
* Did the service complete?
* Which transaction paid for this result?

---

# Service Discovery

Agents discover providers through capabilities rather than hardcoded addresses.

Bad:

```text
pricing-agent = http://pricing-service:8000
```

Better:

```text
capability = yield-pricing
```

The registry resolves:

```json
{
  "capability": "yield-pricing",
  "providers": [
    {
      "agent_id": "pricing-agent",
      "endpoint": "https://...",
      "wallet": "0x..."
    }
  ]
}
```

This allows the system to evolve from a fixed set of agents toward a service mesh.

An agent asks:

> Who can perform this work?

rather than:

> Which hardcoded service should I call?

---

# Payment Model

Payments are bound to service requests.

```text
request_id
    │
    ├── quote
    │
    ├── payer
    │
    ├── payee
    │
    ├── amount
    │
    ├── currency
    │
    └── transaction_hash
```

Conceptually:

```json
{
  "payment_id": "pay_01HXYZ",
  "request_id": "req_01HXYZ",
  "payer": "research-agent",
  "payee": "pricing-agent",
  "amount": "0.002",
  "currency": "MON",
  "status": "confirmed",
  "tx_hash": "0x..."
}
```

The settlement layer is responsible for:

1. constructing the transaction,
2. submitting it to Monad,
3. tracking confirmation,
4. verifying the receipt,
5. emitting a settlement event.

Agents should not need to understand:

* nonce management,
* RPC configuration,
* transaction construction,
* confirmation polling,
* chain-specific errors.

They request an economic action through a stable interface.

---

# System Invariants

These are rules the system should preserve regardless of implementation details.

## 1. No payment without a request

Every payment must reference a valid `request_id`.

```text
payment.request_id → service.request.id
```

## 2. No duplicate settlement

Payment operations must be idempotent.

Retrying:

```text
pay(request_id = req_123)
```

must not create multiple payments for the same authorized obligation.

## 3. No successful result without lifecycle state

A provider cannot silently transition from:

```text
REQUESTED → COMPLETED
```

when payment is required.

The expected path is explicit.

## 4. Settlement must be observable

A successful payment produces a receipt containing at minimum:

```text
payment_id
request_id
payer
payee
amount
currency
tx_hash
status
```

## 5. Agent reasoning is not the source of truth for money

An LLM may decide:

> I should purchase this service.

It must not be the sole authority determining whether funds actually move.

Authorization and settlement are enforced by the payment layer.

---

# Events

AgentPay Mesh is event-driven.

The control plane emits events such as:

```text
task.created
agent.discovered
agent.started
service.requested
service.quoted
service.accepted
payment.requested
payment.submitted
payment.confirmed
service.completed
task.completed
task.failed
```

An example event:

```json
{
  "event": "payment.confirmed",
  "task_id": "task_123",
  "request_id": "req_456",
  "timestamp": "2026-08-22T00:00:00Z",
  "data": {
    "from": "research-agent",
    "to": "pricing-agent",
    "amount": "0.002",
    "currency": "MON",
    "tx_hash": "0x..."
  }
}
```

The frontend consumes this stream to reconstruct the system's behavior in real time.

---

# Demo

The MVP demonstrates one complete economic workflow.

### Input

```text
Find the best yield opportunity.
```

### Execution

```text
1. Task is created

2. Research Agent begins discovery

3. Research Agent requires pricing information

4. Service discovery identifies Pricing Agent

5. Research Agent requests the pricing service

6. Pricing Agent returns a quote

7. Research Agent accepts

8. Payment is initiated

9. MON is settled on Monad

10. Payment confirmation is recorded

11. Pricing Agent executes the requested service

12. Result is returned

13. Risk Agent evaluates the opportunity

14. Execution Agent produces a recommendation

15. Reporting Agent summarizes the outcome
```

The frontend displays the workflow as:

```text
Research Agent
      │
      │ service.request
      ▼
Pricing Agent
      │
      │ quote: 0.002 MON
      ▼
Settlement
      │
      │ transaction confirmed
      ▼
Monad
      │
      ▼
Pricing Agent
      │
      │ service.result
      ▼
Research Agent
```

The objective of the demo is not to show the most agents.

It is to make one complete autonomous economic interaction **unambiguous**.

---

# Repository Structure

```text
agentpay-mesh/
│
├── apps/
│   ├── frontend/               # Task and network visualization
│   ├── orchestrator/           # Task lifecycle and coordination
│   └── registry/               # Capability discovery
│
├── agents/
│   ├── research/
│   ├── pricing/
│   ├── risk/
│   ├── execution/
│   └── reporting/
│
├── packages/
│   ├── protocol/               # Shared message and event schemas
│   ├── agent-sdk/              # Common agent interface
│   └── payment-sdk/            # Settlement abstraction
│
├── blockchain/
│   ├── monad/
│   │   ├── client/
│   │   ├── wallet/
│   │   └── settlement/
│   └── contracts/
│
├── docs/
│   ├── architecture.md
│   ├── protocol.md
│   ├── payment-model.md
│   └── demo.md
│
└── README.md
```

The repository should preserve one important architectural property:

```text
protocol ≠ implementation
```

Agent implementations may change.

LLM providers may change.

The frontend may change.

The blockchain client may change.

The protocol and lifecycle contracts should remain stable.

---

# Team Responsibilities

## Systems / Tech Lead

Owns the question:

> Does the entire machine work?

Responsibilities:

* architecture,
* orchestration,
* protocol boundaries,
* service discovery,
* event routing,
* integration,
* failure handling,
* end-to-end system tests.

Primary deliverable:

```text
One command starts the system and executes the complete demo.
```

---

## Agent Engineer

Owns the question:

> Can agents actually cooperate autonomously?

Responsibilities:

* agent behavior,
* prompts,
* tool calling,
* delegation,
* agent state,
* capability declarations,
* service discovery integration.

Primary deliverable:

```text
At least three specialized agents can autonomously request and consume services.
```

---

## Blockchain Engineer

Owns the question:

> Can an agent actually pay another agent?

Responsibilities:

* Monad integration,
* wallet management,
* transaction construction,
* settlement,
* receipt verification,
* payment-to-request correlation.

Primary deliverable:

```text
An agent service request produces a verifiable MON settlement associated with that request.
```

---

## Product / Frontend Engineer

Owns the question:

> Can someone understand what is happening in ten seconds?

Responsibilities:

* task input,
* agent graph,
* event stream,
* payment visualization,
* transaction status,
* final result,
* demo flow.

Primary deliverable:

```text
A first-time viewer can identify:
1. which agents are working,
2. who is interacting with whom,
3. where money moved,
4. whether the task succeeded.
```

---

# Development Strategy

Build vertically.

Do not spend days independently building four systems and attempting integration at the end.

## Phase 1 — Contracts

Agree on:

```text
Agent schema
Message schema
Event schema
Task lifecycle
Payment lifecycle
API contracts
```

No component should invent these independently.

---

## Phase 2 — Simulated End-to-End Flow

Before introducing LLM and blockchain complexity:

```text
User
  ↓
Orchestrator
  ↓
Simulated Agent A
  ↓
Simulated Agent B
  ↓
Simulated Payment
  ↓
Frontend
```

Prove the architecture first.

---

## Phase 3 — Real Agent Runtime

Replace simulated agents with actual agent implementations.

```text
Research
   ↓
Pricing
   ↓
Risk
```

Agents now reason, select tools, and delegate work.

---

## Phase 4 — Real Settlement

Replace simulated payment with Monad settlement.

```text
Agent A
   ↓
Payment Service
   ↓
Monad
   ↓
Confirmation
```

---

## Phase 5 — Demo Hardening

Test the exact path that will be demonstrated.

```text
task
 → discovery
 → request
 → quote
 → authorization
 → payment
 → confirmation
 → execution
 → result
```

Do not optimize secondary features before this path is reliable.

---

# Non-Goals

The MVP is intentionally not:

* a general-purpose DAO,
* a new cryptocurrency,
* a full decentralized agent marketplace,
* a generalized multi-chain settlement protocol,
* a production custody platform,
* an autonomous system with unrestricted spending,
* a replacement for every agent framework.

The first goal is narrower:

> **Prove that specialized agents can discover each other, exchange paid services, and produce an observable end-to-end settlement trail.**

---

# Roadmap

## MVP

* [ ] Agent registry
* [ ] Common protocol
* [ ] Task orchestrator
* [ ] Research Agent
* [ ] Pricing Agent
* [ ] Risk Agent
* [ ] Payment quote flow
* [ ] Monad testnet settlement
* [ ] Transaction verification
* [ ] Real-time event stream
* [ ] Agent graph visualization
* [ ] End-to-end demo

## Next

* [ ] Dynamic provider selection
* [ ] Multiple providers per capability
* [ ] Agent reputation
* [ ] Budget constraints
* [ ] Spending policies
* [ ] Escrow / conditional settlement
* [ ] Service-level guarantees
* [ ] Retry and recovery semantics
* [ ] Persistent task history
* [ ] Multi-chain settlement abstraction
* [ ] Agent SDK

---

# The Thesis

The internet developed protocols for machines to exchange information.

AgentPay Mesh explores what happens when autonomous machines can also exchange **services and value**.

```text
Information:
machine → machine

Services:
agent → agent

Value:
agent → agent
```

The long-term question is not whether AI agents can call APIs.

They already can.

The more interesting question is:

> **What infrastructure is required when autonomous agents become independent participants in an economy of services?**

AgentPay Mesh is an attempt to build one answer.

---

## Status

**Experimental / MVP**

Built to explore autonomous agent coordination and machine-to-machine settlement.

Not production-ready. Do not use with funds you cannot afford to lose.
