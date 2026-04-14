export declare const CURRENT_SDD_STATE_VERSION = 2;
export interface SddMigrationAssessment {
    currentVersion: number;
    targetVersion: number;
    needsMigration: boolean;
    reasons: string[];
    conversions: Array<{
        from: string;
        to: string;
    }>;
    legacyRecords: string[];
}
export declare function assessSddMigration(projectRoot: string): Promise<SddMigrationAssessment>;
export declare class SddMigrateCommand {
    execute(projectRoot: string, options?: {
        radToEpic?: boolean;
    }): Promise<{
        converted: number;
        messages: string[];
        assessment: SddMigrationAssessment;
    }>;
}
//# sourceMappingURL=migrate.d.ts.map