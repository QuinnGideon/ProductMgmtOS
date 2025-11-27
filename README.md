# ProductMgmt OS 🚀

**An Intelligent, Adaptive Learning Platform for Product Management**

ProductMgmt OS is a personal curriculum management system designed to help Product Managers structure their learning, identify knowledge gaps, and synthesize information using AI. It combines manual curation with automated ingestion and AI-powered analysis.

## 🌟 Key Features

### 1. Curriculum Management
- **Learning Tracks**: Organized domains (e.g., Discovery, Strategy, Analytics) with visual progress tracking.
- **Progressive Modules**: Unlock modules sequentially based on prerequisites.
- **Real-time Tracking**: Dynamic completion percentages and time estimation.

### 2. Intelligent Resource Library
- **Smart Ingestion**: 
  - **n8n Integration**: Send URLs to a webhook for server-side scraping and auto-tagging.
  - **Client-Side Scraping**: Built-in "Read Mode" fetcher for quick article ingestion.
  - **Manual Entry**: Full support for pasting text/transcripts.
- **Full CRUD**: Create, Read, Update, and Delete resources.
- **Cascading Deletes**: Removing a resource automatically cleans up curriculum associations.

### 3. AI Synthesis & Study Guides (Gemini 2.5)
- **Auto-Summarization**: Generates concise summaries of entire learning modules.
- **Key Takeaways**: Extracts the top 5 actionable points from combined resources.
- **Comprehension Checks**: Auto-generates quiz questions to test your knowledge.
- **Practical Applications**: Suggests real-world PM tasks based on the content.
- *Powered by Google Gemini 2.5 Flash.*

### 4. Insights Engine
- **Gap Analysis**: Identifies topics appearing as prerequisites that you haven't studied yet.
- **Smart Recommendations**: Suggests the next best resource based on your current context, "quick wins" (short content), and topic continuity.

---

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Vite (conceptually)
- **Styling**: Tailwind CSS + Lucide React Icons
- **Database**: [InstantDB](https://instantdb.com) (Real-time, client-side database)
- **AI**: Google GenAI SDK (`gemini-2.5-flash`)
- **Automation**: n8n (Optional, for advanced ingestion)

---

## 🚀 Getting Started

### 1. Database Setup (InstantDB)
This project uses InstantDB for real-time persistence.
1. Go to [InstantDB](https://instantdb.com) and create a new app.
2. Copy your **App ID**.
3. Open `db.ts` and replace the `APP_ID` constant:
   ```typescript
   const APP_ID = 'YOUR-NEW-APP-ID';
   ```
4. The app includes a `SeedData` function in `App.tsx` that will populate default tracks if the database is empty.

### 2. AI Configuration (Gemini)
The app uses Google's Gemini model for synthesis.
1. When you load the app, you will be prompted to "Connect Google Account".
2. This utilizes the secure `window.aistudio` authentication flow.
3. No manual API key management in code is required.

### 3. n8n Integration (Optional)
To enable "Link Ingestion" (auto-scraping URLs):
1. Set up an n8n workflow with a **Webhook** trigger (POST).
2. **Input JSON Format**:
   ```json
   {
     "url": "https://example.com/article",
     "date": "2025-01-01T00:00:00.000Z"
   }
   ```
3. **Workflow Logic**:
   - Fetch URL content.
   - Use an LLM agent to extract: `title`, `summary`, `estimatedMinutes`, `difficulty`, `topics`.
   - Write to InstantDB via HTTP Request using the Admin API.
4. Go to **Settings** in the app and paste your n8n Webhook URL.

---

## 📂 Project Structure

```
/
├── db.ts                  # InstantDB initialization & ID generator
├── types.ts               # TypeScript interfaces for Schema
├── App.tsx                # Main router, Auth gate, and Data Seeding
├── services/
│   └── geminiService.ts   # AI Synthesis logic
├── components/
│   ├── Layout.tsx         # Sidebar, Mobile Nav, Keyboard Shortcuts
│   └── ui.tsx             # Reusable UI components (Cards, Buttons, etc.)
└── pages/
    ├── Dashboard.tsx      # Stats, Continue Learning, Recent Activity
    ├── Tracks.tsx         # High-level domain view
    ├── Curriculum.tsx     # Module sequencer and progress locking
    ├── ModuleDetail.tsx   # Resource list + AI Synthesis view
    ├── ResourceLibrary.tsx# Searchable table + Edit/Delete actions
    ├── AddResource.tsx    # Ingestion forms (Auto/Manual)
    ├── Insights.tsx       # Gap analysis & Recommendations algorithms
    └── Settings.tsx       # Configuration & Database Reset
```

## ⌨️ Keyboard Shortcuts

- **Global**: `Shift + A` → Go to Add Resource page.
- **Module View**: `c` → Mark the next incomplete resource as completed.

## 🎨 Customization

- **Theme**: Toggle Dark/Light mode in the Sidebar.
- **Print**: The `ModuleDetail` page has a print-optimized stylesheet for exporting Study Guides to PDF.
