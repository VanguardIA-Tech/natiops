import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma, SyncPageErrorStatus, SyncStatus, SyncType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SyncService {
  constructor(private readonly prisma: PrismaService) {}

  async createPendingRun(type: SyncType) {
    const running = await this.prisma.syncRun.findFirst({
      where: { type, status: { in: [SyncStatus.PENDING, SyncStatus.RUNNING] } },
    });
    if (running) {
      throw new ConflictException('Já existe sincronização em andamento');
    }
    return this.prisma.syncRun.create({
      data: { type, status: SyncStatus.PENDING },
    });
  }

  async acquirePendingRun(type: SyncType) {
    return this.prisma.$transaction(async (tx) => {
      const pending = await tx.syncRun.findFirst({
        where: { type, status: SyncStatus.PENDING },
        orderBy: { createdAt: 'asc' },
      });
      if (!pending) {
        return null;
      }
      return tx.syncRun.update({
        where: { id: pending.id },
        data: {
          status: SyncStatus.RUNNING,
          startedAt: new Date(),
          errorMessage: null,
        },
      });
    });
  }

  async updateRunProgress(id: string, page: number, currentItemId?: string) {
    await this.prisma.syncRun.update({
      where: { id },
      data: {
        currentPage: page,
        currentItemId,
      },
    });
  }

  async completeRun(id: string) {
    await this.prisma.syncRun.update({
      where: { id },
      data: {
        status: SyncStatus.SUCCESS,
        finishedAt: new Date(),
      },
    });
  }

  async failRun(id: string, error: unknown) {
    await this.prisma.syncRun.update({
      where: { id },
      data: {
        status: SyncStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : String(error),
        finishedAt: new Date(),
      },
    });
  }

  async upsertCheckpoint(type: SyncType, page: number, runId?: string) {
    await this.prisma.syncCheckpoint.upsert({
      where: { type },
      create: {
        type,
        page,
        syncRunId: runId,
      },
      update: {
        page,
        syncRunId: runId,
      },
    });
  }

  async recordAudit(runId: string, externalId: string, action: string, payload: Prisma.InputJsonValue, hash: string) {
    await this.prisma.syncAudit.create({
      data: {
        syncRunId: runId,
        externalId,
        action,
        payload,
        hash,
      },
    });
  }

  async recordAuditBatch(
    runId: string,
    entries: Array<{ externalId: string; action: string; payload: Prisma.InputJsonValue; hash: string }>,
  ) {
    if (entries.length === 0) return;
    await this.prisma.syncAudit.createMany({
      data: entries.map((e) => ({
        syncRunId: runId,
        externalId: e.externalId,
        action: e.action,
        payload: e.payload,
        hash: e.hash,
      })),
    });
  }

  async getCheckpoint(type: SyncType) {
    return this.prisma.syncCheckpoint.findUnique({
      where: { type },
    });
  }

  async listRuns(limit = 20, offset = 0) {
    return this.prisma.syncRun.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findRunById(id: string) {
    return this.prisma.syncRun.findUnique({
      where: { id },
      include: { auditEntries: true, checkpoints: true, pageErrors: true },
    });
  }

  async recordPageError(
    syncRunId: string,
    page: number,
    httpStatus: number | null,
    errorMessage: string | null,
  ) {
    await this.prisma.syncPageError.upsert({
      where: { syncRunId_page: { syncRunId, page } },
      create: {
        syncRunId,
        page,
        httpStatus,
        errorMessage,
        attempt: 1,
        status: SyncPageErrorStatus.PENDING_RETRY,
      },
      update: {
        httpStatus,
        errorMessage,
        attempt: { increment: 1 },
        status: SyncPageErrorStatus.PENDING_RETRY,
      },
    });
  }

  async getPendingRetryPages(syncRunId: string) {
    return this.prisma.syncPageError.findMany({
      where: { syncRunId, status: SyncPageErrorStatus.PENDING_RETRY },
      orderBy: { page: 'asc' },
    });
  }

  async resolvePageError(id: string) {
    await this.prisma.syncPageError.update({
      where: { id },
      data: { status: SyncPageErrorStatus.RESOLVED },
    });
  }

  async markPagePermanentFailure(id: string) {
    await this.prisma.syncPageError.update({
      where: { id },
      data: { status: SyncPageErrorStatus.PERMANENT_FAILURE },
    });
  }

  async countPageErrors(syncRunId: string) {
    const results = await this.prisma.syncPageError.groupBy({
      by: ['status'],
      where: { syncRunId },
      _count: { status: true },
    });
    const counts: Record<string, number> = {};
    for (const r of results) {
      counts[r.status] = r._count.status;
    }
    return counts;
  }
}
