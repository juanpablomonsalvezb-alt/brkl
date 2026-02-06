import { 
  levels, subjects, levelSubjects, learningObjectives, weeklyResources,
  enrollments, studentProgress, weeklyCompletion, userProfiles,
  programCalendar, moduleEvaluations, evaluationProgress, textbookConfigs, reservations, planConfigurations,
  siteConfiguration, adultCycleConfigurations, geminiCopilots, levelPlanConfigurations,
  type Level, type InsertLevel, type Subject, type InsertSubject,
  type LevelSubject, type InsertLevelSubject, type LearningObjective, type InsertLearningObjective,
  type WeeklyResource, type InsertWeeklyResource, type Enrollment, type InsertEnrollment,
  type StudentProgress, type InsertStudentProgress, type UserProfile, type InsertUserProfile,
  type ProgramCalendar, type InsertProgramCalendar, type ModuleEvaluation, type InsertModuleEvaluation,
  type EvaluationProgress, type InsertEvaluationProgress, type TextbookConfig, type InsertTextbookConfig,
  type Reservation, type InsertReservation, type PlanConfiguration, type InsertPlanConfiguration,
  type SiteConfiguration, type InsertSiteConfiguration, type AdultCycleConfiguration, type InsertAdultCycleConfiguration,
  type InsertGeminiCopilot, insertGeminiCopilotSchema, type LevelPlanConfiguration, type InsertLevelPlanConfiguration,
  insertLevelPlanConfigurationSchema
} from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray, desc } from "drizzle-orm";

export interface IStorage {
  // Levels
  getLevels(): Promise<Level[]>;
  getLevelById(id: string): Promise<Level | undefined>;
  createLevel(level: InsertLevel): Promise<Level>;
  
  // Subjects
  getSubjects(): Promise<Subject[]>;
  getSubjectById(id: string): Promise<Subject | undefined>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  
  // Level-Subjects
  getAllLevelSubjects(): Promise<(LevelSubject & { level: Level; subject: Subject })[]>;
  getLevelSubjects(levelId: string): Promise<(LevelSubject & { subject: Subject })[]>;
  getLevelSubjectById(id: string): Promise<LevelSubject | undefined>;
  createLevelSubject(ls: InsertLevelSubject): Promise<LevelSubject>;
  updateLevelSubjectTextbook(id: string, data: { textbookPdfUrl?: string | null; textbookTitle?: string | null }): Promise<LevelSubject | undefined>;
  
  // Learning Objectives
  getLearningObjectives(levelSubjectId: string): Promise<LearningObjective[]>;
  getLearningObjectiveById(id: string): Promise<LearningObjective | undefined>;
  createLearningObjective(lo: InsertLearningObjective): Promise<LearningObjective>;
  updateLearningObjectivePages(id: string, data: { textbookStartPage?: number; textbookEndPage?: number }): Promise<LearningObjective | undefined>;
  
  // Weekly Resources
  getResourcesByObjective(learningObjectiveId: string): Promise<WeeklyResource[]>;
  getResourceById(id: string): Promise<WeeklyResource | undefined>;
  createResource(resource: InsertWeeklyResource): Promise<WeeklyResource>;
  updateResource(id: string, resource: Partial<InsertWeeklyResource>): Promise<WeeklyResource | undefined>;
  deleteResourcesByObjective(learningObjectiveId: string): Promise<void>;
  
  // Enrollments
  getEnrollmentsByUser(userId: string): Promise<Enrollment[]>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  
  // Student Progress
  getProgressByUser(userId: string): Promise<StudentProgress[]>;
  markResourceComplete(progress: InsertStudentProgress): Promise<StudentProgress>;
  
  // User Profiles
  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  createOrUpdateUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  
  // Program Calendar
  getProgramCalendar(levelId: string): Promise<ProgramCalendar | undefined>;
  createProgramCalendar(calendar: InsertProgramCalendar): Promise<ProgramCalendar>;
  
  // Module Evaluations
  getModuleEvaluations(learningObjectiveId: string): Promise<ModuleEvaluation[]>;
  getModuleEvaluationById(id: string): Promise<ModuleEvaluation | undefined>;
  createModuleEvaluation(evaluation: InsertModuleEvaluation): Promise<ModuleEvaluation>;
  upsertEvaluationHtml(objectiveId: string, evaluationNumber: number, htmlContent: string): Promise<ModuleEvaluation>;
  getEvaluationHtml(objectiveId: string, evaluationNumber: number): Promise<ModuleEvaluation | undefined>;
  upsertEvaluationQuestions(
    objectiveId: string, 
    evaluationNumber: number, 
    questionsJson: string, 
    totalQuestions: number
  ): Promise<ModuleEvaluation>;
  
  // Evaluation Progress
  getEvaluationProgressByUser(userId: string, evaluationIds?: string[]): Promise<EvaluationProgress[]>;
  getUserCompletedModules(userId: string, levelSubjectId: string): Promise<number[]>;
  markEvaluationComplete(progress: InsertEvaluationProgress): Promise<EvaluationProgress>;
  saveEvaluationAttempt(
    userId: string,
    evaluationId: string,
    totalCorrect: number,
    totalQuestions: number,
    answersJson: string,
    passed: boolean
  ): Promise<EvaluationProgress>;
  
  // Reservations
  getAllReservations(): Promise<Reservation[]>;
  getReservationById(id: string): Promise<Reservation | undefined>;
  createReservation(reservation: InsertReservation): Promise<Reservation>;
  updateReservationStatus(id: string, status: string): Promise<Reservation | undefined>;
  deleteReservation(id: string): Promise<void>;
  
  // Plan Configurations
  getAllPlanConfigurations(): Promise<PlanConfiguration[]>;
  getPlanConfigurationByKey(planKey: string): Promise<PlanConfiguration | undefined>;
  createPlanConfiguration(plan: InsertPlanConfiguration): Promise<PlanConfiguration>;
  updatePlanConfiguration(id: string, plan: Partial<InsertPlanConfiguration>): Promise<PlanConfiguration | undefined>;
  deletePlanConfiguration(id: string): Promise<void>;
  initializeDefaultPlans(): Promise<void>;
  
  // Site Configuration
  getAllSiteConfigurations(): Promise<SiteConfiguration[]>;
  getSiteConfigurationByKey(configKey: string): Promise<SiteConfiguration | undefined>;
  upsertSiteConfiguration(config: InsertSiteConfiguration): Promise<SiteConfiguration>;
  initializeDefaultSiteConfig(): Promise<void>;
  
  // Adult Cycle Configurations
  getAllAdultCycleConfigurations(): Promise<AdultCycleConfiguration[]>;
  getAdultCycleConfigurationByKey(cycleKey: string): Promise<AdultCycleConfiguration | undefined>;
  createAdultCycleConfiguration(cycle: InsertAdultCycleConfiguration): Promise<AdultCycleConfiguration>;
  updateAdultCycleConfiguration(id: string, cycle: Partial<InsertAdultCycleConfiguration>): Promise<AdultCycleConfiguration | undefined>;
  deleteAdultCycleConfiguration(id: string): Promise<void>;
  initializeDefaultAdultCycles(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Levels
  async getLevels(): Promise<Level[]> {
    return db.select().from(levels).orderBy(levels.sortOrder);
  }

  async getLevelById(id: string): Promise<Level | undefined> {
    const [level] = await db.select().from(levels).where(eq(levels.id, id));
    return level;
  }

  async createLevel(level: InsertLevel): Promise<Level> {
    const [created] = await db.insert(levels).values(level).returning();
    return created;
  }

  // Subjects
  async getSubjects(): Promise<Subject[]> {
    return db.select().from(subjects);
  }

  async getSubjectById(id: string): Promise<Subject | undefined> {
    const [subject] = await db.select().from(subjects).where(eq(subjects.id, id));
    return subject;
  }

  async createSubject(subject: InsertSubject): Promise<Subject> {
    const [created] = await db.insert(subjects).values(subject).returning();
    return created;
  }

  // Level-Subjects
  async getAllLevelSubjects(): Promise<(LevelSubject & { level: Level; subject: Subject })[]> {
    const result = await db
      .select({
        id: levelSubjects.id,
        levelId: levelSubjects.levelId,
        subjectId: levelSubjects.subjectId,
        totalOAs: levelSubjects.totalOAs,
        textbookPdfUrl: levelSubjects.textbookPdfUrl,
        textbookTitle: levelSubjects.textbookTitle,
        level: levels,
        subject: subjects,
      })
      .from(levelSubjects)
      .innerJoin(levels, eq(levelSubjects.levelId, levels.id))
      .innerJoin(subjects, eq(levelSubjects.subjectId, subjects.id))
      .orderBy(levels.sortOrder, subjects.name);
    
    return result.map(r => ({
      id: r.id,
      levelId: r.levelId,
      subjectId: r.subjectId,
      totalOAs: r.totalOAs,
      textbookPdfUrl: r.textbookPdfUrl,
      textbookTitle: r.textbookTitle,
      level: r.level,
      subject: r.subject,
    }));
  }

  async getLevelSubjects(levelId: string): Promise<(LevelSubject & { subject: Subject })[]> {
    const result = await db
      .select({
        id: levelSubjects.id,
        levelId: levelSubjects.levelId,
        subjectId: levelSubjects.subjectId,
        totalOAs: levelSubjects.totalOAs,
        textbookPdfUrl: levelSubjects.textbookPdfUrl,
        textbookTitle: levelSubjects.textbookTitle,
        subject: subjects,
      })
      .from(levelSubjects)
      .innerJoin(subjects, eq(levelSubjects.subjectId, subjects.id))
      .where(eq(levelSubjects.levelId, levelId));
    
    return result.map(r => ({
      id: r.id,
      levelId: r.levelId,
      subjectId: r.subjectId,
      totalOAs: r.totalOAs,
      textbookPdfUrl: r.textbookPdfUrl,
      textbookTitle: r.textbookTitle,
      subject: r.subject,
    }));
  }

  async getLevelSubjectById(id: string): Promise<LevelSubject | undefined> {
    const [ls] = await db.select().from(levelSubjects).where(eq(levelSubjects.id, id));
    return ls;
  }

  async createLevelSubject(ls: InsertLevelSubject): Promise<LevelSubject> {
    const [created] = await db.insert(levelSubjects).values(ls).returning();
    return created;
  }

  async updateLevelSubjectTextbook(id: string, data: { textbookPdfUrl?: string | null; textbookTitle?: string | null }): Promise<LevelSubject | undefined> {
    // Filter out undefined values, but keep null values to allow clearing fields
    const updateData: Record<string, string | null> = {};
    if (data.textbookPdfUrl !== undefined) updateData.textbookPdfUrl = data.textbookPdfUrl;
    if (data.textbookTitle !== undefined) updateData.textbookTitle = data.textbookTitle;
    
    // If no values to update, just return the existing record
    if (Object.keys(updateData).length === 0) {
      const [existing] = await db.select().from(levelSubjects).where(eq(levelSubjects.id, id));
      return existing;
    }
    
    const [updated] = await db
      .update(levelSubjects)
      .set(updateData)
      .where(eq(levelSubjects.id, id))
      .returning();
    return updated;
  }

  // Learning Objectives
  async getLearningObjectives(levelSubjectId: string): Promise<LearningObjective[]> {
    return db.select().from(learningObjectives)
      .where(eq(learningObjectives.levelSubjectId, levelSubjectId))
      .orderBy(learningObjectives.weekNumber, learningObjectives.sortOrder);
  }

  async getLearningObjectiveById(id: string): Promise<LearningObjective | undefined> {
    const [lo] = await db.select().from(learningObjectives).where(eq(learningObjectives.id, id));
    return lo;
  }

  async createLearningObjective(lo: InsertLearningObjective): Promise<LearningObjective> {
    const [created] = await db.insert(learningObjectives).values(lo).returning();
    return created;
  }

  async updateLearningObjectivePages(id: string, data: { textbookStartPage?: number; textbookEndPage?: number }): Promise<LearningObjective | undefined> {
    const [updated] = await db
      .update(learningObjectives)
      .set(data)
      .where(eq(learningObjectives.id, id))
      .returning();
    return updated;
  }

  // Weekly Resources
  async getResourcesByObjective(learningObjectiveId: string): Promise<WeeklyResource[]> {
    return db.select().from(weeklyResources)
      .where(eq(weeklyResources.learningObjectiveId, learningObjectiveId))
      .orderBy(weeklyResources.sortOrder);
  }

  async getResourceById(id: string): Promise<WeeklyResource | undefined> {
    const [resource] = await db.select().from(weeklyResources).where(eq(weeklyResources.id, id));
    return resource;
  }

  async createResource(resource: InsertWeeklyResource): Promise<WeeklyResource> {
    const [created] = await db.insert(weeklyResources).values(resource).returning();
    return created;
  }

  async updateResource(id: string, resource: Partial<InsertWeeklyResource>): Promise<WeeklyResource | undefined> {
    const [updated] = await db
      .update(weeklyResources)
      .set({ ...resource, updatedAt: new Date() })
      .where(eq(weeklyResources.id, id))
      .returning();
    return updated;
  }

  async deleteResourcesByObjective(learningObjectiveId: string): Promise<void> {
    await db.delete(weeklyResources).where(eq(weeklyResources.learningObjectiveId, learningObjectiveId));
  }

  // Enrollments
  async getEnrollmentsByUser(userId: string): Promise<Enrollment[]> {
    return db.select().from(enrollments).where(eq(enrollments.userId, userId));
  }

  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const [created] = await db.insert(enrollments).values(enrollment).returning();
    return created;
  }

  // Student Progress
  async getProgressByUser(userId: string): Promise<StudentProgress[]> {
    return db.select().from(studentProgress).where(eq(studentProgress.userId, userId));
  }

  async markResourceComplete(progress: InsertStudentProgress): Promise<StudentProgress> {
    const [created] = await db.insert(studentProgress).values(progress).returning();
    return created;
  }

  // User Profiles
  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    return profile;
  }

  async createOrUpdateUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const existing = await this.getUserProfile(profile.userId);
    if (existing) {
      const [updated] = await db
        .update(userProfiles)
        .set(profile)
        .where(eq(userProfiles.userId, profile.userId))
        .returning();
      return updated;
    }
    const [created] = await db.insert(userProfiles).values(profile).returning();
    return created;
  }

  // Program Calendar
  async getProgramCalendar(levelId: string): Promise<ProgramCalendar | undefined> {
    const [calendar] = await db.select().from(programCalendar).where(eq(programCalendar.levelId, levelId));
    return calendar;
  }

  async createProgramCalendar(calendar: InsertProgramCalendar): Promise<ProgramCalendar> {
    const [created] = await db.insert(programCalendar).values(calendar).returning();
    return created;
  }

  // Module Evaluations
  async getModuleEvaluations(learningObjectiveId: string): Promise<ModuleEvaluation[]> {
    return db.select().from(moduleEvaluations)
      .where(eq(moduleEvaluations.learningObjectiveId, learningObjectiveId))
      .orderBy(moduleEvaluations.evaluationNumber);
  }

  async createModuleEvaluation(evaluation: InsertModuleEvaluation): Promise<ModuleEvaluation> {
    const [created] = await db.insert(moduleEvaluations).values(evaluation).returning();
    return created;
  }

  async upsertEvaluationHtml(objectiveId: string, evaluationNumber: number, htmlContent: string): Promise<ModuleEvaluation> {
    const existing = await db.select().from(moduleEvaluations)
      .where(and(
        eq(moduleEvaluations.learningObjectiveId, objectiveId),
        eq(moduleEvaluations.evaluationNumber, evaluationNumber)
      ))
      .limit(1);
    
    if (existing.length > 0) {
      const [updated] = await db.update(moduleEvaluations)
        .set({ htmlContent })
        .where(eq(moduleEvaluations.id, existing[0].id))
        .returning();
      return updated;
    } else {
      const releaseDay = evaluationNumber % 2 === 1 ? 3 : 5;
      const releaseWeek = evaluationNumber <= 2 ? 1 : 2;
      
      const [created] = await db.insert(moduleEvaluations).values({
        learningObjectiveId: objectiveId,
        evaluationNumber,
        title: `Evaluación Formativa ${evaluationNumber}`,
        releaseDay,
        releaseWeek,
        htmlContent,
      }).returning();
      return created;
    }
  }

  async getEvaluationHtml(objectiveId: string, evaluationNumber: number): Promise<ModuleEvaluation | undefined> {
    const [evaluation] = await db.select().from(moduleEvaluations)
      .where(and(
        eq(moduleEvaluations.learningObjectiveId, objectiveId),
        eq(moduleEvaluations.evaluationNumber, evaluationNumber)
      ))
      .limit(1);
    return evaluation;
  }

  async getModuleEvaluationById(id: string): Promise<ModuleEvaluation | undefined> {
    const [evaluation] = await db.select().from(moduleEvaluations)
      .where(eq(moduleEvaluations.id, id))
      .limit(1);
    return evaluation;
  }

  async upsertEvaluationQuestions(
    objectiveId: string, 
    evaluationNumber: number, 
    questionsJson: string, 
    totalQuestions: number
  ): Promise<ModuleEvaluation> {
    const existing = await db.select().from(moduleEvaluations)
      .where(and(
        eq(moduleEvaluations.learningObjectiveId, objectiveId),
        eq(moduleEvaluations.evaluationNumber, evaluationNumber)
      ))
      .limit(1);
    
    if (existing.length > 0) {
      const [updated] = await db.update(moduleEvaluations)
        .set({ 
          questionsJson, 
          totalQuestions,
          passingScore: 60,
          generatedAt: new Date()
        })
        .where(eq(moduleEvaluations.id, existing[0].id))
        .returning();
      return updated;
    } else {
      const releaseDay = evaluationNumber % 2 === 1 ? 3 : 5;
      const releaseWeek = evaluationNumber <= 2 ? 1 : 2;
      
      const [created] = await db.insert(moduleEvaluations).values({
        learningObjectiveId: objectiveId,
        evaluationNumber,
        title: `Evaluación Formativa ${evaluationNumber}`,
        releaseDay,
        releaseWeek,
        questionsJson,
        totalQuestions,
        passingScore: 60,
        generatedAt: new Date(),
      }).returning();
      return created;
    }
  }

  // Evaluation Progress
  async getEvaluationProgressByUser(userId: string, evaluationIds?: string[]): Promise<EvaluationProgress[]> {
    if (evaluationIds && evaluationIds.length > 0) {
      return db.select().from(evaluationProgress)
        .where(and(
          eq(evaluationProgress.userId, userId),
          inArray(evaluationProgress.evaluationId, evaluationIds)
        ));
    }
    return db.select().from(evaluationProgress)
      .where(eq(evaluationProgress.userId, userId));
  }

  async getUserCompletedModules(userId: string, levelSubjectId: string): Promise<number[]> {
    const objectivesForSubject = await db.select({ id: learningObjectives.id, weekNumber: learningObjectives.weekNumber })
      .from(learningObjectives)
      .where(eq(learningObjectives.levelSubjectId, levelSubjectId));
    
    if (objectivesForSubject.length === 0) return [];
    
    const objectiveIds = objectivesForSubject.map(o => o.id);
    
    const eval2s = await db.select()
      .from(moduleEvaluations)
      .where(and(
        inArray(moduleEvaluations.learningObjectiveId, objectiveIds),
        eq(moduleEvaluations.evaluationNumber, 2)
      ));
    
    if (eval2s.length === 0) return [];
    
    const eval2Ids = eval2s.map(e => e.id);
    
    const completedEvals = await db.select()
      .from(evaluationProgress)
      .where(and(
        eq(evaluationProgress.userId, userId),
        inArray(evaluationProgress.evaluationId, eval2Ids),
        eq(evaluationProgress.passed, true)
      ));
    
    const completedEvalIds = new Set(completedEvals.map(e => e.evaluationId));
    
    const completedModules: number[] = [];
    for (const eval2 of eval2s) {
      if (completedEvalIds.has(eval2.id)) {
        const objective = objectivesForSubject.find(o => o.id === eval2.learningObjectiveId);
        if (objective) {
          completedModules.push(objective.weekNumber);
        }
      }
    }
    
    return completedModules.sort((a, b) => a - b);
  }

  async markEvaluationComplete(progress: InsertEvaluationProgress): Promise<EvaluationProgress> {
    const [created] = await db.insert(evaluationProgress).values(progress).returning();
    return created;
  }

  async saveEvaluationAttempt(
    userId: string,
    evaluationId: string,
    totalCorrect: number,
    totalQuestions: number,
    answersJson: string,
    passed: boolean
  ): Promise<EvaluationProgress> {
    const score = Math.round((totalCorrect / totalQuestions) * 100);
    
    const [created] = await db.insert(evaluationProgress).values({
      userId,
      evaluationId,
      completedAt: new Date(),
      score,
      totalCorrect,
      totalQuestions,
      answersJson,
      passed,
    }).returning();
    return created;
  }

  async updateLearningObjectiveModuleInfo(
    id: string, 
    data: { moduleOAs?: string | null; moduleContents?: string | null; moduleDateRange?: string | null; wordDocUrl?: string | null }
  ): Promise<LearningObjective | undefined> {
    const [updated] = await db
      .update(learningObjectives)
      .set(data)
      .where(eq(learningObjectives.id, id))
      .returning();
    return updated;
  }

  // ===== TEXTBOOK CONFIGURATION METHODS =====
  
  async getAllTextbookConfigs(): Promise<TextbookConfig[]> {
    return db.select().from(textbookConfigs);
  }

  async getTextbookConfigBySubject(subjectId: string): Promise<TextbookConfig | undefined> {
    const results = await db.select().from(textbookConfigs)
      .where(eq(textbookConfigs.subjectId, subjectId))
      .limit(1);
    return results[0];
  }

  async createTextbookConfig(data: InsertTextbookConfig): Promise<TextbookConfig> {
    const result = await db.insert(textbookConfigs).values(data).returning();
    return result[0];
  }

  async updateTextbookConfig(id: string, data: Partial<InsertTextbookConfig>): Promise<TextbookConfig> {
    const result = await db.update(textbookConfigs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(textbookConfigs.id, id))
      .returning();
    return result[0];
  }

  async deleteTextbookConfig(id: string): Promise<void> {
    await db.delete(textbookConfigs).where(eq(textbookConfigs.id, id));
  }

  // Reservations
  async getAllReservations(): Promise<Reservation[]> {
    return db.select().from(reservations).orderBy(reservations.createdAt);
  }

  async getReservationById(id: string): Promise<Reservation | undefined> {
    const [reservation] = await db.select().from(reservations).where(eq(reservations.id, id));
    return reservation;
  }

  async createReservation(data: InsertReservation): Promise<Reservation> {
    // Ensure all required NOT NULL fields have values
    const reservationData: any = {
      ...data,
      // Map new fields to old fields if old fields are not provided (required NOT NULL fields)
      fullName: data.fullName || data.guardianFullName || data.studentFullName || "Por completar",
      rut: data.rut || data.guardianRut || data.studentRut || "Por completar",
      email: data.email || data.guardianEmail || data.studentEmail || "no-email@barkley.cl",
      phone: data.phone || "Por completar",
      dateOfBirth: data.dateOfBirth || "Por completar",
      programType: data.programType || "focus",
    };
    
    const [reservation] = await db.insert(reservations).values(reservationData).returning();
    return reservation;
  }

  async updateReservationStatus(id: string, status: string): Promise<Reservation | undefined> {
    const [updated] = await db.update(reservations)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(reservations.id, id))
      .returning();
    return updated;
  }

  async deleteReservation(id: string): Promise<void> {
    await db.delete(reservations).where(eq(reservations.id, id));
  }

  // Plan Configurations
  async getAllPlanConfigurations(): Promise<PlanConfiguration[]> {
    return db.select().from(planConfigurations).where(eq(planConfigurations.isActive, true)).orderBy(planConfigurations.sortOrder);
  }

  async getPlanConfigurationByKey(planKey: string): Promise<PlanConfiguration | undefined> {
    const [plan] = await db.select().from(planConfigurations).where(eq(planConfigurations.planKey, planKey));
    return plan;
  }

  async createPlanConfiguration(data: InsertPlanConfiguration): Promise<PlanConfiguration> {
    const [plan] = await db.insert(planConfigurations).values(data).returning();
    return plan;
  }

  async updatePlanConfiguration(id: string, data: Partial<InsertPlanConfiguration>): Promise<PlanConfiguration | undefined> {
    const [updated] = await db.update(planConfigurations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(planConfigurations.id, id))
      .returning();
    return updated;
  }

  async deletePlanConfiguration(id: string): Promise<void> {
    await db.delete(planConfigurations).where(eq(planConfigurations.id, id));
  }

  async initializeDefaultPlans(): Promise<void> {
    const existing = await this.getAllPlanConfigurations();
    if (existing.length > 0) return; // Ya hay planes configurados

    const defaultPlans = [
      {
        planKey: "asincrono_pro",
        planName: "Plan Asincrónico Pro",
        planSubtitle: "Jóvenes (7° a 4° Medio)",
        monthlyPrice: 65000,
        enrollmentPrice: 90000,
        annualTotal: 870000, // 12 * 65000 + 90000
        academicLoad: "15 Módulos",
        evaluationsDetail: "75 Quizzes y 2 Ensayos por asignatura",
        subjects: '["Lenguaje","Matemática","Historia","Ciencias","Inglés"]',
        description: "Preparación completa para Exámenes Libres con acceso 24/7 a contenido estructurado.",
        category: "Validación de Estudios",
        linkText: "Más Información",
        isActive: true,
        sortOrder: 1,
      },
      {
        planKey: "asincrono_tutor",
        planName: "Plan Asincrónico + Tutor",
        planSubtitle: "Acompañamiento Personalizado",
        monthlyPrice: 105000,
        enrollmentPrice: 90000,
        annualTotal: 1350000, // 12 * 105000 + 90000
        academicLoad: "15 Módulos",
        evaluationsDetail: "75 Quizzes y 2 Ensayos por asignatura",
        subjects: '["Lenguaje","Matemática","Historia","Ciencias","Inglés"]',
        description: "Incluye sesiones individuales con tutor académico para resolver dudas y reforzar aprendizaje.",
        category: "Validación de Estudios",
        linkText: "Más Información",
        isActive: true,
        sortOrder: 2,
      },
      {
        planKey: "academic_mentor",
        planName: "Plan Academic Mentor",
        planSubtitle: "Mentoría Académica Premium",
        monthlyPrice: 80000,
        enrollmentPrice: 0,
        annualTotal: 960000, // 12 * 80000
        academicLoad: "15 Módulos",
        evaluationsDetail: "75 Quizzes y 2 Ensayos por asignatura",
        subjects: '["Lenguaje","Matemática","Historia","Ciencias","Inglés"]',
        description: "Plan sin matrícula con mentoría personalizada enfocada en desarrollo de habilidades ejecutivas.",
        category: "Validación de Estudios",
        linkText: "Más Información",
        isActive: true,
        sortOrder: 3,
      },
    ];

    for (const plan of defaultPlans) {
      await this.createPlanConfiguration(plan);
    }
  }

  // Site Configuration
  async getAllSiteConfigurations(): Promise<SiteConfiguration[]> {
    return db.select().from(siteConfiguration);
  }

  async getSiteConfigurationByKey(configKey: string): Promise<SiteConfiguration | undefined> {
    const [config] = await db.select().from(siteConfiguration).where(eq(siteConfiguration.configKey, configKey));
    return config;
  }

  async upsertSiteConfiguration(data: InsertSiteConfiguration): Promise<SiteConfiguration> {
    const existing = await this.getSiteConfigurationByKey(data.configKey);
    
    if (existing) {
      const [updated] = await db.update(siteConfiguration)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(siteConfiguration.configKey, data.configKey))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(siteConfiguration).values(data).returning();
      return created;
    }
  }

  async initializeDefaultSiteConfig(): Promise<void> {
    const defaultConfigs = [
      {
        configKey: "header_description",
        configValue: "Barkley Institute ofrece un ecosistema educativo de alto rendimiento para la Validación de Estudios (Exámenes Libres) en las 5 asignaturas exigidas por el Mineduc: Lenguaje, Matemática, Historia, Ciencias Naturales e Inglés.",
        configType: "text",
        description: "Descripción principal del header de la landing page",
      },
      {
        configKey: "important_notice_4medio",
        configValue: "Importante: Los alumnos de 4° Medio y estudiantes de Educación Superior deben validar directamente en el Ministerio de Educación.",
        configType: "text",
        description: "Aviso importante para estudiantes de 4° Medio y Educación Superior",
      },
    ];

    for (const config of defaultConfigs) {
      await this.upsertSiteConfiguration(config);
    }
  }

  // Adult Cycle Configurations
  async getAllAdultCycleConfigurations(): Promise<AdultCycleConfiguration[]> {
    return db.select().from(adultCycleConfigurations).where(eq(adultCycleConfigurations.isActive, true)).orderBy(adultCycleConfigurations.sortOrder);
  }

  async getAdultCycleConfigurationByKey(cycleKey: string): Promise<AdultCycleConfiguration | undefined> {
    const [cycle] = await db.select().from(adultCycleConfigurations).where(eq(adultCycleConfigurations.cycleKey, cycleKey));
    return cycle;
  }

  async createAdultCycleConfiguration(data: InsertAdultCycleConfiguration): Promise<AdultCycleConfiguration> {
    const [cycle] = await db.insert(adultCycleConfigurations).values(data).returning();
    return cycle;
  }

  async updateAdultCycleConfiguration(id: string, data: Partial<InsertAdultCycleConfiguration>): Promise<AdultCycleConfiguration | undefined> {
    const [updated] = await db.update(adultCycleConfigurations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(adultCycleConfigurations.id, id))
      .returning();
    return updated;
  }

  async deleteAdultCycleConfiguration(id: string): Promise<void> {
    await db.delete(adultCycleConfigurations).where(eq(adultCycleConfigurations.id, id));
  }

  async initializeDefaultAdultCycles(): Promise<void> {
    const existing = await this.getAllAdultCycleConfigurations();
    if (existing.length > 0) return;

    const defaultCycles = [
      {
        cycleKey: "cycle_1_june",
        cycleName: "Ciclo 1 (Junio)",
        monthlyPrice: 45000,
        enrollmentPrice: 15000,
        totalPrice: 195000, // 4 * 45000 + 15000
        durationMonths: 4,
        modulesCount: 6,
        quizzesTotal: 24, // 6 módulos * 4 quizzes
        essaysCount: 1,
        academicLoad: "6 Módulos, 24 Quizzes Totales y 1 Ensayo General Final",
        basicaDS10: '["Lenguaje","Matemática","Ciencias Naturales","Historia y Geografía"]',
        basicaDS257: '["Lenguaje","Matemática","Ciencias Naturales","Historia y Geografía"]',
        mediaDS257: '["Lenguaje","Matemática","Ciencias Naturales","Historia y Geografía","Inglés"]',
        isActive: true,
        sortOrder: 1,
      },
      {
        cycleKey: "cycle_2_october",
        cycleName: "Ciclo 2 (Octubre)",
        monthlyPrice: 45000,
        enrollmentPrice: 15000,
        totalPrice: 375000, // 8 * 45000 + 15000
        durationMonths: 8,
        modulesCount: 15,
        quizzesTotal: 60, // 15 módulos * 4 quizzes
        essaysCount: 2,
        academicLoad: "15 Módulos, 60 Quizzes Totales y 2 Ensayos Generales Finales",
        basicaDS10: '["Lenguaje","Matemática","Ciencias Naturales","Historia y Geografía"]',
        basicaDS257: '["Lenguaje","Matemática","Ciencias Naturales","Historia y Geografía"]',
        mediaDS257: '["Lenguaje","Matemática","Ciencias Naturales","Historia y Geografía","Inglés"]',
        isActive: true,
        sortOrder: 2,
      },
    ];

    for (const cycle of defaultCycles) {
      await this.createAdultCycleConfiguration(cycle);
    }
  }

  // ============================================
  // Gemini Copilots Methods
  // ============================================

  async getAllGeminiCopilots() {
    return await db.select().from(geminiCopilots).orderBy(desc(geminiCopilots.createdAt));
  }

  async getGeminiCopilotById(id: string) {
    const result = await db.select().from(geminiCopilots).where(eq(geminiCopilots.id, id)).limit(1);
    return result[0] || null;
  }

  async getGeminiCopilotByLevel(levelId: string) {
    const allCopilots = await db.select().from(geminiCopilots).where(eq(geminiCopilots.isActive, true));
    
    // Find copilot that includes this level
    const matchingCopilot = allCopilots.find(copilot => {
      try {
        const levelIds = JSON.parse(copilot.levelIds || "[]");
        return levelIds.includes(levelId);
      } catch {
        return false;
      }
    });

    return matchingCopilot || null;
  }

  async createGeminiCopilot(data: InsertGeminiCopilot) {
    const validated = insertGeminiCopilotSchema.parse(data);
    const result = await db.insert(geminiCopilots).values(validated).returning();
    return result[0];
  }

  async updateGeminiCopilot(id: string, data: Partial<InsertGeminiCopilot>) {
    const validated = insertGeminiCopilotSchema.partial().parse(data);
    const result = await db
      .update(geminiCopilots)
      .set({ ...validated, updatedAt: new Date() })
      .where(eq(geminiCopilots.id, id))
      .returning();
    return result[0] || null;
  }

  async deleteGeminiCopilot(id: string) {
    await db.delete(geminiCopilots).where(eq(geminiCopilots.id, id));
  }

  async toggleGeminiCopilotStatus(id: string) {
    const current = await this.getGeminiCopilotById(id);
    if (!current) return null;

    const result = await db
      .update(geminiCopilots)
      .set({ isActive: !current.isActive, updatedAt: new Date() })
      .where(eq(geminiCopilots.id, id))
      .returning();
    return result[0] || null;
  }

  // ============================================
  // Level-Based Plan Configurations Methods
  // ============================================

  async getAllLevelPlanConfigurations() {
    return await db.select().from(levelPlanConfigurations).orderBy(levelPlanConfigurations.sortOrder);
  }

  async getLevelPlanConfigurationById(id: string) {
    const result = await db.select().from(levelPlanConfigurations).where(eq(levelPlanConfigurations.id, id)).limit(1);
    return result[0] || null;
  }

  async getLevelPlanConfigurationByKey(levelGroupKey: string) {
    const result = await db.select().from(levelPlanConfigurations).where(eq(levelPlanConfigurations.levelGroupKey, levelGroupKey)).limit(1);
    return result[0] || null;
  }

  async createLevelPlanConfiguration(data: InsertLevelPlanConfiguration) {
    const validated = insertLevelPlanConfigurationSchema.parse(data);
    const result = await db.insert(levelPlanConfigurations).values(validated).returning();
    return result[0];
  }

  async updateLevelPlanConfiguration(id: string, data: Partial<InsertLevelPlanConfiguration>) {
    const validated = insertLevelPlanConfigurationSchema.partial().parse(data);
    const result = await db
      .update(levelPlanConfigurations)
      .set({ ...validated, updatedAt: new Date() })
      .where(eq(levelPlanConfigurations.id, id))
      .returning();
    return result[0] || null;
  }

  async deleteLevelPlanConfiguration(id: string) {
    await db.delete(levelPlanConfigurations).where(eq(levelPlanConfigurations.id, id));
  }

  async initializeDefaultLevelPlans() {
    const existing = await this.getAllLevelPlanConfigurations();
    if (existing.length > 0) return;

    const defaultPlans: InsertLevelPlanConfiguration[] = [
      // MENORES DE EDAD
      {
        levelGroupKey: "7b-2m_menores",
        levelGroupName: "7° Básico a 2° Medio",
        programType: "menores",
        levelsIncluded: '["7b","8b","1m","2m"]',
        monthlyPriceFull: 115000,
        monthlyPriceStandard: 95000,
        monthlyPriceTutor: 75000,
        enrollmentPrice: 90000,
        modules: 15,
        evaluationsPerModule: 4,
        totalEvaluations: 60,
        essays: 2,
        sessionsPerMonth: 2,
        subjects: '["Lenguaje","Matemática","Ciencias Naturales","Historia y Geografía","Inglés"]',
        isActive: true,
        sortOrder: 1,
      },
      {
        levelGroupKey: "3m-4m_menores",
        levelGroupName: "3° y 4° Medio",
        programType: "menores",
        levelsIncluded: '["3m","4m"]',
        monthlyPriceFull: 115000,
        monthlyPriceStandard: 95000,
        monthlyPriceTutor: 75000,
        enrollmentPrice: 90000,
        modules: 15,
        evaluationsPerModule: 4,
        totalEvaluations: 60,
        essays: 2,
        sessionsPerMonth: 2,
        subjects: '["Lenguaje","Matemática","Educación Ciudadana","Filosofía","Ciencias para la Ciudadanía","Inglés"]',
        isActive: true,
        sortOrder: 2,
      },
      // ADULTOS (EPJA)
      {
        levelGroupKey: "nb1-nb2_adultos",
        levelGroupName: "Primer y Segundo Nivel Básico (1° a 6°)",
        programType: "adultos",
        levelsIncluded: '["nb1","nb2"]',
        monthlyPriceFull: 45000,
        monthlyPriceStandard: 35000,
        monthlyPriceTutor: 25000,
        enrollmentPrice: 15000,
        modules: 15,
        evaluationsPerModule: 4,
        totalEvaluations: 60,
        essays: 2,
        sessionsPerMonth: 2,
        subjects: '["Lengua Castellana y Comunicación","Educación Matemática","Ciencias Naturales","Estudios Sociales"]',
        isActive: true,
        sortOrder: 3,
      },
      {
        levelGroupKey: "nb3-nm1_adultos",
        levelGroupName: "Tercer Nivel Básico y Primer Ciclo Medio (7° a 2° Medio)",
        programType: "adultos",
        levelsIncluded: '["nb3","nm1"]',
        monthlyPriceFull: 45000,
        monthlyPriceStandard: 35000,
        monthlyPriceTutor: 25000,
        enrollmentPrice: 15000,
        modules: 15,
        evaluationsPerModule: 4,
        totalEvaluations: 60,
        essays: 2,
        sessionsPerMonth: 2,
        subjects: '["Lengua Castellana y Comunicación","Educación Matemática","Ciencias Naturales","Estudios Sociales","Inglés"]',
        isActive: true,
        sortOrder: 4,
      },
      {
        levelGroupKey: "nm2_adultos",
        levelGroupName: "Segundo Ciclo Medio (3° y 4° Medio)",
        programType: "adultos",
        levelsIncluded: '["nm2"]',
        monthlyPriceFull: 45000,
        monthlyPriceStandard: 35000,
        monthlyPriceTutor: 25000,
        enrollmentPrice: 15000,
        modules: 15,
        evaluationsPerModule: 4,
        totalEvaluations: 60,
        essays: 2,
        sessionsPerMonth: 2,
        subjects: '["Lengua Castellana y Comunicación","Educación Matemática","Ciencias Naturales","Estudios Sociales","Filosofía"]',
        isActive: true,
        sortOrder: 5,
      },
    ];

    for (const plan of defaultPlans) {
      await this.createLevelPlanConfiguration(plan);
    }
  }
}

export const storage = new DatabaseStorage();
