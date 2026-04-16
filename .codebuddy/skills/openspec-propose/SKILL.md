---
name: openspec-propose
description: Propose a new change with all artifacts generated in one step. Use when the user wants to quickly describe what they want to build and get a complete proposal with design, specs, and tasks ready for implementation.
license: MIT
compatibility: Requires openspec CLI.
metadata:
  author: openspec
  version: "1.0"
  generatedBy: "1.2.0"
---

Propose a new change - create the change and generate all artifacts in one step.

I'll create a change with artifacts:
- proposal.md (what & why)
- design.md (how)
- tasks.md (implementation steps)

When ready to implement, run /opsx:apply

---

**Input**: The user's request should include a change name (kebab-case) OR a description of what they want to build.

**Steps**

1. **Read project policies and roadmap (MANDATORY first step)**

   Before any other action, read the following files to understand project conventions:
   - `openspec/specs/roadmap-policy/spec.md` — 了解 roadmap 维护规则、Change 拆分规则、propose 与 roadmap 的关联要求
   - `openspec/specs/roadmap/spec.md` — 了解当前各 Phase 状态、已有的 Change 拆分计划
   - `openspec/specs/glossary/spec.md` — 了解项目术语规范（如存在）

   **IMPORTANT**: This step is non-negotiable. These policies define constraints that MUST be followed throughout the propose process (e.g., Phase naming conventions, roadmap sync requirements, terminology).

2. **If no clear input provided, ask what they want to build**

   Use the **AskUserQuestion tool** (open-ended, no preset options) to ask:
   > "What change do you want to work on? Describe what you want to build or fix."

   From their description, derive a kebab-case name (e.g., "add user authentication" → `add-user-auth`).

   **IMPORTANT**: Do NOT proceed without understanding what the user wants to build.

3. **Create the change directory**
   ```bash
   openspec new change "<name>"
   ```
   This creates a scaffolded change at `openspec/changes/<name>/` with `.openspec.yaml`.

4. **Create Git feature branch (MANDATORY)**

   After the change directory is created, set up the corresponding Git branch:

   a. **Check current branch**:
      ```bash
      git branch --show-current
      ```

   b. **If on `main`**:
      - Pull latest: `git pull origin main`
      - Create and switch to feature branch: `git checkout -b feat/<change-name>`
      - Announce: "已创建并切换到分支 `feat/<change-name>`"

   c. **If already on `feat/<change-name>`** (matching the change being proposed):
      - This is fine — announce: "当前已在分支 `feat/<change-name>` 上"

   d. **If on another feature branch** (e.g., `feat/other-thing`):
      - **WARNING**: Use **AskUserQuestion tool** to alert the user:
        > "当前在分支 `feat/other-thing` 上，而不是 `main`。要创建 `feat/<change-name>` 分支，建议先切回 `main`。是否自动执行 `git checkout main && git pull && git checkout -b feat/<change-name>`？"
      - If user confirms, execute the branch switch
      - If user declines, proceed on current branch with a warning

   **IMPORTANT**: This step ensures every Change has a dedicated feature branch, matching the project rule "禁止在 main 分支直接写代码".

5. **Sync roadmap (if this is the first Change of a Phase)**

   Check the roadmap read in Step 1:
   - If the Change's Phase does **not yet** have a「Change 拆分」table, this is the first Change — you MUST add the table now
   - Update `openspec/specs/roadmap/spec.md`:
     - Add a「Change 拆分」section under the Phase with all planned Changes, their covered deliverables, and status
     - Update Phase status from `planning` → `active`
     - Update the milestone summary table accordingly
   - If the Phase already has a「Change 拆分」table, add the new Change to it if not already listed

   **IMPORTANT**: This step is required by roadmap-policy §5.5 and §6. Do NOT skip it.

6. **Get the artifact build order**
   ```bash
   openspec status --change "<name>" --json
   ```
   Parse the JSON to get:
   - `applyRequires`: array of artifact IDs needed before implementation (e.g., `["tasks"]`)
   - `artifacts`: list of all artifacts with their status and dependencies

7. **Create artifacts in sequence until apply-ready**

   Use the **TodoWrite tool** to track progress through the artifacts.

   Loop through artifacts in dependency order (artifacts with no pending dependencies first):

   a. **For each artifact that is `ready` (dependencies satisfied)**:
      - Get instructions:
        ```bash
        openspec instructions <artifact-id> --change "<name>" --json
        ```
      - The instructions JSON includes:
        - `context`: Project background (constraints for you - do NOT include in output)
        - `rules`: Artifact-specific rules (constraints for you - do NOT include in output)
        - `template`: The structure to use for your output file
        - `instruction`: Schema-specific guidance for this artifact type
        - `outputPath`: Where to write the artifact
        - `dependencies`: Completed artifacts to read for context
      - Read any completed dependency files for context
      - Create the artifact file using `template` as the structure
      - Apply `context` and `rules` as constraints - but do NOT copy them into the file
      - Show brief progress: "Created <artifact-id>"

   b. **Continue until all `applyRequires` artifacts are complete**
      - After creating each artifact, re-run `openspec status --change "<name>" --json`
      - Check if every artifact ID in `applyRequires` has `status: "done"` in the artifacts array
      - Stop when all `applyRequires` artifacts are done

   c. **If an artifact requires user input** (unclear context):
      - Use **AskUserQuestion tool** to clarify
      - Then continue with creation

8. **Show final status**
   ```bash
   openspec status --change "<name>"
   ```

**Output**

After completing all artifacts, summarize:
- Change name and location
- List of artifacts created with brief descriptions
- What's ready: "All artifacts created! Ready for implementation."
- Prompt: "Run `/opsx:apply` or ask me to implement to start working on the tasks."

**Artifact Creation Guidelines**

- Follow the `instruction` field from `openspec instructions` for each artifact type
- The schema defines what each artifact should contain - follow it
- Read dependency artifacts for context before creating new ones
- Use `template` as the structure for your output file - fill in its sections
- **IMPORTANT**: `context` and `rules` are constraints for YOU, not content for the file
  - Do NOT copy `<context>`, `<rules>`, `<project_context>` blocks into the artifact
  - These guide what you write, but should never appear in the output

**Guardrails**
- Create ALL artifacts needed for implementation (as defined by schema's `apply.requires`)
- Always read dependency artifacts before creating a new one
- If context is critically unclear, ask the user - but prefer making reasonable decisions to keep momentum
- If a change with that name already exists, ask if user wants to continue it or create a new one
- Verify each artifact file exists after writing before proceeding to next
