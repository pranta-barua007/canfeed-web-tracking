export type WorkspacePage = {
    url: string;
    path: string;
    commentCount: number;
    lastActive: Date;
};

export type GroupedWorkspace = {
    domain: string;
    favicon: string;
    lastActive: Date;
    totalComments: number;
    pages: WorkspacePage[];
};
