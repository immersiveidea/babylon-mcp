# Babylon MCP Server - Development Roadmap

## Vision
Build an MCP (Model Context Protocol) server that helps developers working with Babylon.js and the Babylon.js Editor by providing intelligent documentation search and sandbox examples. The MCP server serves as a canonical, token-efficient source for Babylon.js framework information and Editor tool workflows when using AI agents, while incorporating community feedback to continuously improve search relevance.

## Documentation Source
- **Repository**: https://github.com/BabylonJS/Documentation.git
- This is the authoritative source for all Babylon.js documentation

---

## Recent Progress (2025-01-24)

**Editor Documentation Integration - COMPLETED** ✅

Successfully integrated Babylon.js Editor documentation using TypeScript Compiler API:
- ✅ Cloned Editor repository independently (751 MB, 13 documentation pages)
- ✅ Created TSX parser using TypeScript Compiler API (zero new dependencies)
- ✅ Extended DocumentParser to handle both .md and .tsx files
- ✅ Updated LanceDB indexer to discover and process page.tsx files
- ✅ Added editor-docs source to indexing pipeline
- ✅ Tested search functionality with Editor-specific queries
- ✅ **Total indexed: 902 documents** (745 docs + 144 source + 13 editor)

**Key Implementation Details:**
- TSX Parser: Uses TypeScript AST traversal to extract text from React components
- File location: `src/search/tsx-parser.ts`
- Filters out className values, imports, and non-content text
- Extracts headings, code blocks, and documentation content
- Search results now include Editor workflows and APIs

## Recent Progress (2025-01-23)

**Phase 1 Core Features - COMPLETED** ✅

Successfully implemented vector search with local embeddings:
- ✅ Installed and configured LanceDB + @xenova/transformers
- ✅ Created document parser with YAML frontmatter extraction
- ✅ Built indexer that processes 745 markdown files
- ✅ Generated vector embeddings using Xenova/all-MiniLM-L6-v2 (local, no API costs)
- ✅ Implemented `search_babylon_docs` MCP tool with semantic search
- ✅ Implemented `get_babylon_doc` MCP tool for document retrieval
- ✅ Added relevance scoring and snippet extraction
- ✅ Tested successfully with "Vector3" query

**Key Implementation Details:**
- Vector database: LanceDB stored in `./data/lancedb`
- Embedding model: Runs locally in Node.js via transformers.js
- Indexed fields: title, description, keywords, category, breadcrumbs, content, headings, code blocks
- Search features: Semantic similarity, category filtering, ranked results with snippets
- Scripts: `npm run index-docs` to rebuild index

---

## Phase 1: Core MCP Infrastructure & Documentation Indexing
**Goal**: Establish foundational MCP server with documentation search from the canonical GitHub source

### 1.1 MCP Server Setup
- [X] Install and configure MCP SDK (@modelcontextprotocol/sdk)
- [X] Implement MCP server with HTTP transport (SSE)
- [X] Define MCP server metadata and capabilities
- [X] Create basic server lifecycle management (startup, shutdown, error handling)

### 1.2 Documentation Repository Integration
- [X] Clone and set up local copy of BabylonJS/Documentation repository
- [X] Implement automated git pull mechanism for updates
- [X] Parse documentation file structure (markdown files, code examples)
- [X] Extract metadata from documentation files (titles, categories, versions)
- [X] Index Babylon.js source repository markdown files (Option 3 - Hybrid Approach, Phase 1)
  - [X] Add 144 markdown files from Babylon.js/Babylon.js repository
  - [X] Include: CHANGELOG.md, package READMEs, contributing guides
  - [X] Phase 2: Evaluate TypeDoc integration for API reference
- [ ] Create documentation change detection system
- [ ] Research and fix Claude Code config file integration issue
  - CLI `/mcp http://localhost:4000/mcp` works
  - Config file `~/.claude/config.json` approach does not work
  - Need to investigate proper config file format for HTTP MCP servers

### 1.3 Search Index Implementation
- [X] Design indexing strategy for markdown documentation
- [X] Implement vector embeddings for semantic search (using @xenova/transformers with Xenova/all-MiniLM-L6-v2)
- [X] Create vector database with LanceDB
- [X] Index code examples separately from prose documentation
- [ ] Implement incremental index updates (only reindex changed files)

### 1.4 Basic Documentation Search Tool
- [X] Implement MCP tool: `search_babylon_docs`
  - Input: search query, optional filters (category, API section)
  - Output: ranked documentation results with context snippets and file paths
- [X] Return results in token-efficient format (concise snippets vs full content)
- [X] Add relevance scoring based on semantic similarity and keyword matching
- [ ] Implement result deduplication

### 1.5 Documentation Retrieval Tool
- [X] Implement MCP tool: `get_babylon_doc`
  - Input: specific documentation file path or topic identifier
  - Output: full documentation content optimized for AI consumption
- [X] Format content to minimize token usage while preserving clarity
- [X] Include related documentation links in results

### 1.6 Babylon Editor Integration ✅ **COMPLETED**
**Goal**: Expand MCP server scope to support Babylon.js Editor tool usage and workflows

#### Phase 1: Repository Setup & Exploration ✅ **COMPLETED**
- [X] Clone https://github.com/BabylonJS/Editor.git independently (shallow clone)
  - Location: data/repositories/Editor/
  - Branch: master (note: uses 'master' not 'main')
  - Independent from BabylonJS/Babylon.js (uses npm packages)
- [X] Inspect repository structure and document findings:
  - Documentation in `/website/src/app/documentation/` as Next.js **page.tsx files** (not markdown)
  - Found 13 documentation pages (page.tsx files)
  - Repository size: 751 MB (includes Electron build artifacts)
  - Documentation site built with Next.js, content embedded in TSX components
- [X] Catalog documentation types found:
  - Editor tool usage guides (creating project, composing scene, managing assets)
  - Editor-specific APIs (babylonjs-editor-tools decorators: @nodeFromScene, etc.)
  - Script lifecycle documentation (onStart, onUpdate, onStop)
  - Project templates (Next.js, SolidJS, Vanilla.js) in `/templates`
  - Advanced features (texture compression, LOD, shadow optimization)

#### Phase 2: Indexing Strategy Decision ✅ **COMPLETED**
- [X] Evaluate documentation value for MCP users:
  - Quantity: 13 documentation pages (TSX format, not markdown)
  - Quality: High relevance - covers Editor workflows and Editor-only APIs
  - Overlap: Minimal - Editor docs are distinct from core framework docs
  - Uniqueness: Very high - decorators, lifecycle methods, Editor UI workflows are Editor-only
- [X] Choose indexing approach based on findings:
  - **Selected: Option A (Modified)** - Parse TSX files using TypeScript Compiler API
  - Decided against web scraping to maintain source-of-truth from repository
  - Built custom TSX parser to extract text from React components
  - Rationale: Zero dependencies (uses built-in TypeScript), accurate parsing, maintainable
- [X] Document decision and rationale: Using TypeScript Compiler API for TSX parsing

#### Phase 3: Implementation ✅ **COMPLETED**
- [X] Update repository-config.ts with Editor repository configuration
- [X] Create TSX parser using TypeScript Compiler API (`src/search/tsx-parser.ts`)
- [X] Extend DocumentParser to handle both `.md` and `.tsx` files
- [X] Add Editor content to indexing pipeline (`editor-docs` source)
- [X] Update LanceDB indexer to discover and process `page.tsx` files
- [X] Test search quality with Editor-related queries - **Results: Working perfectly!**
  - Tested queries: "onStart", "@nodeFromScene", "attaching scripts", "creating project"
  - Editor docs appear in search results alongside core docs
  - **Total indexed: 902 documents** (745 docs + 144 source + 13 editor)

#### Phase 4: Editor-Specific MCP Tools (If valuable after Phase 3)
- [ ] `search_babylon_editor_docs` - Search Editor documentation
  - Input: query, category (workflow/scripting/assets/troubleshooting)
  - Output: Ranked Editor-specific results
- [ ] `get_babylon_editor_doc` - Retrieve full Editor documentation pages
- [ ] `search_babylon_editor_api` - Search Editor APIs (decorators, lifecycle)
- [ ] `get_babylon_template` - Retrieve project template files
- [ ] Modify existing tools to support `source` parameter: "core" | "editor" | "both"


---

## Phase 2: Sandbox Examples Integration
**Goal**: Enable discovery and search of Babylon.js Playground examples

### 2.1 Playground Data Source
- [ ] Research Babylon.js Playground structure and API
- [ ] Identify authoritative source for playground examples
- [ ] Determine if examples are in Documentation repo or need separate scraping
- [ ] Design data model for playground examples

### 2.2 Example Indexing
- [ ] Implement scraper/parser for playground examples
- [ ] Extract: title, description, code, tags, dependencies
- [ ] Index example code with semantic understanding
- [ ] Link examples to related documentation topics
- [ ] Store example metadata efficiently

### 2.3 Example Search Tool
- [ ] Implement MCP tool: `search_babylon_examples`
  - Input: search query, optional filters (features, complexity)
  - Output: ranked examples with descriptions and playground URLs
- [ ] Return code snippets in token-efficient format
- [ ] Add "similar examples" recommendations
- [ ] Include difficulty/complexity indicators

---

## Phase 3: Token Optimization & Caching
**Goal**: Minimize token usage for AI agents while maintaining quality

### 3.1 Response Optimization
- [ ] Implement smart content summarization for long documentation
- [ ] Create tiered response system (summary → detailed → full content)
- [ ] Remove redundant information from responses
- [ ] Optimize markdown formatting for AI consumption
- [ ] Add token count estimates to responses

### 3.2 Intelligent Caching
- [ ] Implement query result caching (Redis or in-memory)
- [ ] Cache frequently accessed documentation sections
- [ ] Add cache invalidation on documentation updates
- [ ] Track cache hit rates and optimize cache strategy
- [ ] Implement cache warming for popular queries

### 3.3 Context Management
- [ ] Implement MCP resource: `babylon_context`
  - Provides common context (current version, key concepts) for AI agents
  - Reduces need to repeatedly fetch basic information
- [ ] Create canonical response templates for common questions
- [ ] Add version-specific context handling
- [ ] Add resource subscriptions for documentation/source updates
  - Convert get_babylon_doc and get_babylon_source from tools to resources
  - Implement file watching for repository changes
  - Send resource update notifications to subscribed clients

---

## Phase 4: Feedback Collection System
**Goal**: Allow users to provide feedback on search result usefulness

### 4.1 Database Design
- [ ] Choose database (SQLite for simplicity, PostgreSQL for production scale)
- [ ] Design schema for:
  - Search queries and returned results
  - User feedback (usefulness scores, relevance ratings)
  - Query-result effectiveness mappings
  - Anonymous session tracking

### 4.2 Feedback Submission
- [ ] Implement MCP tool: `provide_feedback`
  - Input: result identifier, query, usefulness score (1-5), optional comment
  - Output: confirmation and feedback ID
- [ ] Store feedback with query context
- [ ] Implement basic spam prevention
- [ ] Add feedback submission via Express REST API (optional web interface)

### 4.3 Feedback Analytics Foundation
- [ ] Create queries for feedback aggregation
- [ ] Implement basic feedback score calculations
- [ ] Design feedback reporting structure
- [ ] Add feedback data export capabilities

---

## Phase 5: Learning & Ranking Optimization
**Goal**: Use collected feedback to improve search result relevance

### 5.1 Feedback-Driven Ranking
- [ ] Integrate feedback scores into search ranking algorithm
- [ ] Implement boost factors for highly-rated results
- [ ] Add penalty factors for low-rated results
- [ ] Create decay function (recent feedback weighted higher)
- [ ] Test ranking improvements with historical queries

### 5.2 Query Understanding
- [ ] Analyze successful searches to identify patterns
- [ ] Implement query expansion based on feedback
- [ ] Add synonym detection for common Babylon.js terms
- [ ] Create query-to-topic mapping
- [ ] Implement "did you mean" suggestions

### 5.3 Result Quality Monitoring
- [ ] Track result click-through rates (if applicable)
- [ ] Identify zero-result queries for improvement
- [ ] Monitor feedback trends over time
- [ ] Create alerts for sudden quality drops
- [ ] Implement A/B testing framework for ranking changes

---

## Phase 6: Feature Requests & Community Engagement
**Goal**: Enable users to suggest improvements and vote on feature requests

### 6.1 Suggestion Collection
- [ ] Extend database schema for feature requests/improvements
- [ ] Implement MCP tool: `submit_suggestion`
  - Input: suggestion text, category (documentation, example, feature)
  - Output: suggestion ID for tracking
- [ ] Add suggestion categorization and tagging
- [ ] Implement duplicate detection for similar suggestions

### 6.2 Voting System
- [ ] Implement MCP tool: `vote_on_suggestion`
  - Input: suggestion ID, vote (up/down)
  - Output: updated vote count
- [ ] Design anonymous voting with abuse prevention
- [ ] Add vote weight based on user activity (optional)
- [ ] Implement vote aggregation and trending calculations

### 6.3 Suggestion Discovery
- [ ] Implement MCP tool: `browse_suggestions`
  - Input: filters (category, status, sort order)
  - Output: paginated list of suggestions with vote counts
- [ ] Add search within suggestions
- [ ] Create status tracking (new, under review, implemented, rejected)
- [ ] Add suggestion updates and resolution tracking

### 6.4 Community Dashboard (Optional)
- [ ] Create web interface for browsing suggestions
- [ ] Add suggestion detail pages with discussion
- [ ] Implement suggestion status updates by maintainers
- [ ] Add notification system for suggestion updates

---

## Phase 7: Advanced Features & Quality
**Goal**: Enhance capabilities and ensure production readiness

### 7.1 Multi-Version Support
- [ ] Detect Babylon.js versions in Documentation repo
- [ ] Index documentation for multiple versions separately
- [ ] Add version parameter to search tools
- [ ] Implement version comparison capabilities
- [ ] Create migration guides between versions

### 7.2 Code-Aware Search
- [ ] Implement code pattern search in examples
- [ ] Add TypeScript/JavaScript syntax understanding
- [ ] Create API signature search
- [ ] Add "find usage examples" for specific APIs
- [ ] Implement code-to-documentation linking

### 7.3 Performance & Scalability
- [ ] Optimize search query performance (< 500ms p95)
- [ ] Implement connection pooling for database
- [ ] Add request queuing for high load
- [ ] Optimize memory usage for large indexes
- [ ] Implement graceful degradation under load

### 7.4 Testing & Quality Assurance
- [ ] Write unit tests for core indexing and search logic
- [ ] Create integration tests for MCP tools
- [ ] Add end-to-end tests for critical workflows
- [ ] Implement regression testing for ranking changes
- [ ] Add performance benchmarks and monitoring

---

## Phase 8: Deployment & Operations
**Goal**: Make the server production-ready and maintainable

### 8.1 Deployment Infrastructure
- [ ] Create Dockerfile for containerization
- [ ] Set up docker-compose for local development
- [ ] Implement configuration management (environment variables)
- [ ] Create database migration system
- [ ] Add health check endpoints

### 8.2 Automation & CI/CD
- [ ] Set up GitHub Actions for testing
- [ ] Implement automated builds and releases
- [ ] Create automated documentation update workflow
- [ ] Add automated index rebuilding schedule
- [ ] Implement version tagging and release notes

### 8.3 Monitoring & Observability
- [ ] Add structured logging (JSON format)
- [ ] Implement metrics collection (Prometheus-compatible)
- [ ] Create performance dashboards
- [ ] Add error tracking and alerting
- [ ] Implement trace logging for debugging

### 8.4 Documentation & Onboarding
- [ ] Write installation guide for MCP server
- [ ] Create configuration documentation
- [ ] Document all MCP tools with examples
- [ ] Add troubleshooting guide
- [ ] Create developer contribution guide

---

## Technical Architecture Decisions

### MCP Implementation
- **SDK**: @modelcontextprotocol/sdk (official TypeScript SDK)
- **Transport**: HTTP with Server-Sent Events (SSE) on port 3001
- **MCP Endpoint**: `/mcp/sse`
- **Tools**: search_babylon_docs, get_babylon_doc, search_babylon_examples, provide_feedback, submit_suggestion, vote_on_suggestion, browse_suggestions
- **Resources**: babylon_context (common framework information)

### Search & Indexing (✅ Implemented)
- **Vector Database**: LanceDB for vector storage and similarity search
- **Embedding Model**: @xenova/transformers with Xenova/all-MiniLM-L6-v2 (local, no API costs)
- **Document Parser**: gray-matter for YAML frontmatter + markdown content extraction
- **Indexed Documents**: 745 markdown files from BabylonJS/Documentation repository
- **Search Features**: Semantic vector search with relevance scoring, category filtering, snippet extraction

### Data Storage (✅ Implemented)
- **Vector Database**: LanceDB stored in `./data/lancedb`
- **Document Storage**: Local clone of BabylonJS/Documentation in `./data/repositories/Documentation`
- **Indexed Fields**: title, description, keywords, category, breadcrumbs, content, headings, code blocks, playground IDs
- **Future**: Add Redis for query caching, implement incremental updates

### Token Optimization Strategy
- Return concise snippets by default (50-200 tokens)
- Offer detailed responses on demand
- Cache common context to avoid repetition
- Use efficient markdown formatting
- Implement smart content truncation

### Security & Privacy
- Anonymous feedback collection (no PII)
- Rate limiting on all MCP tools
- Input validation and sanitization
- Secure database access patterns
- No authentication required (open access)

---

## Success Metrics

### Phase 1-2 (Core Functionality) ✅ ACHIEVED
- ✅ Documentation indexing: 100% of BabylonJS/Documentation repo (745 files indexed)
- ✅ Search implementation: LanceDB vector search with local embeddings operational
- ⏳ Search response time: Testing needed for p95 latency
- ⏳ Search relevance: Initial tests successful, needs broader validation
- ⏳ Token efficiency: Needs measurement and optimization

### Phase 3-5 (Optimization & Feedback)
- Cache hit rate: > 60%
- Feedback collection rate: > 5% of searches
- Ranking improvement: Increase in positive feedback over time
- Query success rate: < 5% zero-result queries

### Phase 6-8 (Community & Production)
- Suggestion collection: Active community participation
- Uptime: > 99%
- Documentation freshness: < 24 hour lag from repo updates
- Test coverage: > 80% of core functionality

---

## Future Enhancements (Post-Launch)

- Integration with Babylon.js GitHub issues for additional context
- Real-time collaborative debugging sessions
- Visual search for shader/rendering effects
- Performance optimization recommendations based on best practices
- Integration with TypeScript Language Server for IDE features
- Multi-language documentation support
- Community-contributed solutions and patterns library
- Interactive tutorial generation based on user goals
