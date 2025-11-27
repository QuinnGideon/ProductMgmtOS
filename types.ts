export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type ContentType = 'video' | 'article' | 'pdf' | 'screenshot';
export type Status = 'queued' | 'in-progress' | 'completed';

export interface Track {
  id: string;
  name: string;
  description: string;
  order: number;
  color: string;
  estimatedTotalHours: number;
}

export interface Module {
  id: string;
  trackId: string;
  name: string;
  description: string;
  prerequisites: string[]; // Array of module IDs
  order: number;
  estimatedHours: number;
}

export interface Resource {
  id: string;
  title: string;
  url: string;
  contentType: ContentType;
  extractedContent?: string;
  topics: string[];
  prerequisiteTopics?: string[]; // For gap analysis
  difficulty: Difficulty;
  estimatedMinutes: number;
  status: Status;
  dateAdded: string;
  completionDate?: string;
  userNotes?: string;
}

export interface ModuleResource {
  id: string;
  moduleId: string;
  resourceId: string;
  sequenceOrder: number;
}

export interface Synthesis {
  id: string;
  moduleId: string;
  summaryText: string;
  keyTakeaways: string[];
  comprehensionQuestions: string[];
  practicalApplications: string[];
  generatedAt: string;
}

// InstantDB Schema Shape
export interface Schema {
  tracks: Track;
  modules: Module;
  resources: Resource;
  moduleResources: ModuleResource;
  syntheses: Synthesis;
}
