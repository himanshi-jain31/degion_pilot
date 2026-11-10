# Recipe: Quick questions (before Phase 1)

## Goal
Find the few unknowns that would change the design the most, and ask the designer about them.

## Steps
1. Read the requirement and all uploaded files.
2. List everything important you do not know (users, devices, scope, deadline, data, rules, success).
3. Rank them by how much each answer would change the design.
4. Turn the top ones (maximum 5) into simple questions with 2 to 4 likely answers each.

## Rules
- project_name: a short name for the project, 2 to 4 words, in plain words, from the main topic of the request (for example "Leave request flow" or "Habit tracker"). Never the first words of the request, and never a full sentence.
- Plain words. One idea per question.
- Never ask something already answered in the files.
- Always allow "You decide". The app adds this button itself.

## Output (JSON only)
{
  "questions": [
    { "id": "q1", "question": "Where do people mostly use this?", "why_it_matters": "Changes the layout", "options": ["Phone", "Laptop", "Both"] }
  ],
  "request_summary": "One plain sentence restating the request",
  "project_name": "Leave request flow",
  "suggested_depth": "Light | Standard | Deep"
}
