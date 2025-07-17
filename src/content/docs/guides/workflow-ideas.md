---
title: Development Workflow Steps
description: A workflow for developing AI applications
---

# Development Workflow Steps

## 1. Explore

Initial exploration on any topic. Pass query and goal

```ts


/**
 * @param query - The query to explore
 * @param goal - The goal of the exploration
 * @returns The result of the exploration
 */
function explore({ query, goal }: ExploreOptions): Promise<ExploreResult> {
  // Use OpenAI Agents SDK to do some exploration!



  return {
    query,
    goal,
  };
}
```

- Gather requirements
- Document initial thoughts
- Optional: Research similar solutions

## 2. Plan

Detailed planning and architecture design before implementation.

- Break down into tasks
- Design system architecture
- Create implementation roadmap

## 3. Confirm

Validate approach and plans before starting development.

- Review plans with team
- Verify technical feasibility
- Get stakeholder approval
- Setup autoconfirm based on metrics and triggers

## 4. Code

Active development phase implementing the planned solution.

- Write code following plans
- Create tests
- Document as needed
- Review and refactor

## 5. Commit

Finalize and integrate changes into codebase.

- Review changes
- Write commit messages
- Create pull request
- Address feedback
