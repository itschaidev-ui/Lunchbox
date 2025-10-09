
export type Task = {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: string;
  description?: string;
};

export type GeneratedCode = {
  html: string;
  css: string;
  js: string;
};

export type Tool = {
  id:string;
  name: string;
  code: GeneratedCode;
  isPremade?: boolean;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  isFavorite: boolean;
};
